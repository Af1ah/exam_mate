import { redirect } from "next/navigation";
import { QuizApp } from "@/components/quiz-app";
import { requirePageUserId } from "@/lib/auth/session";
import { getUser } from "@/lib/data/auth";
import { getActiveAttempt, getUserDashboard } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function QuizPage({ searchParams }: { searchParams: Promise<{ newAttempt?: string }> }) {
  const userId = await requirePageUserId();
  const [user, dashboard, activeAttempt, query] = await Promise.all([
    getUser(userId),
    getUserDashboard(userId),
    getActiveAttempt(userId),
    searchParams,
  ]);
  const profileComplete = Boolean(user?.name && user?.dateOfBirth && user?.examGoal);
  if (profileComplete && dashboard.completedToday && !activeAttempt && query.newAttempt !== "1") {
    redirect("/dashboard");
  }
  return (
    <QuizApp
      profileComplete={profileComplete}
      nextQuiz={dashboard.nextQuiz}
      initialQuiz={activeAttempt}
    />
  );
}
