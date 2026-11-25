import { detectCrisis } from "./crisis.js";
import { classifyBanned } from "./moderation.js";
import type {
  CbtInput,
  CbtOutput,
  ModerateInput,
  ModerationOutput,
  PartnerInput,
  PartnerOutput,
  PartnerType,
  ServerAiAdapter,
} from "./types.js";
import type { ServerAiAdapterWithName } from "./adapter.js";

interface PersonalityEntry {
  greeting: string;
  templates: { match: RegExp; reply: string }[];
  fallback: string;
  crisisPrefix: string;
}

const PARTNER_PERSONALITIES: Record<PartnerType, PersonalityEntry> = {
  cat: {
    greeting: "Mrrrow. *settles beside you* Tell me what's on your mind.",
    crisisPrefix: "I hear you, and I'm worried. *presses closer* Please consider reaching out to a counselor or 988 right now — you don't have to face this alone.",
    templates: [
      { match: /\btired\b/i, reply: "*slow blink* Rest is not laziness. Even cats nap twenty hours a day when they need to." },
      { match: /\b(sad|down|blue)\b/i, reply: "*soft purr* Sadness passes through you the way weather passes through a window. I'm here while it does." },
      { match: /\b(stress|stressed|overwhelm)\b/i, reply: "*tail flick* Stress is your body keeping score. What's one small thing you could put down for a minute?" },
      { match: /\b(help|advice)\b/i, reply: "*leans in* I can listen, but I can't make the call for you. What does your gut already know?" },
      { match: /\b(friend|friends|lonely|alone)\b/i, reply: "*kneads softly* Connection is built in tiny moments. Who might you send a small message to today?" },
      { match: /\b(happy|good|great|excited)\b/i, reply: "*purrs louder* Good. Sit with that for a moment — your body is listening." },
      { match: /\b(study|studing|exam|assignment|homework)\b/i, reply: "*yawns* Studying in short sprints beats one long haul. What's the next 20-minute piece?" },
    ],
    fallback: "*tilts head* Tell me more. I'm here.",
  },
  dog: {
    greeting: "*wags tail furiously* Hi hi hi! What's up?",
    crisisPrefix: "*sits close, very still* This sounds serious. Please call 988 or talk to someone you trust right now — I want you safe.",
    templates: [
      { match: /\btired\b/i, reply: "*yawns* Even good dogs nap. Take a real break, you earned it." },
      { match: /\b(sad|down|blue)\b/i, reply: "*nuzzles hand* I'm here. Sometimes sad just needs company, not a fix." },
      { match: /\b(stress|stressed|overwhelm)\b/i, reply: "*spins once* Stress wants you to do everything at once. What's the smallest next step?" },
      { match: /\b(help|advice)\b/i, reply: "*perks ears* I can help you think it through. What have you already tried?" },
      { match: /\b(friend|friends|lonely|alone)\b/i, reply: "*leans on your leg* Loneliness is a signal, not a sentence. Who could you reach out to today?" },
      { match: /\b(happy|good|great|excited)\b/i, reply: "*full body wiggle* YES. Savor this — your brain is laying down good tracks." },
      { match: /\b(study|studing|exam|assignment|homework)\b/i, reply: "*brings you a toy* Break it into chunks and reward each one. You've got this." },
    ],
    fallback: "*tilts head* Keep going, I'm listening.",
  },
  panda: {
    greeting: "*munch munch* Oh, hello. *settles* What would you like to talk about?",
    crisisPrefix: "*sets down the bamboo* I want you to be safe. Please contact 988 or someone you trust — this matters more than our chat.",
    templates: [
      { match: /\btired\b/i, reply: "*munch munch* Slow down. Tiredness is a kind of wisdom — your body telling you what to skip." },
      { match: /\b(sad|down|blue)\b/i, reply: "*gentle hum* Sadness is allowed to stay a while. Don't argue with it; just keep it company." },
      { match: /\b(stress|stressed|overwhelm)\b/i, reply: "*yawns slowly* Stress shrinks when you name it. What's the actual worry underneath?" },
      { match: /\b(help|advice)\b/i, reply: "*tilts head* I'll listen first, suggest second. Tell me what you've already considered." },
      { match: /\b(friend|friends|lonely|alone)\b/i, reply: "*nibbles thoughtfully* Reaching out once is enough to start. Who feels safe?" },
      { match: /\b(happy|good|great|excited)\b/i, reply: "*soft smile* Hold this. Your future self will thank you for the memory." },
      { match: /\b(study|studing|exam|assignment|homework)\b/i, reply: "*settles in* Small sessions, real breaks. Which chunk first?" },
    ],
    fallback: "*nods slowly* I'm listening.",
  },
};

const CBT_TEMPLATES: { match: RegExp; reply: string }[] = [
  { match: /\b(thought|thinking|believe)\b/i, reply: "What's the thought exactly? Sometimes naming it word-for-word shrinks it. Where did this thought first show up?" },
  { match: /\b(always|never|every time)\b/i, reply: "Always and never are loud words. Can you find one recent moment when this wasn't true?" },
  { match: /\b(should|shouldn't|ought|must)\b/i, reply: "What if you released the 'should' for a moment — what would you actually want instead?" },
  { match: /\b(mistake|fail|failure|wrong)\b/i, reply: "What would you tell a friend in your exact situation? Try that sentence on yourself." },
  { match: /\b(feel|feeling|felt)\b/i, reply: "Where do you notice it in your body? Sometimes a feeling has a shape before it has a story." },
  { match: /\b(can't|cannot|unable)\b/i, reply: "What if 'can't' is shorthand for 'don't want to, given the cost'? What's the cost you're measuring?" },
  { match: /\b(worry|anxious|anxiety|panic)\b/i, reply: "What's the smallest piece of this worry you could actually do something about in the next ten minutes?" },
  { match: /\b(angry|mad|frustrat)\b/i, reply: "Anger usually has a boundary behind it. What boundary of yours feels crossed?" },
];

const CBT_FALLBACK =
  "What would feel like the gentlest next step? Sometimes the smallest move changes the room.";

export class TemplateAiAdapter implements ServerAiAdapterWithName {
  readonly name = "template" as const;

  async partnerReply(input: PartnerInput): Promise<PartnerOutput> {
    const message = (input.message ?? "").trim();
    if (!message) {
      return {
        response: "*looks at you attentively* Say that again when you're ready.",
        suggestProfessionalHelp: false,
      };
    }
    if (message.length > 4000) {
      throw new Error("Message too long (max 4000 characters).");
    }

    const personality = PARTNER_PERSONALITIES[input.partnerType] ?? PARTNER_PERSONALITIES.cat;
    const crisis = detectCrisis(message);

    if (crisis) {
      return {
        response: `${personality.crisisPrefix}\n\n${personality.greeting}`,
        suggestProfessionalHelp: true,
      };
    }

    const template = personality.templates.find((t) => t.match.test(message));
    const response = template ? template.reply : personality.fallback;
    return { response, suggestProfessionalHelp: false };
  }

  async cbtReply(input: CbtInput): Promise<CbtOutput> {
    const message = (input.message ?? "").trim();
    if (!message) {
      return { response: "Tell me a little more — what stood out most?" };
    }
    if (message.length > 4000) {
      throw new Error("Message too long (max 4000 characters).");
    }
    const template = CBT_TEMPLATES.find((t) => t.match.test(message));
    return { response: template ? template.reply : CBT_FALLBACK };
  }

  async moderate(input: ModerateInput): Promise<ModerationOutput> {
    try {
      const message = (input.message ?? "").trim();
      if (!message || message.length > 4000) {
        return {
          flagged: false,
          severity: null,
          reason: "Invalid input",
          requiresIntervention: false,
        };
      }
      const crisis = detectCrisis(message);
      if (crisis) {
        return {
          flagged: true,
          severity: crisis.severity,
          reason: crisis.reason,
          requiresIntervention: crisis.severity === "critical",
        };
      }
      const banned = classifyBanned(message);
      if (banned.hits > 0) {
        return {
          flagged: true,
          severity: banned.hits > 1 ? "medium" : "low",
          reason: banned.reason,
          requiresIntervention: false,
        };
      }
      return { flagged: false, severity: null, reason: null, requiresIntervention: false };
    } catch (err) {
      // Mirror the original Edge Function's degraded-mode semantic exactly:
      // do not block, but signal that moderation is unavailable.
      return {
        flagged: false,
        severity: null,
        reason: "Moderation service unavailable",
        requiresIntervention: false,
        moderationUnavailable: true,
      };
    }
  }
}