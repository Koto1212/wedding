import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  getAdminPassword,
  getDoorPassword,
  hmacSign,
  safeEqual,
} from "./secrets";

const COOKIE_NAME = "wedding_admin";
const DOOR_COOKIE_NAME = "wedding_door";
const COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours — shorter session window

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: COOKIE_MAX_AGE,
};

function makeSessionToken(role: "admin" | "door"): string {
  const exp = Date.now() + COOKIE_MAX_AGE * 1000;
  const payload = `${role}.${exp}`;
  return `${payload}.${hmacSign(payload)}`;
}

function verifySessionToken(token: string, role: "admin" | "door"): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [gotRole, expStr, sig] = parts;
  if (gotRole !== role) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const expected = hmacSign(`${gotRole}.${expStr}`);
  try {
    return safeEqual(sig, expected);
  } catch {
    return false;
  }
}

export function verifyAdminPassword(password: string): boolean {
  try {
    return safeEqual(password.trim(), getAdminPassword());
  } catch {
    return false;
  }
}

export function verifyDoorPassword(password: string): boolean {
  try {
    const door = getDoorPassword();
    if (door && safeEqual(password.trim(), door)) return true;
    return verifyAdminPassword(password);
  } catch {
    return false;
  }
}

export function authConfigError(): string | null {
  try {
    getAdminPassword();
    // Touch secret so misconfiguration fails closed at login time.
    hmacSign("probe");
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "Auth is misconfigured.";
  }
}

export function applyAdminSession(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, makeSessionToken("admin"), cookieOptions);
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
}

export function applyDoorSession(response: NextResponse): void {
  response.cookies.set(DOOR_COOKIE_NAME, makeSessionToken("door"), cookieOptions);
}

export function clearDoorSessionCookie(response: NextResponse): void {
  response.cookies.set(DOOR_COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
}

async function hasSession(name: string, role: "admin" | "door"): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(name)?.value;
  if (!token) return false;
  return verifySessionToken(token, role);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return hasSession(COOKIE_NAME, "admin");
}

export async function canCheckIn(): Promise<boolean> {
  return (await hasSession(DOOR_COOKIE_NAME, "door")) || isAdminAuthenticated();
}
