import { promises as fs } from "fs";
import path from "path";
import { getStore, type Store } from "@netlify/blobs";

// Small JSON key-value storage. On Netlify the site runs in short-lived
// functions with no lasting disk, so data lives in Netlify Blobs; anywhere
// else (e.g. `npm run dev`) it lives in files under ./data.

const STORE_NAME = "wedding";
const DATA_DIR = path.join(process.cwd(), "data");

// Set once a file write fails because the server's disk is read-only: from
// then on this server instance uses Blobs.
let diskReadOnly = false;

function hasBlobsContext(): boolean {
  return Boolean(
    process.env.NETLIFY_BLOBS_CONTEXT ||
      (globalThis as { netlifyBlobsContext?: unknown }).netlifyBlobsContext,
  );
}

// Prefer Blobs whenever Netlify injects context, or when we have explicit
// credentials, or when the disk is known read-only.
function useBlobs(): boolean {
  return (
    diskReadOnly ||
    hasBlobsContext() ||
    Boolean(
      (process.env.NETLIFY_SITE_ID || process.env.SITE_ID) &&
        (process.env.NETLIFY_BLOBS_TOKEN ||
          process.env.NETLIFY_AUTH_TOKEN ||
          process.env.NETLIFY_API_TOKEN),
    ) ||
    Boolean(process.env.NETLIFY) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    process.cwd().startsWith("/var/task")
  );
}

export function storageBackend(): "netlify-blobs" | "local-files" {
  return useBlobs() ? "netlify-blobs" : "local-files";
}

function isReadOnlyDiskError(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return code === "EROFS" || code === "EACCES" || code === "EPERM";
}

function blobs(): Store {
  const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token =
    process.env.NETLIFY_BLOBS_TOKEN ||
    process.env.NETLIFY_AUTH_TOKEN ||
    process.env.NETLIFY_API_TOKEN;

  // Explicit credentials are the reliable path on Next.js / Netlify when the
  // automatic Blobs context is missing from the function runtime.
  if (siteID && token) {
    return getStore({ name: STORE_NAME, siteID, token });
  }
  if (hasBlobsContext()) {
    return getStore({ name: STORE_NAME });
  }
  throw new Error(
    "Netlify Blobs is not configured. In Netlify → Environment variables, set NETLIFY_SITE_ID (Project ID) and NETLIFY_AUTH_TOKEN (personal access token), then redeploy.",
  );
}

function fileFor(key: string): string {
  return path.join(DATA_DIR, `${key}.json`);
}

export async function readJSON<T>(key: string): Promise<T | null> {
  if (useBlobs()) {
    return ((await blobs().get(key, { type: "json" })) as T | null) ?? null;
  }
  try {
    return JSON.parse(await fs.readFile(fileFor(key), "utf8")) as T;
  } catch {
    return null;
  }
}

export async function writeJSON(key: string, value: unknown): Promise<void> {
  if (useBlobs()) {
    await blobs().setJSON(key, value);
    return;
  }
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(fileFor(key), JSON.stringify(value, null, 2), "utf8");
  } catch (err) {
    if (!isReadOnlyDiskError(err)) throw err;
    diskReadOnly = true;
    await blobs().setJSON(key, value);
  }
}

export async function deleteKey(key: string): Promise<void> {
  if (useBlobs()) {
    await blobs().delete(key);
    return;
  }
  await fs.rm(fileFor(key), { force: true });
}

const localLocks = new Map<string, Promise<unknown>>();

/**
 * Reads `key`, lets `change` compute a new value, and saves it.
 * On Netlify this is a simple get→change→set (fine for a wedding guest list).
 */
export async function updateJSON<T, R>(
  key: string,
  initial: T,
  change: (current: T) => { value?: T; result: R },
): Promise<R> {
  if (useBlobs()) {
    const store = blobs();
    const current = ((await store.get(key, { type: "json" })) as T | null) ?? initial;
    const { value, result } = change(current);
    if (value === undefined) return result;
    await store.setJSON(key, value);
    return result;
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
      diskReadOnly = true;
      return updateJSON(key, initial, change);
    }
  });
  localLocks.set(key, run.catch(() => undefined));
  return run;
}
