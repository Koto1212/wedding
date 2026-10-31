import { NextResponse } from "next/server";
import { canCheckIn } from "@/lib/auth";
import { checkInByToken } from "@/lib/db";
import { LIMITS } from "@/lib/validate";

// The URL inside each guest's QR code, for scans made with a phone's own
// camera app. Only door staff or a host can record an arrival; anyone else
// is sent to the door sign-in first.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token: raw } = await params;
  const token = String(raw ?? "").slice(0, LIMITS.token);
  const here = `/api/checkin/${encodeURIComponent(token)}`;

  if (!(await canCheckIn())) {
    return NextResponse.redirect(
      new URL(`/door?next=${encodeURIComponent(here)}`, request.url),
    );
  }

  const outcome = await checkInByToken(token);
  if (outcome.result === "notfound") {
    return NextResponse.redirect(new URL("/checkin/unknown", request.url));
  }

  return NextResponse.redirect(
    new URL(
      `/checkin/${encodeURIComponent(token)}?r=${outcome.result}`,
      request.url,
    ),
  );
}
