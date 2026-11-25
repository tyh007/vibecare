import { request } from "./http.js";

export type PartnerType = "cat" | "dog" | "panda";

export interface PartnerResult {
  response: string;
  suggestProfessionalHelp: boolean;
}

export interface CbtResult {
  response: string;
}

export interface ModerateResult {
  flagged: boolean;
  severity: "low" | "medium" | "high" | "critical" | null;
  reason: string | null;
  requiresIntervention: boolean;
  moderationUnavailable?: boolean;
}

export const aiService = {
  partner(input: {
    message: string;
    partnerName: string;
    partnerType: PartnerType;
    mood?: number;
  }): Promise<PartnerResult> {
    return request<PartnerResult>("/ai/partner", { method: "POST", body: input });
  },
  cbt(input: {
    message: string;
    conversationHistory: { role: "user" | "assistant"; content: string }[];
  }): Promise<CbtResult> {
    return request<CbtResult>("/ai/cbt", { method: "POST", body: input });
  },
  moderate(input: { message: string }): Promise<ModerateResult> {
    return request<ModerateResult>("/ai/moderate", { method: "POST", body: input });
  },
};