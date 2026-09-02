import { after, NextResponse } from "next/server";
import { hashSecret, newMagicSecret, validWahaSignature } from "@/lib/auth/crypto";
import { normalizePhone } from "@/lib/auth/input";
import { RateLimitExceededError, consumeRateLimit } from "@/lib/auth/rate-limit";
import { getPublicOrigin } from "@/lib/config/server";
import { createMagicLink, findOrCreateUser } from "@/lib/data/auth";
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
  const phone = normalizePhone(payload.from.replace(/@(c\.us|lid)$/, ""));
  if (!phone) return NextResponse.json({ ok: true });

  if (payload.body.trim().toLowerCase() !== "start") {
    await reply(payload.from, 'Welcome to Exam Mate. Type "start" to receive today’s private 10-question quiz link.');
    return NextResponse.json({ ok: true });
  }

  try {
    await consumeRateLimit("magic-request", payload.from);
  } catch (error) {
    if (!(error instanceof RateLimitExceededError)) throw error;
    if (!error.alreadyBlocked) {
      await reply(payload.from, "Too many link requests. Please wait before trying again.");
    }
    return NextResponse.json({ ok: true });
  }

  const user = await findOrCreateUser(phone);
  const publicOrigin = getPublicOrigin();
  const secret = newMagicSecret();
  const linkId = await createMagicLink(user.id, await hashSecret(secret));
  await reply(
    payload.from,
    `Today’s private quiz link: ${publicOrigin}/q/${linkId}.${secret}\n\nThis link expires in 15 minutes. If it expires, send START again. You get one quiz attempt each day.`,
  );
  return NextResponse.json({ ok: true });
}
