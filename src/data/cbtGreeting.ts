/**
 * The CBT greeting message. Kept in sync with the server-side copy in
 * `server/src/ai/prompts/cbt.ts` so the initial assistant message rendered
 * before the first round-trip matches what the model would have produced.
 *
 * If you edit this, update the server prompt too.
 */
export const CBT_GREETING =
  "Hello — I can guide you through a short CBT-informed reflection. I am an AI prototype, not a therapist or crisis service. What has been on your mind today?";