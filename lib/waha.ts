const config = () => {
  const baseUrl = process.env.WHATSAPP_API_URL?.replace(/\/$/, "");
  const apiKey = process.env.WHATSAPP_API_KEY;
  const session = process.env.WHATSAPP_INSTANCE_NAME;
  if (!baseUrl || !apiKey || !session) throw new Error("WAHA configuration is incomplete");
  return { baseUrl, apiKey, session };
};

export async function sendWhatsApp(chatId: string, text: string) {
  const { baseUrl, apiKey, session } = config();
  const response = await fetch(`${baseUrl}/api/sendText`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
    body: JSON.stringify({ session, chatId, text, linkPreview: true }),
  });
  if (!response.ok) throw new Error(`WAHA send failed (${response.status})`);
}
