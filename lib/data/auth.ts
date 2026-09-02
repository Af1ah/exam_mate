import "server-only";

import { AUTH_POLICY } from "@/lib/auth/constants";
import { newId } from "@/lib/auth/crypto";
import { db } from "@/prisma/db";

// Prisma Next's generated dynamic ORM namespace does not expose model keys statically yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const orm = db.orm.public as any;
const now = () => new Date().toISOString();
type MagicLinkFields = { usedAt: { isNull: () => unknown } };

export async function findOrCreateUser(phone: string) {
  const existing = await orm.User.where({ phone }).first();
  return existing ?? orm.User.create({ id: newId(), phone, createdAt: now(), updatedAt: now() });
}

export async function findUserByEmail(email: string) {
  return orm.User.where({ email }).first();
}

export async function getUser(userId: string) {
  return orm.User.first({ id: userId });
}

export async function setPassword(userId: string, email: string, passwordHash: string) {
  const user = await getUser(userId);
  if (!user) throw new Error("User not found");

  return orm.User.where({ id: userId }).update({
    email,
    passwordHash,
    // Initial enrollment keeps the active magic-link session. Later changes revoke old JWTs.
    sessionVersion: user.passwordHash ? user.sessionVersion + 1 : user.sessionVersion,
    updatedAt: now(),
  });
}

export async function createMagicLink(userId: string, secretHash: string) {
  const id = newId();
  await orm.MagicLink.create({
    id,
    userId,
    secretHash,
    expiresAt: new Date(Date.now() + AUTH_POLICY.magicLinkTtlMs).toISOString(),
    createdAt: now(),
  });
  return id;
}

export async function getMagicLink(id: string) {
  return orm.MagicLink.first({ id });
}

/** Returns false when another request already consumed the same one-time link. */
export async function consumeMagicLink(id: string) {
  const updated = await orm.MagicLink.where({ id })
    .where((link: MagicLinkFields) => link.usedAt.isNull())
    .update({ usedAt: now() });
  return Array.isArray(updated) ? updated.length === 1 : Boolean(updated);
}
