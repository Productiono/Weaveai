import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import type { Cookies } from '@sveltejs/kit'
import { db, users } from '$lib/server/db/index.js'
import { eq } from 'drizzle-orm'
import { verifyToken } from '$lib/server/email-verification.js'
import { sendEmailVerificationCode } from '$lib/server/email.js'
import {
  EMAIL_VERIFICATION_CODE_TTL_MS,
  EMAIL_VERIFICATION_RESEND_COOLDOWN_MS,
  EMAIL_VERIFICATION_SESSION_COOKIE,
  EMAIL_VERIFICATION_SESSION_TTL_MS,
  generateEmailVerificationState,
  hashEmailVerificationSessionToken,
  updateUserEmailVerificationState,
  verifyEmailVerificationCode
} from '$lib/server/email-verification-code.js'
import { checkEmailVerificationRateLimit, getClientIP } from '$lib/server/rate-limiting.js'
import { SecurityLogger } from '$lib/server/security-monitoring.js'
import { AUTH_ERRORS, sanitizeErrorForLogging } from '$lib/utils/error-handling.js'

type VerificationUser = {
  id: string
  email: string | null
  name: string | null
  emailVerified: Date | null
  emailVerificationCodeHash: string | null
  emailVerificationCodeExpiresAt: Date | null
  emailVerificationSessionHash: string | null
  emailVerificationSessionExpiresAt: Date | null
  emailVerificationLastSentAt: Date | null
}

const maskEmail = (email: string) => {
  const [name, domain] = email.split('@')
  if (!domain) {
    return email
  }
  const visible = name.length > 2 ? name.slice(0, 2) : name.slice(0, 1)
  return `${visible}${'*'.repeat(Math.max(1, name.length - visible.length))}@${domain}`
}

const fetchVerificationUser = async (userId: string) => {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      emailVerified: users.emailVerified,
      emailVerificationCodeHash: users.emailVerificationCodeHash,
      emailVerificationCodeExpiresAt: users.emailVerificationCodeExpiresAt,
      emailVerificationSessionHash: users.emailVerificationSessionHash,
      emailVerificationSessionExpiresAt: users.emailVerificationSessionExpiresAt,
      emailVerificationLastSentAt: users.emailVerificationLastSentAt
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return user
}

const resolveVerificationUser = async (locals: App.Locals, cookies: Cookies) => {
  const session = await locals.auth()
  if (session?.user?.id) {
    const user = await fetchVerificationUser(session.user.id)
    return { user, isSession: true }
  }

  const sessionToken = cookies.get(EMAIL_VERIFICATION_SESSION_COOKIE)
  if (!sessionToken) {
    return { user: null, isSession: false }
  }

  const sessionHash = hashEmailVerificationSessionToken(sessionToken)
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      emailVerified: users.emailVerified,
      emailVerificationCodeHash: users.emailVerificationCodeHash,
      emailVerificationCodeExpiresAt: users.emailVerificationCodeExpiresAt,
      emailVerificationSessionHash: users.emailVerificationSessionHash,
      emailVerificationSessionExpiresAt: users.emailVerificationSessionExpiresAt,
      emailVerificationLastSentAt: users.emailVerificationLastSentAt
    })
    .from(users)
    .where(eq(users.emailVerificationSessionHash, sessionHash))
    .limit(1)

  if (!user) {
    return { user: null, isSession: false }
  }

  if (user.emailVerificationSessionExpiresAt && user.emailVerificationSessionExpiresAt < new Date()) {
    return { user: null, isSession: false }
  }

  return { user, isSession: false }
}

export const load: PageServerLoad = async ({ url, locals, cookies }) => {
  const token = url.searchParams.get('token')

  if (token) {
    const result = await verifyToken(token)
    if (result.success) {
      throw redirect(302, '/registration-done')
    }

    return {
      verification: {
        canVerify: false,
        message: result.message
      }
    }
  }

  const { user } = await resolveVerificationUser(locals, cookies)

  if (user?.emailVerified) {
    throw redirect(302, '/registration-done')
  }

  return {
    verification: {
      canVerify: !!user,
      email: user?.email ? maskEmail(user.email) : null
    }
  }
}

export const actions: Actions = {
  verify: async ({ request, locals, cookies }) => {
    const data = await request.formData()
    const rawCode = String(data.get('code') || '').replace(/\s+/g, '')

    if (!/^\d{6}$/.test(rawCode)) {
      return fail(400, { error: 'Enter the 6-digit code from your email.' })
    }

    const { user } = await resolveVerificationUser(locals, cookies)

    if (!user || !user.email) {
      return fail(400, { error: AUTH_ERRORS.VERIFICATION_ERROR })
    }

    if (user.emailVerified) {
      throw redirect(302, '/registration-done')
    }

    if (!user.emailVerificationCodeHash || !user.emailVerificationCodeExpiresAt) {
      return fail(400, { error: 'No active verification code. Please request a new one.' })
    }

    if (new Date() > user.emailVerificationCodeExpiresAt) {
      await db
        .update(users)
        .set({
          emailVerificationCodeHash: null,
          emailVerificationCodeExpiresAt: null
        })
        .where(eq(users.id, user.id))
      SecurityLogger.emailVerificationFailure(user.email, 'Verification code expired')
      return fail(400, { error: 'That code has expired. Request a new one.' })
    }

    const isValid = await verifyEmailVerificationCode(rawCode, user.emailVerificationCodeHash)
    if (!isValid) {
      SecurityLogger.emailVerificationFailure(user.email, 'Invalid verification code')
      return fail(400, { error: 'Invalid code. Please try again.' })
    }

    await db
      .update(users)
      .set({
        emailVerified: new Date(),
        emailVerificationCodeHash: null,
        emailVerificationCodeExpiresAt: null,
        emailVerificationSessionHash: null,
        emailVerificationSessionExpiresAt: null,
        emailVerificationLastSentAt: null
      })
      .where(eq(users.id, user.id))

    cookies.delete(EMAIL_VERIFICATION_SESSION_COOKIE, { path: '/' })
    SecurityLogger.emailVerificationSuccess(user.id, user.email)

    throw redirect(302, '/registration-done')
  },
  resend: async ({ locals, cookies, request }) => {
    const { user } = await resolveVerificationUser(locals, cookies)

    if (!user || !user.email) {
      return fail(400, { resendError: AUTH_ERRORS.VERIFICATION_ERROR })
    }

    if (user.emailVerified) {
      throw redirect(302, '/registration-done')
    }

    const lastSentAt = user.emailVerificationLastSentAt?.getTime() ?? 0
    const remainingMs = EMAIL_VERIFICATION_RESEND_COOLDOWN_MS - (Date.now() - lastSentAt)
    if (remainingMs > 0) {
      const remainingSeconds = Math.ceil(remainingMs / 1000)
      return fail(429, {
        resendError: `Please wait ${remainingSeconds}s before requesting a new code.`
      })
    }

    const rateLimit = checkEmailVerificationRateLimit(user.email, getClientIP(request))
    if (!rateLimit.allowed) {
      return fail(429, {
        resendError: rateLimit.message || 'Too many verification attempts. Please try again later.'
      })
    }

    const sessionToken = cookies.get(EMAIL_VERIFICATION_SESSION_COOKIE) || undefined
    const verificationState = await generateEmailVerificationState(sessionToken)

    try {
      await updateUserEmailVerificationState(user.id, verificationState)
      await sendEmailVerificationCode({
        email: user.email,
        name: user.name || user.email.split('@')[0],
        code: verificationState.code,
        expiresInMinutes: Math.round(EMAIL_VERIFICATION_CODE_TTL_MS / 60000)
      })
      SecurityLogger.emailVerificationSent(user.email, user.id)
    } catch (error) {
      const sanitizedError = sanitizeErrorForLogging(error)
      console.error('Failed to resend verification code:', sanitizedError)
      SecurityLogger.emailVerificationFailure(user.email, 'Failed to resend verification code')
      return fail(500, { resendError: AUTH_ERRORS.VERIFICATION_ERROR })
    }

    cookies.set(EMAIL_VERIFICATION_SESSION_COOKIE, verificationState.sessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: Math.floor(EMAIL_VERIFICATION_SESSION_TTL_MS / 1000)
    })

    return {
      resendSuccess: true,
      resendMessage: 'A new verification code has been sent.'
    }
  }
}
