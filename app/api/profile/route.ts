import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { AUTH_POLICY } from "@/lib/auth/constants";
import { normalizeEmail, readDate, readPassword, readRequiredText } from "@/lib/auth/input";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { requireMutationUserId, requireUserId } from "@/lib/auth/session";
import { getUser, setPassword } from "@/lib/data/auth";
import { getUserDashboard, saveProfile } from "@/lib/store";
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
    const userId = await requireMutationUserId(request);
    const { name, dateOfBirth, examGoal, email, password } = await request.json();
    const normalizedName = readRequiredText(name, 80);
    const normalizedDateOfBirth = readDate(dateOfBirth);
    const normalizedExamGoal = readRequiredText(examGoal, 120);
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = readPassword(password, AUTH_POLICY.passwordMinLength);
    if (!normalizedName || !normalizedDateOfBirth || !normalizedExamGoal || !normalizedEmail || !normalizedPassword)
      return NextResponse.json(
        {
          error: `Complete every field. Passwords must be ${AUTH_POLICY.passwordMinLength}–${AUTH_POLICY.passwordMaxLength} characters.`,
        },
        { status: 400 },
      );
    await consumeRateLimit("password-enrollment", userId);
    await saveProfile(userId, {
      name: normalizedName,
      dateOfBirth: normalizedDateOfBirth,
      examGoal: normalizedExamGoal,
    });
    await setPassword(userId, normalizedEmail, await bcrypt.hash(normalizedPassword, AUTH_POLICY.bcryptCost));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to save your profile" }, { status: 400 });
  }
}
