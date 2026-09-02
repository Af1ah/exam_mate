import { describe, expect, test } from "bun:test";
import { normalizeEmail, normalizePhone, readDate, readPassword, readRequiredText } from "../lib/auth/input.ts";
import { requireSameOrigin, requestIp } from "../lib/auth/request.ts";

describe("authentication input", () => {
  test("normalizes valid email and phone values", () => {
    expect(normalizeEmail("  Student@Example.COM ")).toBe("student@example.com");
    expect(normalizePhone("+91 94954 10343")).toBe("919495410343");
  });

  test("rejects malformed and oversized credentials", () => {
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(readPassword("", 1)).toBeNull();
    expect(readPassword("x".repeat(129), 1)).toBeNull();
    expect(readRequiredText(" ", 20)).toBeNull();
  });

  test("accepts real calendar dates that are not in the future", () => {
    expect(readDate("2000-02-29")).toBe("2000-02-29");
    expect(readDate("not-a-date")).toBeNull();
    expect(readDate("2999-01-01")).toBeNull();
  });
});

describe("request boundaries", () => {
  test("requires an exact same-origin mutation", () => {
    const accepted = new Request("https://exam-mate.example.com/api/profile", {
      headers: { origin: "https://exam-mate.example.com" },
    });
    expect(() => requireSameOrigin(accepted)).not.toThrow();

    const rejected = new Request("https://exam-mate.example.com/api/profile", {
      headers: { origin: "https://attacker.example" },
    });
    expect(() => requireSameOrigin(rejected)).toThrow("Invalid request origin");
  });

  test("uses the address added by the trusted local reverse proxy", () => {
    const request = new Request("https://exam-mate.example.com", {
      headers: { "x-real-ip": "203.0.113.10", "x-forwarded-for": "203.0.113.10, 127.0.0.1" },
    });
    expect(requestIp(request)).toBe("203.0.113.10");
  });
});
