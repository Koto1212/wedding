import { deleteKey, readJSON, writeJSON } from "./store";

// Gmail login saved from the admin dashboard (email + app password).
export type GmailCredentials = {
  email: string;
  appPassword: string;
  savedAt: string;
};

const GMAIL_KEY = "gmail";

export async function getGmailCredentials(): Promise<GmailCredentials | null> {
  const saved = await readJSON<GmailCredentials>(GMAIL_KEY);
  if (!saved?.email || !saved.appPassword) return null;
  return saved;
}

export async function saveGmailCredentials(
  email: string,
  appPassword: string,
): Promise<GmailCredentials> {
  const saved: GmailCredentials = {
    email: email.trim(),
    // Gmail app passwords are often copied with spaces; strip them.
    appPassword: appPassword.replace(/\s+/g, ""),
    savedAt: new Date().toISOString(),
  };
  await writeJSON(GMAIL_KEY, saved);
  return saved;
}

export async function removeGmailCredentials(): Promise<void> {
  await deleteKey(GMAIL_KEY);
}
