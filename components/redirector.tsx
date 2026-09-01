"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
export function Redirector({ token }: { token: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("Securing your quiz…");
  const [expired, setExpired] = useState(false);
  const redeemed = useRef(false);
  useEffect(() => {
    if (redeemed.current) return;
    redeemed.current = true;
    fetch("/api/auth/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error);
        router.replace("/quiz"); // Next.js client-side transition: no full browser reload.
      })
      .catch((error) => {
        setMessage(error.message);
        setExpired(true);
      });
  }, [router, token]);
  return (
    <main className="center">
      <section className="card expiry-card">
        <p>{message}</p>
        {expired && (
          <a className="whatsapp-button" href="https://wa.me/919495410343?text=start" target="_blank" rel="noreferrer">
            START<span>→</span>
          </a>
        )}
      </section>
    </main>
  );
}
