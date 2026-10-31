import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "wedding_admin";
// Door staff can only scan passes; they never get the admin cookie.
const DOOR_COOKIE_NAME = "wedding_door";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "wedding-admin";
}

function signToken(value: string): string {
  const secret = process.env.ADMIN_SECRET || getAdminPassword();
  return createHmac("sha256", secret).update(value).digest("hex");
}

function safeEqual(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyAdminPassword(password: string): boolean {
  return safeEqual(password, getAdminPassword());
}

// The door page accepts the door password, or the admin password so the
// hosts can always scan too.
export function verifyDoorPassword(password: string): boolean {
  const door = process.env.DOOR_PASSWORD;
  if (door && safeEqual(password, door)) return true;
  return verifyAdminPassword(password);
}

async function setSession(name: string, value: string): Promise<void> {
  const jar = await cookies();
  jar.set(name, signToken(value), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
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

export async function setAdminSession(): Promise<void> {
  await setSession(COOKIE_NAME, "authenticated");
}

export async function clearAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return hasSession(COOKIE_NAME, "authenticated");
}

export async function setDoorSession(): Promise<void> {
  await setSession(DOOR_COOKIE_NAME, "door");
}

export async function clearDoorSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(DOOR_COOKIE_NAME);
}

// Anyone allowed to check guests in: door staff or a signed-in host.
export async function canCheckIn(): Promise<boolean> {
  return (await hasSession(DOOR_COOKIE_NAME, "door")) || isAdminAuthenticated();
}
