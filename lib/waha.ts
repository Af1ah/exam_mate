import "server-only";

import { getWahaConfig } from "@/lib/config/server";

const WAHA_POLICY = Object.freeze({
  replyDelayMinimumMs: 2_000,
  replyDelayPerCharacterMs: 24,
  replyDelayMaximumMs: 7_000,
  postReplyPresenceMs: 120_000,
  requestTimeoutMs: 15_000,
});

const replyDelay = (text: string) => {
  return Math.min(
    WAHA_POLICY.replyDelayMaximumMs,
    Math.max(WAHA_POLICY.replyDelayMinimumMs, Math.round(text.length * WAHA_POLICY.replyDelayPerCharacterMs)),
  );
};

const pause = (duration: number) => new Promise<void>((resolve) => setTimeout(resolve, duration));

async function requestWaha(path: string, body: Record<string, unknown>) {
  const { baseUrl, apiKey } = getWahaConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(WAHA_POLICY.requestTimeoutMs),
  });
  if (!response.ok) throw new Error(`WAHA request failed (${response.status})`);
}

async function sendText(chatId: string, text: string) {
  const { baseUrl, apiKey, session } = getWahaConfig();
  const response = await fetch(`${baseUrl}/api/sendText`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
    body: JSON.stringify({ session, chatId, text, linkPreview: true }),
    signal: AbortSignal.timeout(WAHA_POLICY.requestTimeoutMs),
  });
  if (!response.ok) throw new Error(`WAHA send failed (${response.status})`);
}

export async function sendWhatsApp(chatId: string, text: string) {
  const { session } = getWahaConfig();
  await requestWaha(`/api/${session}/presence`, { presence: "online" });
  await requestWaha("/api/sendSeen", { session, chatId });
  await requestWaha(`/api/${session}/presence`, { chatId, presence: "typing" });
  await pause(replyDelay(text));
  await sendText(chatId, text);
}

/** Stops the conversational presence after the user has had time to see the reply. */
export async function clearWhatsAppPresence(chatId: string) {
  const { session } = getWahaConfig();
  await pause(WAHA_POLICY.postReplyPresenceMs);
  await requestWaha(`/api/${session}/presence`, { chatId, presence: "paused" });
}
