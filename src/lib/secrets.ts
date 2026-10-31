import { createHash, createHmac, timingSafeEqual } from "crypto";

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Signing / encryption secret. Required and strong in production. */
export function getAdminSecret(): string {
  const secret = (process.env.ADMIN_SECRET || "").trim();
  if (secret.length >= 16) return secret;

  if (isProd()) {
    throw new Error(
      "ADMIN_SECRET must be set to a random string of at least 16 characters in production.",
    );
  }
  // Local-only fallback so `npm run dev` still works without full env.
  return (process.env.ADMIN_PASSWORD || "local-dev-only-secret").trim().padEnd(16, "!");
}

export function getAdminPassword(): string {
  const password = (process.env.ADMIN_PASSWORD || "").trim();
  if (password) {
    if (isProd() && password.length < 8) {
      throw new Error("ADMIN_PASSWORD must be at least 8 characters in production.");
    }
    return password;
  }
  if (isProd()) {
    throw new Error("ADMIN_PASSWORD must be set in production.");
  }
  return "wedding-admin";
}

export function getDoorPassword(): string | null {
  const door = (process.env.DOOR_PASSWORD || "").trim();
  return door || null;
}

export function hmacSign(value: string): string {
  return createHmac("sha256", getAdminSecret()).update(value).digest("hex");
}

export function safeEqual(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** AES key material derived from ADMIN_SECRET (never store the secret itself). */
export function derivedKey(): Buffer {
  return createHash("sha256").update(`wedding-inv:${getAdminSecret()}`).digest();
}
