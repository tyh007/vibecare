import { request } from "./http.js";

export type AIProvider = "template" | "remote";
export type CrisisSensitivity = "low" | "medium" | "high";

export interface VibecareSettings {
  ai_provider: AIProvider;
  ai_model: string;
  crisis_sensitivity: CrisisSensitivity;
  has_key: boolean;
}

export const settingsService = {
  get(): Promise<VibecareSettings> {
    return request<VibecareSettings>("/settings");
  },
  update(patch: Partial<Pick<VibecareSettings, "ai_provider" | "ai_model" | "crisis_sensitivity">>): Promise<{ ok: true }> {
    return request<{ ok: true }>("/settings", { method: "PUT", body: patch });
  },
  setAiKey(api_key: string): Promise<{ ok: true }> {
    return request<{ ok: true }>("/settings/ai-key", { method: "PUT", body: { api_key } });
  },
  clearAiKey(): Promise<{ ok: true }> {
    return request<{ ok: true }>("/settings/ai-key", { method: "DELETE" });
  },
  saveOnboarding(payload: { payload?: unknown; support?: unknown }): Promise<{ ok: true }> {
    return request<{ ok: true }>("/onboarding", {
      method: "POST",
      body: {
        payload: payload.payload === undefined ? undefined : JSON.stringify(payload.payload),
        support: payload.support === undefined ? undefined : JSON.stringify(payload.support),
      },
    });
  },
};