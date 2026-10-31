import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { derivedKey } from "./secrets";

/**
 * Encrypt a short secret (e.g. Gmail app password) for storage in Blobs.
 * Format: v1:<iv>:<tag>:<ciphertext> (base64url parts).
 */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", derivedKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    enc.toString("base64url"),
  ].join(":");
}

export function decryptSecret(payload: string): string {
  if (!payload.startsWith("v1:")) {
    // Legacy plaintext values saved before encryption — still usable once.
    return payload;
  }
  const [, ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted secret.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    derivedKey(),
    Buffer.from(ivB64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}
