import { request } from "./http.js";

export interface VibecareProfile {
  user_id: string;
  display_name: string | null;
  onboarded_at: string | null;
  coins: number;
  last_check_in: string | null;
  current_streak: number;
  longest_streak: number;
  total_check_ins: number;
  hairstyle: string;
  hair_color: string;
  eye_color: string;
  top: string;
  bottom: string;
  accessory: string;
  created_at: string;
}

export const profileService = {
  getSelf(): Promise<VibecareProfile> {
    return request<VibecareProfile>("/profile");
  },

  patchSelf(patch: Partial<Pick<VibecareProfile,
    "display_name" | "hairstyle" | "hair_color" | "eye_color" | "top" | "bottom" | "accessory"
  >>): Promise<{ ok: true }> {
    return request<{ ok: true }>("/profile", { method: "PATCH", body: patch });
  },

  onboard(display_name?: string): Promise<{ ok: true }> {
    return request<{ ok: true }>("/profile/onboard", {
      method: "POST",
      body: { display_name },
    });
  },

  getPublic(userId: string): Promise<{ user_id: string; display_name: string | null }> {
    return request<{ user_id: string; display_name: string | null }>(
      `/profile/${userId}/public`,
    );
  },
};