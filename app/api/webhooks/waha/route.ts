import { after, NextResponse } from "next/server";
import { createMagicLink, findOrCreateUser } from "@/lib/store";
import { hashSecret, newMagicSecret, validWahaSignature } from "@/lib/auth";
import { clearWhatsAppPresence, sendWhatsApp } from "@/lib/waha";

export const runtime = "nodejs";

async function reply(chatId: string, text: string) {
  await sendWhatsApp(chatId, text);
  after(async () => {
    await clearWhatsAppPresence(chatId).catch(() => undefined);
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!validWahaSignature(rawBody, request.headers.get("x-webhook-hmac")))
    return new NextResponse("Invalid signature", { status: 401 });
  const event = JSON.parse(rawBody);
  const payload = event?.payload;
  if (event?.event !== "message" || payload?.fromMe || payload?.hasMedia || !payload?.body || !payload?.from)
    return NextResponse.json({ ok: true });
  const user = await findOrCreateUser(payload.from.replace(/@(c\.us|lid)$/, ""));
  if (payload.body.trim().toLowerCase() !== "start") {
    await reply(payload.from, 'Welcome to Exam Mate. Type "start" to receive today’s private 10-question quiz link.');
    return NextResponse.json({ ok: true });
  }
  const secret = newMagicSecret();
  const linkId = await createMagicLink(user.id, await hashSecret(secret));
  const publicOrigin = process.env.QUIZ_PUBLIC_URL ?? new URL(request.url).origin;
  await reply(
    payload.from,
    `Today’s private quiz link: ${publicOrigin}/q/${linkId}.${secret}\n\nThis link expires in 15 minutes. If it expires, send START again. You get one quiz attempt each day.`,
  );
  return NextResponse.json({ ok: true });
}
