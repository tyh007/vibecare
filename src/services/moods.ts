import { request } from "./http.js";

export interface VibecareMood {
  id: string;
  user_id: string;
  mood: number;
  sleep_hours: number | null;
  physical_activity_minutes: number | null;
  screen_time_minutes: number | null;
  hydration_ml: number | null;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export interface MoodCreateInput {
  mood: number;
  sleep_hours?: number | null;
  physical_activity_minutes?: number | null;
  screen_time_minutes?: number | null;
  hydration_ml?: number | null;
  location?: string | null;
  notes?: string | null;
}

export const moodService = {
  list(opts: { limit?: number; signal?: AbortSignal } = {}): Promise<VibecareMood[]> {
    const qs = opts.limit ? `?limit=${opts.limit}` : "";
    return request<VibecareMood[]>(`/moods${qs}`, { signal: opts.signal });
  },
  create(input: MoodCreateInput): Promise<VibecareMood> {
    return request<VibecareMood>("/moods", { method: "POST", body: input });
  },
  update(id: string, patch: Partial<MoodCreateInput>): Promise<VibecareMood> {
    return request<VibecareMood>(`/moods/${id}`, { method: "PATCH", body: patch });
  },
  remove(id: string): Promise<void> {
    return request<void>(`/moods/${id}`, { method: "DELETE" });
  },
};