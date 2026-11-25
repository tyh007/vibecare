import { useEffect, useRef, useState } from "react";

import { getToken } from "@/auth/tokenStore";

/**
 * Subscribe to a server-sent event stream. The path is appended to the same
 * `/api` base the rest of the client uses; we deliberately bypass `request()`
 * because EventSource manages its own connection.
 *
 * The hook returns the most recently received `data` payloads (parsed JSON)
 * and the connection status. Cleanup happens automatically on unmount.
 */
export type SseStatus = "connecting" | "open" | "closed" | "error";

export interface UseEventSourceResult<T = unknown> {
  status: SseStatus;
  last: T | null;
}

export function useEventSource<T = unknown>(
  path: string,
  enabled = true,
): UseEventSourceResult<T> {
  const [status, setStatus] = useState<SseStatus>("connecting");
  const [last, setLast] = useState<T | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) {
      setStatus("closed");
      return;
    }
    if (typeof window === "undefined") return;

    const token = getToken();
    // EventSource cannot set custom headers; we pass the bearer via query
    // param. The server treats it the same as the Authorization header.
    const sep = path.includes("?") ? "&" : "?";
    const url = `${path}${token ? `${sep}_t=${encodeURIComponent(token)}` : ""}`;
    const es = new EventSource(url);
    sourceRef.current = es;

    es.addEventListener("open", () => setStatus("open"));
    es.addEventListener("error", () => setStatus("error"));
    es.addEventListener("message", (ev: MessageEvent<string>) => {
      try {
        setLast(JSON.parse(ev.data) as T);
      } catch {
        setLast(ev.data as unknown as T);
      }
    });

    return () => {
      es.close();
      sourceRef.current = null;
      setStatus("closed");
    };
  }, [path, enabled]);

  return { status, last };
}