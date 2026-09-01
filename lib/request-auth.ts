import { cookies } from "next/headers";
import { readQuizSession } from "@/lib/auth";

export async function requireUserId() {
  const userId = readQuizSession((await cookies()).get("quiz_session")?.value);
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
