import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/request-auth";
import { saveAnswer } from "@/lib/store";
export async function PATCH(request: Request, ctx: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await ctx.params;
    const { questionId, selectedAnswer } = await request.json();
    await saveAnswer(await requireUserId(), attemptId, Number(questionId), selectedAnswer ?? null);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to save" }, { status: 400 });
  }
}
