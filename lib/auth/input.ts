import { AUTH_POLICY } from "@/lib/auth/constants";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[1-9]\d{7,14}$/;

export function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(email) && email.length <= 254 ? email : null;
}

export function normalizePhone(value: unknown) {
  if (typeof value !== "string") return null;
  const phone = value.replace(/[^\d+]/g, "");
  return PHONE_PATTERN.test(phone) ? phone.replace(/^\+/, "") : null;
}

export function readPassword(value: unknown, minimumLength = 1) {
  if (typeof value !== "string") return null;
  return value.length >= minimumLength && value.length <= AUTH_POLICY.passwordMaxLength ? value : null;
}

export function readRequiredText(value: unknown, maximumLength: number) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text && text.length <= maximumLength ? text : null;
}

export function readDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value || date > new Date() ? null : value;
}
