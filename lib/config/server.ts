import "server-only";

export class ServerConfigurationError extends Error {
  constructor(variable: string) {
    super(`${variable} is required`);
    this.name = "ServerConfigurationError";
  }
}

function required(variable: string) {
  const value = process.env[variable]?.trim();
  if (!value) throw new ServerConfigurationError(variable);
  return value;
}

function requiredUrl(variable: string) {
  const value = required(variable);
  try {
    return new URL(value);
  } catch {
    throw new ServerConfigurationError(`${variable} (valid URL)`);
  }
}

export function getAuthSecret() {
  const secret = required("AUTH_SECRET");
  if (Buffer.byteLength(secret, "utf8") < 32) throw new ServerConfigurationError("AUTH_SECRET (at least 32 bytes)");
  return secret;
}

export function getPublicOrigin() {
  const url = requiredUrl("QUIZ_PUBLIC_URL");
  return url.origin;
}

export function getWahaWebhookSecret() {
  return required("WAHA_WEBHOOK_SECRET");
}

export function getWahaConfig() {
  const baseUrl = requiredUrl("WHATSAPP_API_URL");
  return {
    baseUrl: baseUrl.toString().replace(/\/$/, ""),
    apiKey: required("WHATSAPP_API_KEY"),
    session: required("WHATSAPP_INSTANCE_NAME"),
  };
}
