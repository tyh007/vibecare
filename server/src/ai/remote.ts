import type {
  CbtInput,
  CbtOutput,
  ModerateInput,
  ModerationOutput,
  PartnerInput,
  PartnerOutput,
  ServerAiAdapter,
} from "./types.js";
import { MODERATION_SYSTEM_PROMPT } from "./prompts/moderation.js";

export class RemoteAiError extends Error {
  constructor(message: string, public override readonly cause?: unknown) {
    super(message);
    this.name = "RemoteAiError";
  }
}

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

interface GatewayMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GatewayRequest {
  model: string;
  messages: GatewayMessage[];
  temperature?: number;
  response_format?: { type: "json_object" };
}

interface GatewayChoice {
  message: { role: string; content: string };
}

interface GatewayResponse {
  choices: GatewayChoice[];
}

/**
 * Adapter that proxies to the Lovable AI gateway (or any compatible
 * OpenAI-style chat completion endpoint). Falls back to throwing
 * `RemoteAiError` so the factory can route to the template adapter when the
 * key is missing or the gateway is down.
 */
export class RemoteAiAdapter implements ServerAiAdapter {
  readonly name = "remote" as const;

  constructor(
    private readonly apiKey: string,
    private readonly model: string = DEFAULT_MODEL,
  ) {}

  private async call(messages: GatewayMessage[]): Promise<string> {
    const body: GatewayRequest = { model: this.model, messages };
    let res: Response;
    try {
      res = await fetch(GATEWAY, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new RemoteAiError("AI gateway unreachable", err);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new RemoteAiError(
        `AI gateway returned ${res.status}: ${text.slice(0, 200)}`,
      );
    }
    const parsed = (await res.json()) as GatewayResponse;
    const content = parsed.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new RemoteAiError("AI gateway response missing content");
    }
    return content.trim();
  }

  async partnerReply(input: PartnerInput): Promise<PartnerOutput> {
    const trimmed = input.message.trim();
    if (!trimmed) throw new RemoteAiError("Empty message");
    if (trimmed.length > 4000) throw new RemoteAiError("Message too long");
    const { PARTNER_SYSTEM_PROMPT, PARTNER_TYPE_PERSONALITIES, PARTNER_CRISIS_GUIDANCE } = await import("./prompts/partner.js");
    const personality =
      PARTNER_TYPE_PERSONALITIES[input.partnerType] ?? PARTNER_TYPE_PERSONALITIES.cat!;
    const system = `${PARTNER_SYSTEM_PROMPT}\n\nYour personality: ${personality}\n\n${PARTNER_CRISIS_GUIDANCE}`;
    const response = await this.call([
      { role: "system", content: system },
      { role: "user", content: trimmed },
    ]);
    // We don't parse suggestProfessionalHelp from the model; the template
    // adapter already detects crisis keywords locally and the remote output
    // wouldn't be reliable enough to flip this flag.
    const { detectCrisis } = await import("./crisis.js");
    const crisis = detectCrisis(trimmed);
    return { response, suggestProfessionalHelp: crisis !== null };
  }

  async cbtReply(input: CbtInput): Promise<CbtOutput> {
    const trimmed = input.message.trim();
    if (!trimmed) throw new RemoteAiError("Empty message");
    if (trimmed.length > 4000) throw new RemoteAiError("Message too long");
    const { CBT_SYSTEM_PROMPT } = await import("./prompts/cbt.js");
    const history = (input.conversationHistory ?? []).slice(-12);
    const response = await this.call([
      { role: "system", content: CBT_SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: trimmed },
    ]);
    return { response };
  }

  async moderate(input: ModerateInput): Promise<ModerationOutput> {
    const trimmed = input.message.trim();
    if (!trimmed) throw new RemoteAiError("Empty message");
    if (trimmed.length > 4000) throw new RemoteAiError("Message too long");
    const raw = await this.call([
      { role: "system", content: MODERATION_SYSTEM_PROMPT },
      { role: "user", content: trimmed },
    ]);
    try {
      // Strip code fences the model sometimes wraps the JSON in.
      const cleaned = raw
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned) as Partial<ModerationOutput>;
      return {
        flagged: Boolean(parsed.flagged),
        severity: (parsed.severity as ModerationOutput["severity"]) ?? null,
        reason: parsed.reason ?? null,
        requiresIntervention: Boolean(parsed.requiresIntervention),
      };
    } catch (err) {
      throw new RemoteAiError("AI moderation returned unparseable JSON", err);
    }
  }
}