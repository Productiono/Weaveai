import { createHash, randomBytes, randomInt } from 'crypto'
import bcrypt from 'bcryptjs'
import { db, users } from './db/index.js'
import { eq } from 'drizzle-orm'

export const EMAIL_VERIFICATION_CODE_TTL_MS = 5 * 60 * 1000
export const EMAIL_VERIFICATION_SESSION_TTL_MS = 30 * 60 * 1000
export const EMAIL_VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000
export const EMAIL_VERIFICATION_SESSION_COOKIE = 'email_verification_session'

export interface EmailVerificationState {
  code: string
  codeHash: string
  sessionToken: string
  sessionHash: string
  expiresAt: Date
  sessionExpiresAt: Date
  lastSentAt: Date
}

export function generateEmailVerificationCode(): string {
  return String(randomInt(0, 1000000)).padStart(6, '0')
}

export function generateEmailVerificationSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashEmailVerificationSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function generateEmailVerificationState(
  sessionToken?: string
): Promise<EmailVerificationState> {
  const code = generateEmailVerificationCode()
  const codeHash = await bcrypt.hash(code, 12)
  const resolvedSessionToken = sessionToken || generateEmailVerificationSessionToken()
  const sessionHash = hashEmailVerificationSessionToken(resolvedSessionToken)
  const now = new Date()

  return {
    code,
    codeHash,
    sessionToken: resolvedSessionToken,
    sessionHash,
    expiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_CODE_TTL_MS),
    sessionExpiresAt: new Date(now.getTime() + EMAIL_VERIFICATION_SESSION_TTL_MS),
    lastSentAt: now
  }
}

export async function updateUserEmailVerificationState(
  userId: string,
  state: EmailVerificationState
): Promise<void> {
  await db
    .update(users)
    .set({
      emailVerificationCodeHash: state.codeHash,
      emailVerificationCodeExpiresAt: state.expiresAt,
      emailVerificationSessionHash: state.sessionHash,
      emailVerificationSessionExpiresAt: state.sessionExpiresAt,
      emailVerificationLastSentAt: state.lastSentAt
    })
    .where(eq(users.id, userId))
}

export async function verifyEmailVerificationCode(
  code: string,
  codeHash: string
): Promise<boolean> {
  return bcrypt.compare(code, codeHash)
}
