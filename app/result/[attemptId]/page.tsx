import { redirect } from "next/navigation";
import { ResultScreen } from "@/components/result-screen";
import { requirePageUserId } from "@/lib/auth/session";
import { getSubmittedAttemptResult } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const userId = await requirePageUserId();
  const { attemptId } = await params;
  const result = await getSubmittedAttemptResult(userId, attemptId);
  if (!result) redirect("/quiz");
  return <ResultScreen result={result} />;
}
