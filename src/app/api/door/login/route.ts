import { NextResponse } from "next/server";
import { setDoorSession, verifyDoorPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    if (!verifyDoorPassword(String(body.password ?? ""))) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }
    await setDoorSession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Sign-in failed." }, { status: 500 });
  }
}
