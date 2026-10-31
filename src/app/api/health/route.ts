import { NextResponse } from "next/server";
import { readJSON } from "@/lib/store";

// For an uptime monitor: 200 when the site and guest storage respond,
// 503 when storage can't be reached. Reveals no guest data.
export async function GET() {
  const started = Date.now();
  try {
    await readJSON("guests");
    return NextResponse.json(
      { ok: true, storage: "ok", ms: Date.now() - started },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, storage: "unreachable", ms: Date.now() - started },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
