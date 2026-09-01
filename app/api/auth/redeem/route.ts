import { NextResponse } from "next/server";
import { consumeMagicLink, redeemMagicLink } from "@/lib/store";
import { signQuizSession, verifySecret } from "@/lib/auth";
export async function POST(request: Request) {
  const { token } = await request.json(); const [id, secret] = typeof token === "string" ? token.split(".") : [];
  const link = id && secret ? await redeemMagicLink(id) : null;
  if (!link || link.usedAt || new Date(link.expiresAt) <= new Date() || !(await verifySecret(secret, link.secretHash))) return NextResponse.json({ error: "This link has expired. Send start on WhatsApp for a new one." }, { status: 401 });
  await consumeMagicLink(id); const response = NextResponse.json({ ok: true });
  response.cookies.set("quiz_session", signQuizSession(link.userId), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 28800, path: "/" }); return response;
}
