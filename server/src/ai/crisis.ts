import type { Severity } from "./types.js";

/**
 * Crisis detection patterns lifted from the original Supabase Edge Function
 * (supabase/functions/vibe-partner-chat/index.ts:41-47).
 *
 * Each pattern has a human-readable reason and a default severity. The first
 * pattern group is `critical` because the language directly references
 * suicidal or lethal intent; the others are `high` and represent serious
 * distress that warrants a professional-help nudge.
 */

export interface CrisisHit {
  severity: Severity;
  reason: string;
}

interface Pattern {
  re: RegExp;
  reason: string;
  severity: Severity;
}

const PATTERNS: Pattern[] = [
  {
    re: /suicidal|kill myself|want to die|end it all/i,
    reason: "References suicidal or lethal intent",
    severity: "critical",
  },
  {
    re: /severe depression|can't go on|hopeless|worthless/i,
    reason: "References severe depression or hopelessness",
    severity: "high",
  },
  {
    re: /panic attack|can't breathe|severe anxiety/i,
    reason: "References acute panic or breathing distress",
    severity: "high",
  },
  {
    re: /self harm|hurt myself|cutting/i,
    reason: "References self-harm",
    severity: "high",
  },
  {
    re: /no point in living/i,
    reason: "References loss of meaning in living",
    severity: "high",
  },
  {
    re: /\b(suicide|kill)\b/i,
    reason: "References suicide or killing",
    severity: "high",
  },
];

export function detectCrisis(message: string): CrisisHit | null {
  for (const p of PATTERNS) {
    if (p.re.test(message)) return { severity: p.severity, reason: p.reason };
  }
  return null;
}