import { useEffect, useState } from "react";

import { BackendUnavailable } from "./BackendUnavailable";

/**
 * Top-level wrapper that probes `/api/health` once and either renders its
 * children or swaps in `BackendUnavailable` if the API is down.
 *
 * Health is checked once on mount — long-term disconnects are handled by
 * `BackendUnavailable` itself, which polls and reloads.
 */
export function BackendHealthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"checking" | "ok" | "down">("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/health", { method: "GET" });
        if (cancelled) return;
        setState(res.ok ? "ok" : "down");
      } catch {
        if (!cancelled) setState("down");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "ok" || state === "checking") return <>{children}</>;
  return <BackendUnavailable />;
}