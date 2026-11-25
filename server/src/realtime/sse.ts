import { randomUUID } from "node:crypto";
import type { Context } from "hono";
import { streamSSE } from "hono/streaming";

import { getHub, type SseEvent } from "./hub.js";

/**
 * Wire a Hono endpoint as a Server-Sent Events stream. The subscriber
 * receives events from `topic` and writes them as `event: <name>\ndata: <json>\n\n`.
 *
 * On client disconnect the unsubscribe callback fires; we don't need a
 * heartbeat for the prototype (Hono's default keep-alive handles idle TCP).
 */
export function sseStream(c: Context, topic: string): Response {
  const hub = getHub();

  return streamSSE(c, async (stream) => {
    let closed = false;
    let unsubscribe: (() => void) | null = null;

    stream.onAbort(() => {
      closed = true;
      unsubscribe?.();
    });

    unsubscribe = hub.subscribe(topic, (e: SseEvent) => {
      if (closed) return;
      void stream.writeSSE({
        id: e.id ?? randomUUID(),
        event: e.event ?? "message",
        data: typeof e.data === "string" ? e.data : JSON.stringify(e.data),
      });
    });

    // Initial hello so clients can confirm the connection is alive.
    await stream.writeSSE({
      id: randomUUID(),
      event: "hello",
      data: JSON.stringify({ topic, ts: new Date().toISOString() }),
    });

    // Keep the handler alive until the client disconnects.
    while (!closed) {
      await stream.sleep(15000);
    }
  });
}