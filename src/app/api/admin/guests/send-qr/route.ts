import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getGuest, markQrSent } from "@/lib/db";
import { sendQrEmail } from "@/lib/mailer";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ip = clientIp(request);
    const limited = await rateLimit(`send-qr:${ip}`, 30, 60 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many send attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
      );
    }

    const body = (await request.json()) as { id?: string };
    const id = String(body.id ?? "").slice(0, 80);
    const guest = await getGuest(id);
    if (!guest) {
      return NextResponse.json({ error: "Guest not found." }, { status: 404 });
    }

    await sendQrEmail(guest);
    await markQrSent(guest.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Send QR failed:", err);
    // Don't leak SMTP / stack details to the browser.
    return NextResponse.json(
      { error: "Could not send the pass. Check the Gmail setup and try again." },
      { status: 500 },
    );
  }
}
