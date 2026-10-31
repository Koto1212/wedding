import { NextResponse } from "next/server";
import { clearDoorSession } from "@/lib/auth";

export async function POST() {
  await clearDoorSession();
  return NextResponse.json({ ok: true });
}
