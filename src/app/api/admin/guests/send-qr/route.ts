import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getGuest, markQrSent } from "@/lib/db";
import { sendQrEmail } from "@/lib/mailer";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { id?: string };
    const guest = await getGuest(String(body.id ?? ""));
    if (!guest) {
      return NextResponse.json({ error: "Guest not found." }, { status: 404 });
    }

    await sendQrEmail(guest);
    await markQrSent(guest.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send the pass.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
