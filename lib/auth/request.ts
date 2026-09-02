function firstForwardedAddress(value: string | null) {
  const address = value?.split(",")[0]?.trim();
  return address && address.length <= 64 ? address : null;
}

export function requestIp(request: Request) {
  return (
    firstForwardedAddress(request.headers.get("x-vercel-forwarded-for")) ??
    firstForwardedAddress(request.headers.get("x-real-ip")) ??
    firstForwardedAddress(request.headers.get("x-forwarded-for")) ??
    "unknown"
  );
}

function parseOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) throw new Error("Invalid request origin");

  const validOrigins = new Set<string>();

  const requestUrlOrigin = parseOrigin(request.url);
  if (requestUrlOrigin) validOrigins.add(requestUrlOrigin);

  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    if (forwardedProto) {
      validOrigins.add(`${forwardedProto}://${forwardedHost}`);
    } else {
      validOrigins.add(`https://${forwardedHost}`);
      validOrigins.add(`http://${forwardedHost}`);
    }
  }

  const publicUrlOrigin = parseOrigin(process.env.QUIZ_PUBLIC_URL);
  if (publicUrlOrigin) validOrigins.add(publicUrlOrigin);

  const allowedDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",").map((s) => s.trim()) ?? [];
  for (const devHost of allowedDevOrigins) {
    if (devHost) {
      validOrigins.add(`https://${devHost}`);
      validOrigins.add(`http://${devHost}`);
    }
  }

  if (!validOrigins.has(origin)) {
    throw new Error("Invalid request origin");
  }
}
