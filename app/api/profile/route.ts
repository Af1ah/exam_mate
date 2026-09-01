import { NextResponse } from "next/server";
import { getUser, getUserDashboard, saveProfile } from "@/lib/store";
import { requireUserId } from "@/lib/request-auth";
export async function GET() {
  try {
    const userId = await requireUserId();
    const [user, dashboard] = await Promise.all([getUser(userId), getUserDashboard(userId)]);
    return NextResponse.json({ complete: Boolean(user?.name && user?.dateOfBirth && user?.examGoal), dashboard });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { name, dateOfBirth, examGoal } = await request.json();
    if (![name, dateOfBirth, examGoal].every((v) => typeof v === "string" && v.trim()))
      return NextResponse.json({ error: "Complete all fields" }, { status: 400 });
    await saveProfile(userId, { name: name.trim(), dateOfBirth, examGoal: examGoal.trim() });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
