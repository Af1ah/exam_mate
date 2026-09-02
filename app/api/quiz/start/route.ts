import { NextResponse } from "next/server";
import { requireMutationUserId } from "@/lib/auth/session";
import { startAttempt } from "@/lib/store";
export async function POST(request: Request) {
  try {
    return NextResponse.json(await startAttempt(await requireMutationUserId(request)));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start quiz" },
      { status: 400 },
    );
  }
}
