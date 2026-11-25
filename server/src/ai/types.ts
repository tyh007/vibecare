/**
 * Adapter contract used by the AI routes. Each method mirrors the input/output
 * shape of the previous Supabase Edge Functions so the frontend service layer
 * can stay unchanged.
 */

export type PartnerType = "cat" | "dog" | "panda";

export interface PartnerInput {
  message: string;
  partnerName: string;
  partnerType: PartnerType;
  mood?: number;
}

export interface PartnerOutput {
  response: string;
  suggestProfessionalHelp: boolean;
}

export interface CbtInput {
  message: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
}

export interface CbtOutput {
  response: string;
}

export interface ModerateInput {
  message: string;
  userId: string;
}

export type Severity = "low" | "medium" | "high" | "critical";

export interface ModerationOutput {
  flagged: boolean;
  severity: Severity | null;
  reason: string | null;
  requiresIntervention: boolean;
  moderationUnavailable?: boolean;
}

export interface ServerAiAdapter {
  partnerReply(input: PartnerInput): Promise<PartnerOutput>;
  cbtReply(input: CbtInput): Promise<CbtOutput>;
  moderate(input: ModerateInput): Promise<ModerationOutput>;
}