import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import authConfig from "@/auth.config";
import { AUTH_POLICY } from "@/lib/auth/constants";
import { verifySecret } from "@/lib/auth/crypto";
import { normalizeEmail, readPassword } from "@/lib/auth/input";
import { DUMMY_PASSWORD_HASH } from "@/lib/auth/password";
import { RateLimitExceededError, consumeRateLimit } from "@/lib/auth/rate-limit";
import { requestIp } from "@/lib/auth/request";
import { consumeMagicLink, findUserByEmail, getMagicLink, getUser } from "@/lib/data/auth";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt", maxAge: AUTH_POLICY.sessionMaxAgeSeconds },
  providers: [
    Credentials({
      id: "password",
      name: "Email and password",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials, request) {
        const email = normalizeEmail(credentials.email);
        const password = readPassword(credentials.password);
        try {
          await consumeRateLimit("password", `${requestIp(request)}:${email ?? "invalid"}`);
        } catch (error) {
          if (error instanceof RateLimitExceededError) return null;
          throw error;
        }

        const user = email ? await findUserByEmail(email) : null;
        const passwordMatches = await bcrypt.compare(password ?? "", user?.passwordHash ?? DUMMY_PASSWORD_HASH);
        if (!email || !password || !passwordMatches || !user?.passwordHash) return null;
        return { id: user.id, email: user.email, name: user.name, sessionVersion: String(user.sessionVersion) };
      },
    }),
    Credentials({
      id: "magic-link",
      name: "WhatsApp magic link",
      credentials: { token: { label: "Token", type: "text" } },
      async authorize(credentials, request) {
        const token = typeof credentials.token === "string" ? credentials.token : "";
        try {
          await consumeRateLimit("magic-redeem", `${requestIp(request)}:${token.slice(0, 128)}`);
        } catch (error) {
          if (error instanceof RateLimitExceededError) return null;
          throw error;
        }
        const [id, secret, ...extra] = token.split(".");
        const link = id && secret && !extra.length && token.length <= 256 ? await getMagicLink(id) : null;
        if (
          !link ||
          link.usedAt ||
          Date.parse(link.expiresAt) <= Date.now() ||
          !(await verifySecret(secret, link.secretHash))
        )
          return null;
        if (!(await consumeMagicLink(id))) return null;
        const user = await getUser(link.userId);
        return user
          ? { id: user.id, email: user.email, name: user.name, sessionVersion: String(user.sessionVersion) }
          : null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) token.sessionVersion = user.sessionVersion;
      return token;
    },
  },
});
