import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginScreen } from "@/components/login-screen";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const [session, query] = await Promise.all([auth(), searchParams]);
  if (session?.user?.id) redirect("/dashboard");
  return <LoginScreen sessionExpired={query.session === "expired"} />;
}
