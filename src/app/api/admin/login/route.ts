import { NextResponse } from "next/server";
import { setAdminSession, verifyAdminPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    const password = String(body.password ?? "");

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    await setAdminSession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
