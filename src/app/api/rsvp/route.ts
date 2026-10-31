import { NextResponse } from "next/server";
import { createGuest, markQrSent } from "@/lib/db";
import { content, isLocale, type Locale } from "@/lib/i18n";
import { isMailConfigured, sendQrEmail } from "@/lib/mailer";
import { toWhatsappNumber } from "@/lib/phone";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import type { RsvpStatus } from "@/lib/types";
import { clampString, isValidEmail, LIMITS } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let locale: Locale = "en";
  try {
    const ip = clientIp(request);
    const limited = await rateLimit(`rsvp:${ip}`, 12, 60 * 60 * 1000, {
      failOpen: true,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many replies from this network. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    if (isLocale(body.locale)) locale = body.locale;
    const errors = content(locale).rsvp.errors;
    const fail = (error: string) => NextResponse.json({ error }, { status: 400 });

    const name = clampString(body.name, LIMITS.name);
    const email = clampString(body.email, LIMITS.email).toLowerCase();
    const phone = clampString(body.phone, LIMITS.phone);
    const status = String(body.status ?? "pending") as RsvpStatus;
    const guestCount = Number(body.guestCount ?? 1);
    const message = clampString(body.message, LIMITS.message);

    if (!name || name.length < 2) return fail(errors.name);

    if (!email && !phone) return fail(errors.contact);
    if (email && !isValidEmail(email)) return fail(errors.email);
    if (phone && !toWhatsappNumber(phone)) return fail(errors.phone);

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
