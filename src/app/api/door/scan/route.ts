import { NextResponse } from "next/server";
import { canCheckIn } from "@/lib/auth";
import { checkInByToken } from "@/lib/db";

// QR codes hold the full check-in URL; accept that or a bare code.
function tokenFrom(scanned: string): string {
  const match = scanned.match(/\/api\/checkin\/([^/?#\s]+)/);
  return decodeURIComponent(match ? match[1] : scanned.trim());
}

export async function POST(request: Request) {
  if (!(await canCheckIn())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { code?: string };
    const token = tokenFrom(String(body.code ?? ""));
    if (!token) {
      return NextResponse.json({ result: "notfound" });
    }

    const outcome = await checkInByToken(token);
    if (outcome.result === "notfound") {
      return NextResponse.json({ result: "notfound" });
    }

    // Door staff only see who is in front of them, not the guest list.
    const { guest } = outcome;
    return NextResponse.json({
      result: outcome.result,
      name: guest.name,
      guestCount: guest.guestCount,
      checkedInAt: guest.checkedInAt,
    });
  } catch (err) {
    console.error("Door scan failed:", err);
    return NextResponse.json({ error: "Could not check this pass." }, { status: 500 });
  }
}
