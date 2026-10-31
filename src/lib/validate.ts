const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function clampString(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_RE.test(value);
}

export const LIMITS = {
  name: 120,
  email: 254,
  phone: 40,
  message: 2000,
  meal: 120,
  password: 200,
  token: 128,
} as const;
