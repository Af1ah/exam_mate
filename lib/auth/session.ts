import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { requireSameOrigin } from "@/lib/auth/request";
import { getUser } from "@/lib/data/auth";

export const getCurrentUser = cache(async () => {
  const session = await auth();
  const userId = session?.user?.id;
  const sessionVersion = session?.user?.sessionVersion;
  if (!userId || !sessionVersion) return null;

  const user = await getUser(userId);
  return user && String(user.sessionVersion) === sessionVersion ? user : null;
});

export async function requireUserId() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return String(user.id);
}

export async function requireMutationUserId(request: Request) {
  requireSameOrigin(request);
  return requireUserId();
}

export async function requirePageUserId() {
  const user = await getCurrentUser();
  if (!user) redirect("/?session=expired");
  return String(user.id);
}
