# Authentication

Exam Mate uses Auth.js credentials providers for password and one-time WhatsApp links. Sessions are signed, HTTP-only JWT cookies. Every protected server read checks the session's user ID and verifies its `sessionVersion` against Postgres before returning user data.

## Deployment configuration

Authentication needs only two environment-specific application values:

- `AUTH_SECRET`: at least 32 random bytes, shared by every app instance in the same environment.
- `QUIZ_PUBLIC_URL`: the canonical HTTPS origin used when creating links sent through WhatsApp.
- `NEXT_ALLOWED_DEV_ORIGINS`: optional comma-separated local development tunnel hosts. Do not set this for production.

Generate an Auth.js secret with `openssl rand -base64 32`. Do not commit the generated value. WAHA credentials and `WAHA_WEBHOOK_SECRET` remain deployment secrets documented in `.env.example`.
Older local environments may still have `QUIZ_JWT_SECRET`; rename that key to `AUTH_SECRET` and keep the existing generated value.

Stable policy is intentionally source-controlled in `lib/auth/constants.ts`: eight-hour sessions, 12–128 character passwords, bcrypt cost 12, fifteen-minute magic links, and five authentication attempts per fifteen-minute window. Security headers are maintained in `next.config.ts`, not deployment variables.

## Code boundaries

- `auth.ts` and `auth.config.ts`: Auth.js integration.
- `lib/auth/`: policy, validation, cryptography, throttling, and current-session guards.
- `lib/config/server.ts`: server-only secret and endpoint validation.
- `lib/data/auth.ts`: credential and magic-link persistence.
- `proxy.ts`: optimistic redirects only; protected handlers still authenticate locally.

Apply `migrations/app/20260901T1851_authjs_password_sessions` through the normal deployment migration step before deploying this version. The application container already runs reviewed migrations before starting Next.js.
