import { redirect, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { db, users } from "$lib/server/db/index.js"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { isOAuthProviderEnabled } from '$lib/server/auth-config'
import { verifyTurnstileToken, isTurnstileEnabled, getTurnstileErrorMessage } from '$lib/server/turnstile'
import { getTurnstileSiteKey } from '$lib/server/settings-store'
import { sendEmailVerificationCode } from '$lib/server/email.js'
import {
  EMAIL_VERIFICATION_CODE_TTL_MS,
  EMAIL_VERIFICATION_SESSION_COOKIE,
  generateEmailVerificationState
} from '$lib/server/email-verification-code.js'
import { env } from '$env/dynamic/private'
import { authSanitizers, validatePasswordSafety } from '$lib/utils/sanitization.js'
import { validatePassword, BALANCED_PASSWORD_POLICY } from '$lib/utils/password-validation.js'
import { validateEmailForAuth } from '$lib/utils/email-validation.js'
import { getClientIP } from '$lib/server/rate-limiting.js'
import { SecurityLogger } from '$lib/server/security-monitoring.js'
import { handleAuthError, createAuthError, handleDatabaseError, AUTH_ERRORS, AUTH_STATUS_CODES, sanitizeErrorForLogging } from '$lib/utils/error-handling.js'

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth()

  // If user is already logged in, redirect to new chat page
  if (session?.user) {
    throw redirect(302, '/newchat')
  }

  // Load OAuth provider availability and Turnstile settings from database
  try {
    const [
      googleEnabled, 
      appleEnabled, 
      twitterEnabled, 
      facebookEnabled,
      turnstileEnabled,
      turnstileSiteKey
    ] = await Promise.all([
      isOAuthProviderEnabled('google'),
      isOAuthProviderEnabled('apple'),
      isOAuthProviderEnabled('twitter'),
      isOAuthProviderEnabled('facebook'),
      isTurnstileEnabled(),
      getTurnstileSiteKey()
    ]);
    
    const turnstileFinalSiteKey = turnstileEnabled ? (turnstileSiteKey || env.TURNSTILE_SITE_KEY || '') : '';
    
    return {
      oauthProviders: {
        google: googleEnabled,
        apple: appleEnabled,
        twitter: twitterEnabled,
        facebook: facebookEnabled
      },
      turnstile: {
        enabled: turnstileEnabled,
        siteKey: turnstileFinalSiteKey
      }
    }
  } catch (error) {
    console.error('Failed to load provider settings for register page:', error);
    
    // Fallback - assume providers are available if settings can't be loaded
    return {
      oauthProviders: {
        google: true,
        apple: true,
        twitter: true,
        facebook: true
      },
      turnstile: {
        enabled: false,
        siteKey: ''
      }
    }
  }
}

export const actions: Actions = {
  register: async ({ request, getClientAddress, cookies }) => {
    const data = await request.formData()
    const rawEmail = data.get('email') as string
    const rawPassword = data.get('password') as string
    const turnstileToken = data.get('cf-turnstile-response') as string

    // Get client IP for security logging
    const clientIP = getClientIP(request);

    // Sanitize and validate inputs for security
    const email = authSanitizers.email(rawEmail)
    const passwordSafetyCheck = validatePasswordSafety(rawPassword)

    // Basic validation
    if (!email || !passwordSafetyCheck.isValid) {
      SecurityLogger.registrationFailure(rawEmail || 'unknown', 'Invalid input data', clientIP);
      return createAuthError(AUTH_STATUS_CODES.BAD_REQUEST, AUTH_ERRORS.MISSING_FIELDS);
    }

    // Comprehensive password validation
    const passwordValidation = validatePassword(rawPassword, BALANCED_PASSWORD_POLICY, { email })

    if (!passwordValidation.isValid) {
      SecurityLogger.registrationFailure(email, 'Password validation failed', clientIP);
      return createAuthError(AUTH_STATUS_CODES.BAD_REQUEST, AUTH_ERRORS.INVALID_PASSWORD);
    }

    // Comprehensive RFC-compliant email validation
    const emailValidation = validateEmailForAuth(rawEmail)
    if (!emailValidation.isValid) {
      SecurityLogger.registrationFailure(rawEmail, 'Email validation failed', clientIP);
      return createAuthError(AUTH_STATUS_CODES.BAD_REQUEST, AUTH_ERRORS.INVALID_EMAIL);
    }

    // Use the normalized email from validation
    const validatedEmail = emailValidation.normalizedEmail
    
    // Verify Turnstile token if enabled
    const turnstileEnabled = await isTurnstileEnabled()
    if (turnstileEnabled) {
      if (!turnstileToken) {
        return createAuthError(AUTH_STATUS_CODES.BAD_REQUEST, 'Please complete the security verification');
      }

      const verification = await verifyTurnstileToken(turnstileToken, clientIP)

      if (!verification.success) {
        const sanitizedError = sanitizeErrorForLogging(verification.error);
        console.warn('Turnstile verification failed during registration:', sanitizedError);
        return createAuthError(AUTH_STATUS_CODES.BAD_REQUEST, 'Security verification failed. Please try again.');
      }
    }
    
    try {
      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, validatedEmail)).limit(1)

      if (existingUser.length > 0) {
        SecurityLogger.registrationFailure(validatedEmail, 'Account already exists', clientIP);
        // Inform user that email already exists and suggest login
        return createAuthError(AUTH_STATUS_CODES.BAD_REQUEST, AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
      }
      
      // Hash password (use the original raw password as it passed validation)
      const hashedPassword = await bcrypt.hash(rawPassword, 12)
      const verificationState = await generateEmailVerificationState()
      
      // Create user
      const newUser = await db.insert(users).values({
        email: validatedEmail,
        password: hashedPassword,
        name: validatedEmail.split('@')[0], // Use email prefix as default name
        planTier: 'free', // Set new users to free plan by default
        emailVerificationCodeHash: verificationState.codeHash,
        emailVerificationCodeExpiresAt: verificationState.expiresAt,
        emailVerificationSessionHash: verificationState.sessionHash,
        emailVerificationSessionExpiresAt: verificationState.sessionExpiresAt,
        emailVerificationLastSentAt: verificationState.lastSentAt
      }).returning({ id: users.id, email: users.email, name: users.name })
      
      // Log successful registration
      if (newUser.length > 0) {
        const userData = newUser[0]
        SecurityLogger.registrationSuccess(userData.id, userData.email!, clientIP);

        try {
          // Send verification code email
          await sendEmailVerificationCode({
            email: userData.email!,
            name: userData.name || userData.email!.split('@')[0],
            code: verificationState.code,
            expiresInMinutes: Math.round(EMAIL_VERIFICATION_CODE_TTL_MS / 60000)
          })
          SecurityLogger.emailVerificationSent(userData.email!, userData.id);
          console.log(`[Registration] Verification code email sent`)
        } catch (emailError) {
          // Log error but don't fail registration
          const sanitizedError = sanitizeErrorForLogging(emailError);
          console.error(`[Registration] Failed to send verification code email:`, sanitizedError)
          SecurityLogger.emailVerificationFailure(userData.email!, 'Failed to send verification code email');
        }
      }
      
      cookies.set(EMAIL_VERIFICATION_SESSION_COOKIE, verificationState.sessionToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
        maxAge: Math.floor((verificationState.sessionExpiresAt.getTime() - Date.now()) / 1000)
      })

      // Redirect to email verification
      throw redirect(302, '/verify-email')
      
    } catch (error) {
      // Re-throw redirects (SvelteKit redirects have a status property)
      if (typeof error === 'object' && error !== null && 'status' in error && 'location' in error) {
        throw error
      }

      // Handle database and other errors securely
      SecurityLogger.registrationFailure(validatedEmail, 'System error during registration', clientIP);
      return handleDatabaseError(error, 'user registration');
    }
  }
}
