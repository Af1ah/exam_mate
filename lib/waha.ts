const config = () => {
  const baseUrl = process.env.WHATSAPP_API_URL?.replace(/\/$/, "");
  const apiKey = process.env.WHATSAPP_API_KEY;
  const session = process.env.WHATSAPP_INSTANCE_NAME;
  if (!baseUrl || !apiKey || !session) throw new Error("WAHA configuration is incomplete");
  return { baseUrl, apiKey, session };
};

const replyDelay = (text: string) => {
  const minimum = Number(process.env.WAHA_REPLY_MIN_DELAY_MS ?? 2_000);
  const perCharacter = Number(process.env.WAHA_REPLY_DELAY_PER_CHARACTER_MS ?? 24);
  const maximum = Number(process.env.WAHA_REPLY_MAX_DELAY_MS ?? 7_000);
  return Math.min(maximum, Math.max(minimum, Math.round(text.length * perCharacter)));
};

const pause = (duration: number) => new Promise<void>((resolve) => setTimeout(resolve, duration));

const postReplyPresenceDelay = () => Number(process.env.WAHA_REPLY_POST_SEND_PRESENCE_MS ?? 10_000);

async function requestWaha(path: string, body: Record<string, unknown>) {
  const { baseUrl, apiKey } = config();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`WAHA request failed (${response.status})`);
}

async function sendText(chatId: string, text: string) {
  const { baseUrl, apiKey, session } = config();
  const response = await fetch(`${baseUrl}/api/sendText`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
    body: JSON.stringify({ session, chatId, text, linkPreview: true }),
  });
  if (!response.ok) throw new Error(`WAHA send failed (${response.status})`);
}

export async function sendWhatsApp(chatId: string, text: string) {
  const { session } = config();
  await requestWaha(`/api/${session}/presence`, { presence: "online" });
  await requestWaha("/api/sendSeen", { session, chatId });
  await requestWaha(`/api/${session}/presence`, { chatId, presence: "typing" });
  await pause(replyDelay(text));
  await sendText(chatId, text);
}

/** Stops the conversational presence after the user has had time to see the reply. */
export async function clearWhatsAppPresence(chatId: string) {
  const { session } = config();
  await pause(postReplyPresenceDelay());
  await requestWaha(`/api/${session}/presence`, { chatId, presence: "paused" });
}
