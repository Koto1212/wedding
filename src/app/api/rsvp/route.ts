import { NextResponse } from "next/server";
import { createGuest, markQrSent } from "@/lib/db";
import { isMailConfigured, sendQrEmail } from "@/lib/mailer";
import { toWhatsappNumber } from "@/lib/phone";
import type { RsvpStatus } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const status = String(body.status ?? "pending") as RsvpStatus;
    const guestCount = Number(body.guestCount ?? 1);
    const message = String(body.message ?? "").trim();

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Please enter your full name." },
        { status: 400 },
      );
    }

    // Guests give one way to reach them: an email or a WhatsApp number.
    if (!email && !phone) {
      return NextResponse.json(
        { error: "Please enter your email or WhatsApp number." },
        { status: 400 },
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email." },
        { status: 400 },
      );
    }

    if (phone && !toWhatsappNumber(phone)) {
      return NextResponse.json(
        { error: "Please check your WhatsApp number (e.g. 079 123 4567)." },
        { status: 400 },
      );
    }

    // Guests answer yes or no; "maybe"/"pending" are only set by the hosts.
    if (status !== "attending" && status !== "declined") {
      return NextResponse.json(
        { error: "Please choose an attendance option." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(guestCount) || guestCount < 1 || guestCount > 10) {
      return NextResponse.json(
        { error: "Guest count must be between 1 and 10." },
        { status: 400 },
      );
    }

    const guest = await createGuest({
      name,
      email,
      phone,
      status,
      guestCount: status === "declined" ? 1 : guestCount,
      mealPreference: "",
      message,
    });

    // Attending guests get their entry QR by email. A mail failure must not
    // lose the RSVP; the hosts can resend from the dashboard.
    let emailSent = false;
    if (status === "attending" && email && (await isMailConfigured())) {
      try {
        await sendQrEmail(guest);
        await markQrSent(guest.id);
        emailSent = true;
      } catch (err) {
        console.error("Could not send entry pass to", guest.email, err);
      }
    }

    // Attending guests can open their pass right away from the thank-you card.
    const passPath =
      status === "attending" ? `/pass/${guest.checkInToken}` : null;

    return NextResponse.json({ ok: true, emailSent, passPath }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to save your RSVP right now." },
      { status: 500 },
    );
  }
}
