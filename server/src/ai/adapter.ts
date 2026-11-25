import type { ServerAiAdapter } from "./types.js";
import { TemplateAiAdapter } from "./template.js";
import { RemoteAiAdapter, RemoteAiError } from "./remote.js";
import { getDb } from "../db/client.js";
import { decrypt } from "../auth/secrets.js";

export interface ServerAiAdapterWithName extends ServerAiAdapter {
  readonly name: "template" | "remote";
}

/**
 * Choose the AI adapter to use for `userId`. Reads the user's settings row:
 *
 *   - If `ai_provider === 'remote'` AND a decrypted AI key is available, return
 *     a RemoteAiAdapter. If decryption or construction fails, log and fall
 *     back to the template adapter so the user always gets a response.
 *   - Otherwise return the template adapter (deterministic, offline).
 *
 * Each call re-reads settings so changes in the UI take effect immediately
 * without restarting the server.
 */
export function selectAdapter(userId?: string): ServerAiAdapterWithName {
  if (!userId) return new TemplateAiAdapter();

  const db = getDb();
  const row = db
    .prepare(
      "SELECT ai_provider, ai_model, ai_key_ciphertext, ai_key_iv, ai_key_tag FROM settings WHERE user_id = ?",
    )
    .get(userId) as
    | {
        ai_provider: "template" | "remote";
        ai_model: string;
        ai_key_ciphertext: string | null;
        ai_key_iv: string | null;
        ai_key_tag: string | null;
      }
    | undefined;

  if (!row || row.ai_provider !== "remote") {
    return new TemplateAiAdapter();
  }
  if (!row.ai_key_ciphertext || !row.ai_key_iv || !row.ai_key_tag) {
    return new TemplateAiAdapter();
  }

  let apiKey: string;
  try {
    apiKey = decrypt({
      ciphertext: row.ai_key_ciphertext,
      iv: row.ai_key_iv,
      tag: row.ai_key_tag,
    });
  } catch (err) {
    console.warn(`[ai] could not decrypt key for user ${userId}`, err);
    return new TemplateAiAdapter();
  }

  return new RemoteAiAdapter(apiKey, row.ai_model);
}

export { RemoteAiError };