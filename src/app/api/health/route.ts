import { connection, NextResponse } from "next/server";
import { readJSON, storageBackend, writeJSON } from "@/lib/store";

export const dynamic = "force-dynamic";

// For an uptime monitor and for troubleshooting: 200 when guest storage can
// be read and written, 503 (with the reason) when it can't.
export async function GET() {
  try {
    await connection();
  } catch {
    // Still run the check even if connection() is unavailable.
  }

  const started = Date.now();
  let backend: string = "unknown";
  try {
    backend = storageBackend();
  } catch (err) {
    const e = err as { message?: string };
    return NextResponse.json(
      {
        ok: false,
        storage: "unknown",
        failedAt: "init",
        error: String(e?.message ?? err).slice(0, 300),
        ms: Date.now() - started,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const fail = (step: string, err: unknown) => {
    console.error(`Health check failed at ${step}:`, err);
    const e = err as { name?: string; message?: string };
    return NextResponse.json(
      {
        ok: false,
        storage: backend,
        failedAt: step,
        error: `${e?.name ?? "Error"}: ${String(e?.message ?? err).slice(0, 300)}`,
        ms: Date.now() - started,
        hint:
          step === "init" || /Blobs is not configured/i.test(String(e?.message ?? err))
            ? "Set NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN in Netlify env vars, then redeploy."
            : undefined,
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
    if (back?.checkedAt !== stamp) {
      throw new Error("wrote a value but read back something else");
    }
  } catch (err) {
    return fail("write", err);
  }

  return NextResponse.json(
    { ok: true, storage: storageBackend(), ms: Date.now() - started },
    { headers: { "Cache-Control": "no-store" } },
  );
}
