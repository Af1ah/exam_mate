import { redirect } from "next/navigation";
import { QuizApp } from "@/components/quiz-app";
import { requirePageUserId } from "@/lib/request-auth";
import { getUser, getUserDashboard } from "@/lib/store";
export default async function QuizPage({ searchParams }: { searchParams: Promise<{ newAttempt?: string }> }) {
  const userId = await requirePageUserId();
  const [user, dashboard, query] = await Promise.all([getUser(userId), getUserDashboard(userId), searchParams]);
  const profileComplete = Boolean(user?.name && user?.dateOfBirth && user?.examGoal);
  if (profileComplete && dashboard.attemptedToday && query.newAttempt !== "1") redirect("/dashboard");
  return <QuizApp profileComplete={profileComplete} nextQuiz={dashboard.nextQuiz} />;
}
