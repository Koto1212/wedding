import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import type { NextResponse } from "next/server";

const COOKIE_NAME = "wedding_admin";
// Door staff can only scan passes; they never get the admin cookie.
const DOOR_COOKIE_NAME = "wedding_door";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: COOKIE_MAX_AGE,
};

function getAdminPassword(): string {
  // Netlify .env imports sometimes leave a trailing newline/space.
  return (process.env.ADMIN_PASSWORD || "wedding-admin").trim();
}

function signToken(value: string): string {
  const secret = (process.env.ADMIN_SECRET || getAdminPassword()).trim();
  return createHmac("sha256", secret).update(value).digest("hex");
}

function safeEqual(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyAdminPassword(password: string): boolean {
  return safeEqual(password.trim(), getAdminPassword());
}

// The door page accepts the door password, or the admin password so the
// hosts can always scan too.
export function verifyDoorPassword(password: string): boolean {
  const door = process.env.DOOR_PASSWORD?.trim();
  if (door && safeEqual(password.trim(), door)) return true;
  return verifyAdminPassword(password);
}

// Route handlers must set cookies on the NextResponse — cookies().set()
// does not attach Set-Cookie on Netlify / Next 16 production.
export function applyAdminSession(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, signToken("authenticated"), cookieOptions);
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
}

export function applyDoorSession(response: NextResponse): void {
  response.cookies.set(DOOR_COOKIE_NAME, signToken("door"), cookieOptions);
}

export function clearDoorSessionCookie(response: NextResponse): void {
  response.cookies.set(DOOR_COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
}

async function hasSession(name: string, value: string): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(name)?.value;
  if (!token) return false;
  try {
    return safeEqual(token, signToken(value));
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return hasSession(COOKIE_NAME, "authenticated");
}

// Anyone allowed to check guests in: door staff or a signed-in host.
export async function canCheckIn(): Promise<boolean> {
  return (await hasSession(DOOR_COOKIE_NAME, "door")) || isAdminAuthenticated();
}
