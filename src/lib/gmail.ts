import { decryptSecret, encryptSecret } from "./crypto";
import { deleteKey, readJSON, writeJSON } from "./store";

// Gmail login saved from the admin dashboard (email + encrypted app password).
export type GmailCredentials = {
  email: string;
  /** AES-GCM ciphertext (v1:…) or legacy plaintext during migration. */
  appPassword: string;
  savedAt: string;
};

const GMAIL_KEY = "gmail";

export async function getGmailCredentials(): Promise<GmailCredentials | null> {
  const saved = await readJSON<GmailCredentials>(GMAIL_KEY);
  if (!saved?.email || !saved.appPassword) return null;
  try {
    return {
      ...saved,
      appPassword: decryptSecret(saved.appPassword),
    };
  } catch (err) {
    console.error("Could not decrypt stored Gmail password:", err);
    return null;
  }
}

export async function saveGmailCredentials(
  email: string,
  appPassword: string,
): Promise<{ email: string; savedAt: string }> {
  const cleaned = appPassword.replace(/\s+/g, "");
  const saved: GmailCredentials = {
    email: email.trim().toLowerCase(),
    appPassword: encryptSecret(cleaned),
    savedAt: new Date().toISOString(),
  };
  await writeJSON(GMAIL_KEY, saved);
  return { email: saved.email, savedAt: saved.savedAt };
}

export async function removeGmailCredentials(): Promise<void> {
  await deleteKey(GMAIL_KEY);
}
