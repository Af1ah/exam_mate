import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readQuizSession } from "@/lib/auth";

export async function requireUserId() {
  const userId = readQuizSession((await cookies()).get("quiz_session")?.value);
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

/** Server-page guard. API routes continue to use requireUserId and return their own status codes. */
export async function requirePageUserId() {
  try {
    return await requireUserId();
  } catch {
    redirect("/?session=expired");
  }
}
