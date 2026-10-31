import { connection, NextResponse } from "next/server";
import { readJSON, storageBackend, writeJSON } from "@/lib/store";

// For an uptime monitor and for troubleshooting: 200 when guest storage can
// be read and written, 503 (with the reason) when it can't. Reveals no guest
// data — it reads the guest list but only reports whether that worked.
export async function GET() {
  // Run on every request; without this the check is done once at build time
  // and its result frozen.
  await connection();
  const started = Date.now();
  const backend = storageBackend();
  const fail = (step: string, err: unknown) => {
    console.error(`Health check failed at ${step}:`, err);
    const e = err as { name?: string; message?: string };
    return NextResponse.json(
      {
        ok: false,
        storage: backend,
        failedAt: step,
        error: `${e?.name ?? "Error"}: ${String(e?.message ?? err).slice(0, 200)}`,
        ms: Date.now() - started,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  };

  try {
    await readJSON("guests");
  } catch (err) {
    return fail("read", err);
  }
  try {
    const stamp = new Date().toISOString();
    await writeJSON("health", { checkedAt: stamp });
    const back = await readJSON<{ checkedAt: string }>("health");
    if (back?.checkedAt !== stamp) throw new Error("wrote a value but read back something else");
  } catch (err) {
    return fail("write", err);
  }

  return NextResponse.json(
    { ok: true, storage: storageBackend(), ms: Date.now() - started },
    { headers: { "Cache-Control": "no-store" } },
  );
}
