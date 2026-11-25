import { request } from "./http.js";

export interface VibecareEvent {
  id: string;
  user_id: string;
  title: string;
  start_iso: string;
  end_iso: string;
  date: string;
  category: string;
  notes: string | null;
  color: string | null;
  created_at: string;
}

export interface EventCreateInput {
  title: string;
  start_iso: string;
  end_iso: string;
  date: string;
  category: string;
  notes?: string | null;
  color?: string | null;
}

export const eventService = {
  list(opts: { from?: string; to?: string } = {}): Promise<VibecareEvent[]> {
    const params = new URLSearchParams();
    if (opts.from) params.set("from", opts.from);
    if (opts.to) params.set("to", opts.to);
    const qs = params.toString();
    return request<VibecareEvent[]>(`/events${qs ? `?${qs}` : ""}`);
  },
  create(input: EventCreateInput): Promise<VibecareEvent> {
    return request<VibecareEvent>("/events", { method: "POST", body: input });
  },
  update(id: string, patch: Partial<EventCreateInput>): Promise<VibecareEvent> {
    return request<VibecareEvent>(`/events/${id}`, { method: "PATCH", body: patch });
  },
  remove(id: string): Promise<void> {
    return request<void>(`/events/${id}`, { method: "DELETE" });
  },
};