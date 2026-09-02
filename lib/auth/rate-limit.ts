import "server-only";

import { createHmac, randomUUID } from "node:crypto";
import { AUTH_POLICY } from "@/lib/auth/constants";
import { getAuthSecret } from "@/lib/config/server";
import { db } from "@/prisma/db";

// Prisma Next's generated dynamic ORM namespace does not expose model keys statically yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const orm = db.orm.public as any;

export class RateLimitExceededError extends Error {
  constructor() {
    super("Rate limit exceeded");
    this.name = "RateLimitExceededError";
  }
}

/** Durable throttling shared by every application instance in this environment. */
export async function consumeRateLimit(action: string, identifier: string) {
  const keyHash = createHmac("sha256", getAuthSecret()).update(identifier).digest("base64url");
  const now = Date.now();
  let record = await orm.AuthRateLimit.where({ action, keyHash }).first();

  if (!record) {
    try {
      await orm.AuthRateLimit.create({
        id: randomUUID(),
        action,
        keyHash,
        attempts: 1,
        windowStartedAt: new Date(now).toISOString(),
        createdAt: new Date(now).toISOString(),
        updatedAt: new Date(now).toISOString(),
      });
      return;
    } catch {
      record = await orm.AuthRateLimit.where({ action, keyHash }).first();
    }
  }

  if (!record) throw new Error("Unable to enforce rate limit");
  if (record.blockedUntil && Date.parse(record.blockedUntil) > now) throw new RateLimitExceededError();

  const withinWindow = now - Date.parse(record.windowStartedAt) < AUTH_POLICY.rateLimit.windowMs;
  const attempts = withinWindow ? record.attempts + 1 : 1;
  const blockedUntil =
    attempts > AUTH_POLICY.rateLimit.maxAttempts ? new Date(now + AUTH_POLICY.rateLimit.blockMs).toISOString() : null;

  await orm.AuthRateLimit.where({ id: record.id }).update({
    attempts,
    blockedUntil,
    windowStartedAt: withinWindow ? record.windowStartedAt : new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  });

  if (blockedUntil) throw new RateLimitExceededError();
}
