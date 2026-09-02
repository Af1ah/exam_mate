import type { NextAuthConfig } from "next-auth";

function authLoggerError(error: Error & { type?: string }) {
  if (error.type === "CredentialsSignin") return;
  console.error("[auth][error]", error);
}

export default {
  providers: [],
  pages: { signIn: "/" },
  session: { strategy: "jwt" },
  trustHost: true,
  logger: {
    error: authLoggerError,
  },
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.sessionVersion = String(token.sessionVersion ?? "");
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
