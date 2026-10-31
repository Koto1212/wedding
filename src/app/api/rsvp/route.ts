import { NextResponse } from "next/server";
import { createGuest, markQrSent } from "@/lib/db";
import { content, isLocale, type Locale } from "@/lib/i18n";
import { isMailConfigured, sendQrEmail } from "@/lib/mailer";
import { toWhatsappNumber } from "@/lib/phone";
import type { RsvpStatus } from "@/lib/types";

export async function POST(request: Request) {
  let locale: Locale = "en";
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (isLocale(body.locale)) locale = body.locale;
    const errors = content(locale).rsvp.errors;
    const fail = (error: string) => NextResponse.json({ error }, { status: 400 });

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const status = String(body.status ?? "pending") as RsvpStatus;
    const guestCount = Number(body.guestCount ?? 1);
    const message = String(body.message ?? "").trim();

    if (!name || name.length < 2) return fail(errors.name);

    // Guests give one way to reach them: an email or a WhatsApp number.
    if (!email && !phone) return fail(errors.contact);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(errors.email);
    if (phone && !toWhatsappNumber(phone)) return fail(errors.phone);

    // Guests answer yes or no; "maybe"/"pending" are only set by the hosts.
    if (status !== "attending" && status !== "declined") return fail(errors.status);

    const guest = await createGuest({
      name,
      email,
      phone,
      locale,
      status,
      guestCount:
        status === "declined" || !Number.isFinite(guestCount)
          ? 1
          : Math.min(10, Math.max(1, guestCount)),
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
  } catch (err) {
    console.error("RSVP failed:", err);
    return NextResponse.json(
      { error: content(locale).rsvp.errors.server },
      { status: 500 },
    );
  }
}
