import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  createGuest,
  deleteGuest,
  listGuests,
  markWhatsappSent,
  setCheckedIn,
  summarizeGuests,
  updateGuest,
} from "@/lib/db";
import { getGoogleAccount, isGoogleConfigured } from "@/lib/google";
import { isMailConfigured, whatsappLink } from "@/lib/mailer";
import type { RsvpStatus } from "@/lib/types";

const VALID_STATUS: RsvpStatus[] = ["attending", "declined", "maybe", "pending"];

async function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  const guests = await listGuests();
  return NextResponse.json({
    guests: guests.map((g) => ({ ...g, whatsappLink: whatsappLink(g) })),
    summary: summarizeGuests(guests),
    mailConfigured: await isMailConfigured(),
    google: {
      available: isGoogleConfigured(),
      email: (await getGoogleAccount())?.email ?? null,
    },
  });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const status = (String(body.status ?? "pending") as RsvpStatus) || "pending";
    const guestCount = Number(body.guestCount ?? 1);
    const mealPreference = String(body.mealPreference ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!VALID_STATUS.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const guest = await createGuest({
      name,
      email,
      phone,
      status,
      guestCount,
      mealPreference,
      message,
    });

    return NextResponse.json({ guest }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create guest." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id ?? "");
    if (!id) {
      return NextResponse.json({ error: "Guest id is required." }, { status: 400 });
    }

    if (typeof body.checkedIn === "boolean") {
      const guest = await setCheckedIn(id, body.checkedIn);
      if (!guest) {
        return NextResponse.json({ error: "Guest not found." }, { status: 404 });
      }
      return NextResponse.json({ guest });
    }

    if (body.whatsappSent === true) {
      await markWhatsappSent(id);
      return NextResponse.json({ ok: true });
    }

    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = String(body.name);
    if (body.email !== undefined) patch.email = String(body.email);
    if (body.phone !== undefined) patch.phone = String(body.phone);
    if (body.status !== undefined) {
      const status = String(body.status) as RsvpStatus;
      if (!VALID_STATUS.includes(status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      patch.status = status;
    }
    if (body.guestCount !== undefined) patch.guestCount = Number(body.guestCount);
    if (body.mealPreference !== undefined) {
      patch.mealPreference = String(body.mealPreference);
    }
    if (body.message !== undefined) patch.message = String(body.message);

    const guest = await updateGuest(id, patch);
    if (!guest) {
      return NextResponse.json({ error: "Guest not found." }, { status: 404 });
    }

    return NextResponse.json({ guest });
  } catch {
    return NextResponse.json({ error: "Could not update guest." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Guest id is required." }, { status: 400 });
    }

    const ok = await deleteGuest(id);
    if (!ok) {
      return NextResponse.json({ error: "Guest not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete guest." }, { status: 500 });
  }
}
