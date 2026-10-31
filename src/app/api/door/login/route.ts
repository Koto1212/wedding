import { NextResponse } from "next/server";
import {
  applyDoorSession,
  authConfigError,
  verifyDoorPassword,
} from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { LIMITS } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const misconfigured = authConfigError();
    if (misconfigured) {
      return NextResponse.json(
        { error: "Server auth is misconfigured." },
        { status: 503 },
      );
    }

    const ip = clientIp(request);
    const limited = await rateLimit(`door-login:${ip}`, 8, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
    }

    const body = (await request.json()) as { password?: string };
    const password = String(body.password ?? "").slice(0, LIMITS.password);
    if (!verifyDoorPassword(password)) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }
    const response = NextResponse.json({ ok: true });
    applyDoorSession(response);
    return response;
  } catch (err) {
    console.error("Door login failed:", err);
    return NextResponse.json({ error: "Sign-in failed." }, { status: 500 });
  }
}
