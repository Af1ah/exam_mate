import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginScreen } from "@/components/login-screen";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ magic?: string; session?: string }> }) {
  const [session, query] = await Promise.all([auth(), searchParams]);
  if (session?.user?.id) redirect("/quiz");
  return (
    <LoginScreen
      magicLinkExpired={query.magic === "expired"}
      magicLinkInvalid={query.magic === "invalid"}
      sessionExpired={query.session === "expired"}
    />
  );
}
