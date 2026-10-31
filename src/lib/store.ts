import { promises as fs } from "fs";
import path from "path";
import { getStore } from "@netlify/blobs";

// Small JSON key-value storage. On Netlify the site runs in short-lived
// functions with no lasting disk, so data lives in Netlify Blobs; anywhere
// else (e.g. `npm run dev`) it lives in files under ./data.

const STORE_NAME = "wedding";
const DATA_DIR = path.join(process.cwd(), "data");
const MAX_RETRIES = 8;

function onNetlify(): boolean {
  return Boolean(
    process.env.NETLIFY_BLOBS_CONTEXT ||
      process.env.NETLIFY ||
      (globalThis as { netlifyBlobsContext?: unknown }).netlifyBlobsContext,
  );
}

function blobs() {
  // Strong consistency: a check-in must be visible to the next scan at once.
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
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(fileFor(key), JSON.stringify(value, null, 2), "utf8");
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
      // Someone else saved first: re-read and apply the change again.
    }
    throw new Error(`Could not save "${key}" — too many simultaneous changes.`);
  }

  const previous = localLocks.get(key) ?? Promise.resolve();
  const run = previous.then(async () => {
    const current = (await readJSON<T>(key)) ?? initial;
    const { value, result } = change(current);
    if (value !== undefined) await writeJSON(key, value);
    return result;
  });
  localLocks.set(key, run.catch(() => undefined));
  return run;
}
