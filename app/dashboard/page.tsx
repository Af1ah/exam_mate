import { DashboardScreen } from "@/components/dashboard-screen";
import { requirePageUserId } from "@/lib/request-auth";
import { getUserDashboard } from "@/lib/store";
export default async function DashboardPage() {
  const userId = await requirePageUserId();
  return <DashboardScreen dashboard={await getUserDashboard(userId)} />;
}
