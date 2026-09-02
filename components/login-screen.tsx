"use client";

import { useActionState, useId } from "react";
import { loginWithPassword } from "@/app/actions/auth";
import { PUBLIC_CONFIG } from "@/lib/config/public";

export function LoginScreen({
  magicLinkExpired = false,
  magicLinkInvalid = false,
  sessionExpired = false,
}: {
  magicLinkExpired?: boolean;
  magicLinkInvalid?: boolean;
  sessionExpired?: boolean;
}) {
  const [state, action, pending] = useActionState(loginWithPassword, undefined);
  const emailHintId = useId();
  const errorId = useId();
  const magicNotice = magicLinkExpired
    ? "That WhatsApp link has expired or was already used. Request a new secure link to continue."
    : magicLinkInvalid
      ? "That WhatsApp link is not valid. Request a new secure link to continue."
      : null;

  return (
    <main className="auth-page">
      <section aria-labelledby="login-title" className="auth-card">
        <header className="auth-intro">
          <h1 id="login-title">Continue with {PUBLIC_CONFIG.appName}.</h1>
          <p>Sign in with the email and password you created after your first WhatsApp quiz.</p>
        </header>

        {sessionExpired ? (
          <p className="session-notice" role="status">
            Your session ended to protect your account. Sign in again to continue.
          </p>
        ) : null}

        {magicNotice ? (
          <p className="session-notice" role="alert">
            {magicNotice}
          </p>
        ) : null}

        <form action={action} aria-describedby={state?.error ? errorId : undefined} className="login-form">
          <label htmlFor="login-email">Email address</label>
          <input
            aria-describedby={emailHintId}
            autoCapitalize="none"
            autoComplete="email"
            id="login-email"
            inputMode="email"
            maxLength={254}
            name="email"
            placeholder="you@example.com"
            required
            spellCheck={false}
            type="email"
          />
          <p className="field-hint" id={emailHintId}>
            Use the address connected to your Exam Mate profile.
          </p>

          <label htmlFor="login-password">Password</label>
          <input
            aria-invalid={Boolean(state?.error)}
            autoComplete="current-password"
            id="login-password"
            maxLength={128}
            name="password"
            required
            type="password"
          />

          {state?.error ? (
            <p className="form-error" id={errorId} role="alert">
              {state.error}
            </p>
          ) : null}

          <button className="button auth-submit" disabled={pending} type="submit">
            {pending ? "Checking your account…" : "Sign in securely"}
          </button>
        </form>

        <div className="auth-divider" aria-hidden="true">
          <span>or</span>
        </div>

        <a
          className="whatsapp-button auth-whatsapp"
          href={PUBLIC_CONFIG.whatsappStartUrl}
          target="_blank"
          rel="noreferrer"
        >
          Get a secure link in WhatsApp <span aria-hidden="true">→</span>
        </a>
        <p className="auth-help">Use WhatsApp if this is your first quiz or you cannot use your password.</p>
      </section>
    </main>
  );
}
