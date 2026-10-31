import { decryptSecret, encryptSecret } from "./crypto";
import { siteUrl } from "./site";
import { deleteKey, readJSON, writeJSON } from "./store";

// The Gmail account the hosts connected with "Sign in with Google". The
// refresh token lets the site send mail as that account until it is
// disconnected here or access is removed in the Google account settings.
export type GoogleAccount = {
  email: string;
  refreshToken: string;
  connectedAt: string;
};

const GOOGLE_KEY = "google";

export const GOOGLE_STATE_COOKIE = "google_oauth_state";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/gmail.send",
];

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri(): string {
  return `${siteUrl()}/api/admin/google/callback`;
}

export async function getGoogleAccount(): Promise<GoogleAccount | null> {
  const account = await readJSON<GoogleAccount>(GOOGLE_KEY);
  if (!account?.email || !account.refreshToken) return null;
  try {
    return {
      ...account,
      refreshToken: decryptSecret(account.refreshToken),
    };
  } catch (err) {
    console.error("Could not decrypt Google refresh token:", err);
    return null;
  }
}

export async function saveGoogleAccount(account: GoogleAccount): Promise<void> {
  await writeJSON(GOOGLE_KEY, {
    ...account,
    refreshToken: encryptSecret(account.refreshToken),
  });
}

export async function removeGoogleAccount(): Promise<void> {
  const account = await getGoogleAccount();
  if (account) {
    await fetch(
      `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(account.refreshToken)}`,
      { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    ).catch(() => undefined);
  }
  await deleteKey(GOOGLE_KEY);
}
