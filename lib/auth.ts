import bcrypt from "bcryptjs";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";

const jwtSecret = () => {
  const value = process.env.QUIZ_JWT_SECRET;
  if (!value) throw new Error("QUIZ_JWT_SECRET is required");
  return value;
};

export const newId = () => randomUUID();
export const newMagicSecret = () => randomBytes(12).toString("base64url");
export const hashSecret = (value: string) => bcrypt.hash(value, 12);
export const verifySecret = (value: string, hash: string) => bcrypt.compare(value, hash);

export const signQuizSession = (userId: string) =>
  jwt.sign({ sub: userId, purpose: "quiz" }, jwtSecret(), { expiresIn: "8h" });

export const readQuizSession = (token: string | undefined) => {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, jwtSecret());
    return typeof payload === "object" && payload.sub ? String(payload.sub) : null;
  } catch {
    return null;
  }
};

export const validWahaSignature = (rawBody: string, signature: string | null) => {
  const secret = process.env.WAHA_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = Buffer.from(createHmac("sha512", secret).update(rawBody).digest("hex"));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
};
