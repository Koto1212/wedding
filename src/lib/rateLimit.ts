import { updateJSON } from "./store";

type Bucket = { count: number; resetAt: number };

/**
 * Fixed-window rate limit backed by the same store as guests.
 * Returns ok:false when the caller should be rejected.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  opts: { failOpen?: boolean } = {},
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const now = Date.now();
  const failOpen = opts.failOpen ?? false;
  try {
    return await updateJSON<Bucket, { ok: true } | { ok: false; retryAfterSec: number }>(
      `ratelimit:${key}`,
      { count: 0, resetAt: now + windowMs },
      (current) => {
        if (!current.resetAt || now >= current.resetAt) {
          return {
            value: { count: 1, resetAt: now + windowMs },
            result: { ok: true },
          };
        }
        if (current.count >= limit) {
          return {
            result: {
              ok: false,
              retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
            },
          };
        }
        return {
          value: { count: current.count + 1, resetAt: current.resetAt },
          result: { ok: true },
        };
      },
    );
  } catch (err) {
    console.error("Rate limit store failed:", err);
    // Logins fail closed; public RSVP can fail open so guests aren't blocked.
    if (failOpen) return { ok: true };
    return { ok: false, retryAfterSec: 60 };
  }
}

export function clientIp(request: Request): string {
  const nf = request.headers.get("x-nf-client-connection-ip");
  if (nf) return nf.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
