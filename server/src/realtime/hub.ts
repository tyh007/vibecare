/**
 * Tiny in-memory pub/sub used by SSE endpoints.
 *
 * Topics are arbitrary strings ("community", "profile", ...). `publish` is
 * synchronous from the caller's perspective; subscribers receive events as
 * `ReadableStreamDefaultController` enqueue calls. No persistence — if a
 * client disconnects, missed events are gone (Last-Event-ID replay could be
 * added later by storing recent events per topic).
 */

export interface SseEvent {
  id?: string;
  event?: string;
  data: unknown;
}

type Subscriber = (e: SseEvent) => void;

class Hub {
  private subs = new Map<string, Set<Subscriber>>();

  subscribe(topic: string, fn: Subscriber): () => void {
    let set = this.subs.get(topic);
    if (!set) {
      set = new Set();
      this.subs.set(topic, set);
    }
    set.add(fn);
    return () => {
      const s = this.subs.get(topic);
      if (!s) return;
      s.delete(fn);
      if (s.size === 0) this.subs.delete(topic);
    };
  }

  publish(topic: string, event: SseEvent): void {
    const set = this.subs.get(topic);
    if (!set) return;
    for (const fn of set) {
      try {
        fn(event);
      } catch (err) {
        console.error(`[sse] subscriber for topic "${topic}" threw`, err);
      }
    }
  }
}

let _hub: Hub | null = null;

export function getHub(): Hub {
  if (!_hub) _hub = new Hub();
  return _hub;
}

/** Test helper: reset the singleton. */
export function resetHub(): void {
  _hub = null;
}