import "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string; sessionVersion: string } & DefaultSession["user"];
  }
  interface User {
    sessionVersion?: string;
  }
}
