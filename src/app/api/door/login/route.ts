import { NextResponse } from "next/server";
import { applyDoorSession, verifyDoorPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    if (!verifyDoorPassword(String(body.password ?? ""))) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    applyDoorSession(response);
    return response;
  } catch {
    return NextResponse.json({ error: "Sign-in failed." }, { status: 500 });
  }
}
