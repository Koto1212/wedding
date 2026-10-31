import { randomBytes, randomUUID } from "crypto";
import { readJSON, updateJSON } from "./store";
import type { Guest, GuestInput } from "./types";

// The whole guest list is one stored JSON array.
const GUESTS_KEY = "guests";

function newCheckInToken(): string {
  return randomBytes(18).toString("base64url");
}

// Fills fields added after a guest was first saved.
function normalize(g: Guest): Guest {
  return {
    ...g,
    phone: g.phone ?? "",
    whatsappSentAt: g.whatsappSentAt ?? null,
    checkedInAt: g.checkedInAt ?? null,
    qrSentAt: g.qrSentAt ?? null,
  };
}

async function readGuests(): Promise<Guest[]> {
  const stored = await readJSON<Guest[]>(GUESTS_KEY);
  const guests = Array.isArray(stored) ? stored.map(normalize) : [];
  if (!guests.some((g) => !g.checkInToken)) return guests;

  // Guests saved before check-in existed get a code once, saved right away.
  return updateJSON<Guest[], Guest[]>(GUESTS_KEY, [], (current) => {
    const next = current.map((g) =>
      normalize({ ...g, checkInToken: g.checkInToken || newCheckInToken() }),
    );
    return { value: next, result: next };
  });
}

// Applies `fn` to the guest with `id` and saves the list; null if not found.
async function changeGuest(
  id: string,
  fn: (guest: Guest) => Guest,
): Promise<Guest | null> {
  return updateJSON<Guest[], Guest | null>(GUESTS_KEY, [], (current) => {
    const index = current.findIndex((g) => g.id === id);
    if (index === -1) return { result: null };
    const updated = fn(normalize(current[index]));
    const next = [...current];
    next[index] = updated;
    return { value: next, result: updated };
  });
}

export async function listGuests(): Promise<Guest[]> {
  const guests = await readGuests();
  return guests.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function createGuest(input: GuestInput): Promise<Guest> {
  return updateJSON<Guest[], Guest>(GUESTS_KEY, [], (current) => {
    const now = new Date().toISOString();
    const guest: Guest = {
      id: randomUUID(),
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: (input.phone ?? "").trim(),
      status: input.status,
      guestCount: Math.max(1, Math.floor(input.guestCount) || 1),
      mealPreference: (input.mealPreference ?? "").trim(),
      message: (input.message ?? "").trim(),
      whatsappSentAt: null,
      checkInToken: newCheckInToken(),
      checkedInAt: null,
      qrSentAt: null,
      createdAt: now,
      updatedAt: now,
    };
    return { value: [...current, guest], result: guest };
  });
}

export async function updateGuest(
  id: string,
  patch: Partial<GuestInput>,
): Promise<Guest | null> {
  return changeGuest(id, (current) => ({
    ...current,
    name: patch.name?.trim() ?? current.name,
    email: patch.email?.trim().toLowerCase() ?? current.email,
    phone: patch.phone?.trim() ?? current.phone,
    status: patch.status ?? current.status,
    guestCount:
      patch.guestCount !== undefined
        ? Math.max(1, Math.floor(patch.guestCount) || 1)
        : current.guestCount,
    mealPreference:
      patch.mealPreference !== undefined
        ? patch.mealPreference.trim()
        : current.mealPreference,
    message:
      patch.message !== undefined ? patch.message.trim() : current.message,
    updatedAt: new Date().toISOString(),
  }));
}

export async function getGuest(id: string): Promise<Guest | null> {
  const guests = await readGuests();
  return guests.find((g) => g.id === id) ?? null;
}

export async function getGuestByToken(token: string): Promise<Guest | null> {
  const guests = await readGuests();
  return guests.find((g) => g.checkInToken === token) ?? null;
}

export async function markQrSent(id: string): Promise<void> {
  await changeGuest(id, (g) => ({ ...g, qrSentAt: new Date().toISOString() }));
}

export async function markWhatsappSent(id: string): Promise<void> {
  await changeGuest(id, (g) => ({ ...g, whatsappSentAt: new Date().toISOString() }));
}

export type CheckInResult =
  | { result: "welcome"; guest: Guest }
  | { result: "already"; guest: Guest }
  | { result: "notfound" };

// Codes are single use: the first scan records arrival, later scans only report it.
export async function checkInByToken(token: string): Promise<CheckInResult> {
  return updateJSON<Guest[], CheckInResult>(GUESTS_KEY, [], (current) => {
    const index = current.findIndex((g) => g.checkInToken === token);
    if (index === -1) return { result: { result: "notfound" } };

    const guest = normalize(current[index]);
    if (guest.checkedInAt) return { result: { result: "already", guest } };

    const arrived = { ...guest, checkedInAt: new Date().toISOString() };
    const next = [...current];
    next[index] = arrived;
    return { value: next, result: { result: "welcome", guest: arrived } };
  });
}

// Manual override from the dashboard (forgotten phone, mistaken scan).
export async function setCheckedIn(id: string, arrived: boolean): Promise<Guest | null> {
  return changeGuest(id, (g) => ({
    ...g,
    checkedInAt: arrived ? g.checkedInAt ?? new Date().toISOString() : null,
  }));
}

export async function deleteGuest(id: string): Promise<boolean> {
  return updateJSON<Guest[], boolean>(GUESTS_KEY, [], (current) => {
    const next = current.filter((g) => g.id !== id);
    if (next.length === current.length) return { result: false };
    return { value: next, result: true };
  });
}

export function summarizeGuests(guests: Guest[]) {
  return guests.reduce(
    (acc, guest) => {
      acc.total += 1;
      if (guest.checkedInAt) acc.arrived += 1;
      if (guest.status === "attending") {
        acc.attending += 1;
        acc.headcount += guest.guestCount;
      } else if (guest.status === "declined") {
        acc.declined += 1;
      } else if (guest.status === "maybe") {
        acc.maybe += 1;
      } else {
        acc.pending += 1;
      }
      return acc;
    },
    {
      total: 0,
      attending: 0,
      declined: 0,
      maybe: 0,
      pending: 0,
      headcount: 0,
      arrived: 0,
    },
  );
}
