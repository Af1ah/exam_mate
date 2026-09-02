import type { NextAuthConfig } from "next-auth";

function authLoggerError(error: Error & { type?: string }) {
  if (error.type === "CredentialsSignin") return;
  console.error("[auth][error]", error);
}

const useSecure =
  process.env.NODE_ENV === "production" ||
  process.env.QUIZ_PUBLIC_URL?.startsWith("https://") ||
  process.env.NEXTAUTH_URL?.startsWith("https://") ||
  process.env.AUTH_URL?.startsWith("https://");

export default {
  useSecureCookies: Boolean(useSecure),
  providers: [],
  pages: { signIn: "/" },
  session: { strategy: "jwt" },
  trustHost: true,
  logger: {
    error: authLoggerError,
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sessionVersion = user.sessionVersion;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? token.sub ?? "";
        session.user.sessionVersion = String(token.sessionVersion ?? "");
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
