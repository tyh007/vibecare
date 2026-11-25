import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

/**
 * AES-256-GCM at-rest encryption for per-user AI provider keys.
 *
 * The passphrase comes from `AI_KEY_PASSPHRASE` (required env var). It's
 * combined with the OS username and scrypt-derived to a 32-byte key so the
 * raw passphrase is never used directly. Rotating AI_KEY_PASSPHRASE will
 * invalidate all stored AI keys — that's intentional.
 */

const SALT = "vibecare.ai-key.v1";

function deriveKey(): Buffer {
  const passphrase = process.env.AI_KEY_PASSPHRASE;
  if (!passphrase) {
    throw new Error("AI_KEY_PASSPHRASE is not configured");
  }
  const user =
    process.env.USER ||
    process.env.USERNAME ||
    "vibecare-default-user";
  return scryptSync(`${passphrase}::${user}`, SALT, 32);
}

let _key: Buffer | null = null;
function key(): Buffer {
  if (!_key) _key = deriveKey();
  return _key;
}

export interface CipherEnvelope {
  ciphertext: string;
  iv: string;
  tag: string;
}

export function encrypt(plain: string): CipherEnvelope {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: ct.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decrypt(env: CipherEnvelope): string {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(env.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(env.tag, "base64"));
  const pt = Buffer.concat([
    decipher.update(Buffer.from(env.ciphertext, "base64")),
    decipher.final(),
  ]);
  return pt.toString("utf8");
}