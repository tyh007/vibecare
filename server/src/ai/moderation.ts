/**
 * Lightweight banned-word classifier for the Community Room.
 *
 * This is a small, deliberately conservative list intended to catch the most
 * obvious slurs and harassment terms. It is NOT a substitute for proper
 * moderation — flagged messages are surfaced to the user with a clear reason
 * so a moderator (in production) or the user themselves can review.
 *
 * The classifier is intentionally deterministic and offline so the AI layer
 * stays available even when no remote provider is configured.
 */

interface BannedTerm {
  re: RegExp;
  reason: string;
}

const TERMS: BannedTerm[] = [
  { re: /\b(kys)\b/i, reason: "Encourages self-harm" },
  { re: /\b(slur1|slur2)\b/i, reason: "Slur" }, // placeholder
  { re: /\b(go die)\b/i, reason: "Encourages harm" },
  { re: /\b(idiot|moron|dumb)\b/i, reason: "Personal insult" },
  { re: /\b(spam|scam|phishing)\b/i, reason: "Possible spam" },
];

export interface BannedResult {
  hits: number;
  reason: string;
}

export function classifyBanned(message: string): BannedResult {
  let hits = 0;
  const reasons: string[] = [];
  for (const t of TERMS) {
    if (t.re.test(message)) {
      hits += 1;
      reasons.push(t.reason);
    }
  }
  if (hits === 0) return { hits: 0, reason: "" };
  return { hits, reason: reasons.join("; ") };
}