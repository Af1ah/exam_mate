import { DashboardScreen } from "@/components/dashboard-screen";
import { requirePageUserId } from "@/lib/auth/session";
import { getUserDashboard } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await requirePageUserId();
  return <DashboardScreen dashboard={await getUserDashboard(userId)} />;
}
