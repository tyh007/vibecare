import { request } from "./http.js";

export interface VibecareNote {
  event_id: string;
  user_id: string;
  notes: string;
  updated_at: string;
}

export const noteService = {
  get(eventId: string): Promise<VibecareNote | { event_id: string; notes: ""; updated_at: null }> {
    return request(`/notes?eventId=${encodeURIComponent(eventId)}`);
  },
  set(eventId: string, notes: string): Promise<VibecareNote> {
    return request<VibecareNote>(`/notes/${eventId}`, {
      method: "PUT",
      body: { notes },
    });
  },
};