"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export function Redirector({ token }: { token: string }) { const router = useRouter(); const [message, setMessage] = useState("Securing your quiz…"); useEffect(() => { fetch("/api/auth/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).then(async (res) => { if (!res.ok) throw new Error((await res.json()).error); router.replace("/quiz"); }).catch((error) => setMessage(error.message)); }, [router, token]); return <main className="center"><p>{message}</p></main>; }
