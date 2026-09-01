import { NextResponse } from "next/server";
import { createMagicLink, findOrCreateUser } from "@/lib/store";
import { hashSecret, newMagicSecret, validWahaSignature } from "@/lib/auth";
import { sendWhatsApp } from "@/lib/waha";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!validWahaSignature(rawBody, request.headers.get("x-webhook-hmac"))) return new NextResponse("Invalid signature", { status: 401 });
  const event = JSON.parse(rawBody); const payload = event?.payload;
  if (event?.event !== "message" || payload?.fromMe || payload?.hasMedia || !payload?.body || !payload?.from?.endsWith("@c.us")) return NextResponse.json({ ok: true });
  const user = await findOrCreateUser(payload.from.replace("@c.us", ""));
  if (payload.body.trim().toLowerCase() !== "start") { await sendWhatsApp(payload.from, 'Welcome to Exam Mate. Type "start" to begin your 10-minute quiz.'); return NextResponse.json({ ok: true }); }
  const secret = newMagicSecret(); const linkId = await createMagicLink(user.id, await hashSecret(secret));
  await sendWhatsApp(payload.from, `Your secure quiz link: ${new URL(request.url).origin}/q/${linkId}.${secret}`);
  return NextResponse.json({ ok: true });
}
