import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/request-auth";
import { submitAttempt } from "@/lib/store";
export async function POST(_: Request, ctx: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await ctx.params;
    return NextResponse.json(await submitAttempt(await requireUserId(), attemptId));
  } catch {
    return NextResponse.json({ error: "Unable to submit quiz" }, { status: 400 });
  }
}
