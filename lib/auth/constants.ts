export const AUTH_POLICY = Object.freeze({
  sessionMaxAgeSeconds: 8 * 60 * 60,
  passwordMinLength: 12,
  passwordMaxLength: 128,
  bcryptCost: 12,
  magicLinkTtlMs: 15 * 60 * 1_000,
  rateLimit: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1_000,
    blockMs: 15 * 60 * 1_000,
  },
});
