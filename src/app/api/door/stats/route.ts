import { NextResponse } from "next/server";
import { canCheckIn } from "@/lib/auth";
import { listGuests } from "@/lib/db";

// Head counts for the door screen: people arrived vs. people expected.
export async function GET() {
  if (!(await canCheckIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const guests = await listGuests();
  let expected = 0;
  let arrived = 0;
  for (const guest of guests) {
    if (guest.status === "attending") expected += guest.guestCount;
    if (guest.checkedInAt) arrived += guest.guestCount;
  }
  return NextResponse.json({ arrived, expected });
}
