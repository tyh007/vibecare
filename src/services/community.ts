import { request } from "./http.js";

export interface VibecareCommunityMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  flagged: number;
  flag_reason: string | null;
  flag_severity: string | null;
  display_name: string | null;
}

export interface VibecareModeration {
  flagged: boolean;
  severity: "low" | "medium" | "high" | "critical" | null;
  reason: string | null;
  requiresIntervention: boolean;
  moderationUnavailable?: boolean;
}

export interface VibecareCommunityPostResult {
  message: VibecareCommunityMessage;
  moderation: VibecareModeration;
}

export const communityService = {
  list(opts: { limit?: number } = {}): Promise<VibecareCommunityMessage[]> {
    const qs = opts.limit ? `?limit=${opts.limit}` : "";
    return request<VibecareCommunityMessage[]>(`/community/messages${qs}`);
  },

  send(content: string): Promise<VibecareCommunityPostResult> {
    return request<VibecareCommunityPostResult>("/community/messages", {
      method: "POST",
      body: { content },
    });
  },

  update(id: string, content: string): Promise<VibecareCommunityMessage> {
    return request<VibecareCommunityMessage>(`/community/messages/${id}`, {
      method: "PATCH",
      body: { content },
    });
  },

  remove(id: string): Promise<void> {
    return request<void>(`/community/messages/${id}`, { method: "DELETE" });
  },
};