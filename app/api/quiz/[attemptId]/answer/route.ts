import { NextResponse } from "next/server";
import { requireMutationUserId } from "@/lib/auth/session";
import { saveAnswer } from "@/lib/store";
export async function PATCH(request: Request, ctx: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await ctx.params;
    const { questionId, selectedAnswer } = await request.json();
    if (!Number.isSafeInteger(Number(questionId)) || (selectedAnswer !== null && typeof selectedAnswer !== "string"))
      return NextResponse.json({ error: "Invalid answer" }, { status: 400 });
    await saveAnswer(await requireMutationUserId(request), attemptId, Number(questionId), selectedAnswer ?? null);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save" }, { status: 400 });
  }
}
