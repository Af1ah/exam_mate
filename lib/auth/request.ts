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

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) throw new Error("Invalid request origin");
}
