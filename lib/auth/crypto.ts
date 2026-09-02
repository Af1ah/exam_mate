import "server-only";

import bcrypt from "bcryptjs";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { AUTH_POLICY } from "@/lib/auth/constants";
import { getWahaWebhookSecret } from "@/lib/config/server";

export const newId = () => randomUUID();
export const newMagicSecret = () => randomBytes(24).toString("base64url");
export const hashSecret = (value: string) => bcrypt.hash(value, AUTH_POLICY.bcryptCost);
export const verifySecret = (value: string, hash: string) => bcrypt.compare(value, hash);

export function validWahaSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = Buffer.from(createHmac("sha512", getWahaWebhookSecret()).update(rawBody).digest("hex"));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
