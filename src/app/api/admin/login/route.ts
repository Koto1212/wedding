import { NextResponse } from "next/server";
import {
  applyAdminSession,
  authConfigError,
  verifyAdminPassword,
} from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { LIMITS } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const misconfigured = authConfigError();
    if (misconfigured) {
      console.error("Admin login blocked:", misconfigured);
      return NextResponse.json(
        { error: "Server auth is misconfigured. Set ADMIN_PASSWORD and ADMIN_SECRET." },
        { status: 503 },
      );
    }

    const ip = clientIp(request);
    const limited = await rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000);
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

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    applyAdminSession(response);
    return response;
  } catch (err) {
    console.error("Admin login failed:", err);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
