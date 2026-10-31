import { NextResponse } from "next/server";
import { clearDoorSessionCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearDoorSessionCookie(response);
  return response;
}
