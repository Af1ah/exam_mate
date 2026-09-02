"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { redeemMagicLink } from "@/app/actions/auth";
import { PUBLIC_CONFIG } from "@/lib/config/public";
export function Redirector({ token }: { token: string }) {
  const [message, setMessage] = useState("Securing your quiz…");
  const [expired, setExpired] = useState(false);
  const redeemed = useRef(false);
  const [, startTransition] = useTransition();
  useEffect(() => {
    if (redeemed.current) return;
    redeemed.current = true;
    startTransition(async () => {
      try {
        const result = await redeemMagicLink(token);
        if (result.error) throw new Error(result.error);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to sign in.");
        setExpired(true);
      }
    });
  }, [token]);
  return (
    <main className="center">
      <section className="card expiry-card">
        <p aria-live="polite" className={expired ? "error" : undefined} role={expired ? "alert" : "status"}>
          {message}
        </p>
        {expired ? (
          <a className="whatsapp-button" href={PUBLIC_CONFIG.whatsappStartUrl} target="_blank" rel="noreferrer">
            Request a new WhatsApp link <span aria-hidden="true">→</span>
          </a>
        ) : null}
      </section>
    </main>
  );
}
