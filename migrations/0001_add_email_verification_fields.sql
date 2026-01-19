ALTER TABLE "user"
  ADD COLUMN "emailVerificationCodeHash" text,
  ADD COLUMN "emailVerificationCodeExpiresAt" timestamp,
  ADD COLUMN "emailVerificationSessionHash" text,
  ADD COLUMN "emailVerificationSessionExpiresAt" timestamp,
  ADD COLUMN "emailVerificationLastSentAt" timestamp;
