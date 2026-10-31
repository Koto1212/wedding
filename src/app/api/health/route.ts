import { connection, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { readJSON, storageBackend, writeJSON } from "@/lib/store";

// Public: only { ok }. Detailed diagnostics require an admin session or
// HEALTH_SECRET query param — avoids leaking infra details.
export async function GET(request: Request) {
  try {
    await connection();
  } catch {
    // continue
  }

  const url = new URL(request.url);
  const healthSecret = (process.env.HEALTH_SECRET || "").trim();
  const provided = (url.searchParams.get("key") || "").trim();
  const detailed =
    (healthSecret && provided && provided === healthSecret) ||
    (await isAdminAuthenticated());

  const started = Date.now();
  try {
    await readJSON("guests");
    const stamp = new Date().toISOString();
    await writeJSON("health", { checkedAt: stamp });
    const back = await readJSON<{ checkedAt: string }>("health");
    if (back?.checkedAt !== stamp) {
      throw new Error("wrote a value but read back something else");
    }
  } catch (err) {
    console.error("Health check failed:", err);
    if (!detailed) {
      return NextResponse.json(
        { ok: false },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    const e = err as { name?: string; message?: string };
    return NextResponse.json(
      {
        ok: false,
        storage: storageBackend(),
        error: `${e?.name ?? "Error"}: ${String(e?.message ?? err).slice(0, 300)}`,
        ms: Date.now() - started,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!detailed) {
    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { ok: true, storage: storageBackend(), ms: Date.now() - started },
    { headers: { "Cache-Control": "no-store" } },
  );
}
