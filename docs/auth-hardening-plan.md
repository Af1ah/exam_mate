# Authentication hardening plan

## Goal

Make authentication predictable, secure, and easy to operate. Deployment configuration should contain only secrets and values that genuinely change between environments. Stable product and security policy belongs in typed source modules with reviewed defaults.

## Problems to correct

- Authentication policy is spread across `.env`, `auth.ts`, `auth-security.ts`, `proxy.ts`, route handlers, and UI components.
- Stable values such as session lifetime, password length, bcrypt cost, rate-limit windows, security headers, and WhatsApp reply timing are runtime configuration even though they are product policy.
- The proxy fails every production request when optional header variables are absent.
- Public UI reads deployment variables directly, making presentation conditional and hard to verify.
- `lib/store.ts` combines users, magic links, rate limits, profiles, and quiz operations.
- Auth failures are too broadly caught, so configuration or database failures can look like bad credentials.
- Magic-link verification and consumption are separate operations and need a clear one-time-consumption boundary.

## Target structure

```text
lib/
  auth/
    constants.ts       Stable password, session, token, and rate-limit policy
    crypto.ts          Password-independent token and webhook cryptography
    input.ts           Email, phone, and credential validation
    rate-limit.ts      Durable authentication throttling
    session.ts         Current-session and current-user guards
  config/
    public.ts          Non-secret product URLs used by UI
    server.ts          Validated deployment secrets and external endpoints
  data/
    auth.ts            User credentials, magic links, and auth persistence
  store.ts             Quiz/profile data only
```

The Auth.js entrypoints remain at `auth.ts` and `auth.config.ts` because they are framework integration files, but their policy and persistence dependencies move into the modules above.

## Environment contract

Keep only these application values in `.env`:

- `AUTH_SECRET`
- `QUIZ_PUBLIC_URL`
- `WAHA_WEBHOOK_SECRET`
- `WHATSAPP_API_URL`
- `WHATSAPP_API_KEY`
- `WHATSAPP_INSTANCE_NAME`

Infrastructure retains `POSTGRES_PASSWORD`, `QUESTIONS_CSV_PATH`, and the internally composed `DATABASE_URL`. Session duration, password rules, bcrypt cost, rate limits, magic-link lifetime, security headers, trusted-proxy behavior, public WhatsApp start URL, reply timing, and production attempt policy move to source-controlled constants.

## Security boundaries

1. Validate deployment secrets through one server-only module and fail with a precise configuration error.
2. Keep Auth.js JWT sessions short-lived and validate the stored `sessionVersion` against the database for protected reads and mutations.
3. Validate credentials before querying, use a fixed dummy bcrypt hash for unknown accounts, and return the same public message for every credential failure.
4. Authenticate every Server Action and route mutation at the action or handler boundary.
5. Require same-origin requests for JSON mutations and keep Auth.js Server Action origin protection in place.
6. Rate-limit password login, password enrollment, magic-link creation, and magic-link redemption with hashed identifiers.
7. Consume magic links with a conditional database write and reject a request that loses the one-time-use race.
8. Apply security headers centrally from `next.config.ts`; keep Proxy limited to optimistic route redirects.
9. Never serialize password hashes, phone numbers, rate-limit keys, tokens, or full database rows to client components.

## Presentation changes

- Keep the existing calm blue Exam Mate visual language.
- Present password sign-in as the primary returning-user path and WhatsApp as the recovery/first-use path.
- Add persistent labels, useful autocomplete, input constraints, accessible error announcements, pending state, and a clear session-expired message.
- Keep the form compact on mobile and avoid decorative UI that does not help sign-in.

## Verification

- ESLint and TypeScript must pass.
- Add focused tests for configuration validation, credential normalization, same-origin enforcement, and public error mapping where the current test setup permits.
- Run the Impeccable detector on changed UI targets once.
- Run the production build. If Turbopack is blocked by the host sandbox, report that separately from source validation.
- Review `git diff --check` and confirm no real secrets entered the working tree.
