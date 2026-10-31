import { promises as fs } from "fs";
import path from "path";
import { getStore } from "@netlify/blobs";

// Small JSON key-value storage. On Netlify the site runs in short-lived
// functions with no lasting disk, so data lives in Netlify Blobs; anywhere
// else (e.g. `npm run dev`) it lives in files under ./data.

const STORE_NAME = "wedding";
const DATA_DIR = path.join(process.cwd(), "data");
const MAX_RETRIES = 8;

// Set once a file write fails because the server's disk is read-only: from
// then on this server instance uses Blobs.
let diskReadOnly = false;

// `NETLIFY` alone isn't enough — it's set while building, not reliably while
// the site's functions run — so any sign of Netlify or a serverless function
// counts.
function onNetlify(): boolean {
  const env = process.env;
  return Boolean(
    diskReadOnly ||
      env.NETLIFY_BLOBS_CONTEXT ||
      (globalThis as { netlifyBlobsContext?: unknown }).netlifyBlobsContext ||
      env.NETLIFY ||
      env.SITE_ID ||
      env.DEPLOY_ID ||
      env.AWS_LAMBDA_FUNCTION_NAME ||
      env.LAMBDA_TASK_ROOT ||
      process.cwd().startsWith("/var/task"),
  );
}

export function storageBackend(): "netlify-blobs" | "local-files" {
  return onNetlify() ? "netlify-blobs" : "local-files";
}

function isReadOnlyDiskError(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return code === "EROFS" || code === "EACCES" || code === "EPERM";
}

function blobs() {
  // Strong consistency: a check-in must be visible to the next scan at once.
  // Prefer the runtime Blobs context Netlify injects into functions. If that
  // is missing (some Next.js / Netlify setups), fall back to an explicit
  // site ID + personal access token from env.
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token =
    process.env.NETLIFY_BLOBS_TOKEN ||
    process.env.NETLIFY_AUTH_TOKEN ||
    process.env.NETLIFY_API_TOKEN;
  if (siteID && token) {
    return getStore({ name: STORE_NAME, consistency: "strong", siteID, token });
  }
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

function fileFor(key: string): string {
  return path.join(DATA_DIR, `${key}.json`);
}

export async function readJSON<T>(key: string): Promise<T | null> {
  if (onNetlify()) {
    return ((await blobs().get(key, { type: "json" })) as T | null) ?? null;
  }
  try {
    return JSON.parse(await fs.readFile(fileFor(key), "utf8")) as T;
  } catch {
    return null;
  }
}

export async function writeJSON(key: string, value: unknown): Promise<void> {
  if (onNetlify()) {
    await blobs().setJSON(key, value);
    return;
  }
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(fileFor(key), JSON.stringify(value, null, 2), "utf8");
  } catch (err) {
    if (!isReadOnlyDiskError(err)) throw err;
    // Running somewhere without a writable disk: switch to Blobs.
    diskReadOnly = true;
    await blobs().setJSON(key, value);
  }
}

export async function deleteKey(key: string): Promise<void> {
  if (onNetlify()) {
    await blobs().delete(key);
    return;
  }
  await fs.rm(fileFor(key), { force: true });
}

// Serialises local read-modify-write cycles within this process.
const localLocks = new Map<string, Promise<unknown>>();

/**
 * Reads `key`, lets `change` compute a new value, and saves it without losing
 * a write that happened in between (two door phones scanning at once, say).
 * `change` may run more than once, so it must not have side effects.
 * Return `value: undefined` to leave the stored data untouched.
 */
export async function updateJSON<T, R>(
  key: string,
  initial: T,
  change: (current: T) => { value?: T; result: R },
): Promise<R> {
  if (onNetlify()) {
    const store = blobs();
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const entry = await store.getWithMetadata(key, { type: "json" });
      const { value, result } = change((entry?.data as T | undefined) ?? initial);
      if (value === undefined) return result;

      const written = entry?.etag
        ? await store.setJSON(key, value, { onlyIfMatch: entry.etag })
        : await store.setJSON(key, value, { onlyIfNew: true });
      if (written.modified) return result;

      // Not saved. If nobody else changed the entry in the meantime, the
      // conditional write itself isn't being honoured: save outright.
      const now = await store.getMetadata(key);
      if ((now?.etag ?? undefined) === (entry?.etag ?? undefined)) {
        await store.setJSON(key, value);
        return result;
      }
      // Someone else saved first: re-read and apply the change again.
    }
    throw new Error(`Could not save "${key}" — too many simultaneous changes.`);
  }

  const previous = localLocks.get(key) ?? Promise.resolve();
  const run = previous.then(async (): Promise<R> => {
    const current = (await readJSON<T>(key)) ?? initial;
    const { value, result } = change(current);
    if (value === undefined) return result;
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(fileFor(key), JSON.stringify(value, null, 2), "utf8");
      return result;
    } catch (err) {
      if (!isReadOnlyDiskError(err)) throw err;
      // No writable disk: redo the whole change against Blobs, so it's based
      // on the data stored there rather than on an empty local file.
      diskReadOnly = true;
      return updateJSON(key, initial, change);
    }
  });
  localLocks.set(key, run.catch(() => undefined));
  return run;
}
