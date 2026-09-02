import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { AUTH_POLICY } from "@/lib/auth/constants";
import { verifySecret } from "@/lib/auth/crypto";
import { RateLimitExceededError, consumeRateLimit } from "@/lib/auth/rate-limit";
import { requestIp } from "@/lib/auth/request";
import { getAuthSecret, getPublicOrigin } from "@/lib/config/server";
import { consumeMagicLink, getMagicLink, getUser } from "@/lib/data/auth";

export const runtime = "nodejs";

function parseExpiresAt(value?: string | Date | null): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  const normalized = value.includes(" ") ? value.replace(" ", "T") : value;
  const time = Date.parse(normalized);
  return isNaN(time) ? 0 : time;
}

function publicRedirect(path: string) {
  return NextResponse.redirect(new URL(path, getPublicOrigin()));
}

function loginRedirect(reason: "invalid" | "expired") {
  return publicRedirect(`/?magic=${reason}`);
}

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if ((await auth())?.user?.id) return publicRedirect("/quiz");

  const token = (await params).token;
  if (!token || token.length > 256) return loginRedirect("invalid");

  try {
    await consumeRateLimit("magic-redeem", `${requestIp(request)}:${token.slice(0, 128)}`);
  } catch (error) {
    if (error instanceof RateLimitExceededError) return loginRedirect("expired");
    throw error;
  }
  const [id, secret, ...extra] = token.split(".");
  if (!id || !secret || extra.length > 0) return loginRedirect("invalid");

  const link = await getMagicLink(id);
  if (
    !link ||
    link.usedAt ||
    parseExpiresAt(link.expiresAt) <= Date.now() ||
    !(await verifySecret(secret, link.secretHash))
  ) {
    return loginRedirect("expired");
  }

  if (!(await consumeMagicLink(id))) {
    return loginRedirect("expired");
  }

  const user = await getUser(link.userId);
  if (!user) {
    return loginRedirect("expired");
  }

  const useSecure =
    process.env.NODE_ENV === "production" ||
    process.env.QUIZ_PUBLIC_URL?.startsWith("https://") ||
    process.env.NEXTAUTH_URL?.startsWith("https://") ||
    process.env.AUTH_URL?.startsWith("https://");

  const cookieName = useSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
  const jwt = await encode({
    token: {
      sub: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      sessionVersion: String(user.sessionVersion),
    },
    secret: getAuthSecret(),
    salt: cookieName,
    maxAge: AUTH_POLICY.sessionMaxAgeSeconds,
  });

  const response = NextResponse.redirect(new URL("/quiz", getPublicOrigin()));
  response.cookies.set(cookieName, jwt, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: Boolean(useSecure),
    maxAge: AUTH_POLICY.sessionMaxAgeSeconds,
  });

  return response;
}
