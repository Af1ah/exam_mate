import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/request-auth";
import { startAttempt } from "@/lib/store";
export async function POST() {
  try {
    return NextResponse.json(await startAttempt(await requireUserId()));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start quiz" },
      { status: 400 },
    );
  }
}
