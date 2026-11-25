import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";

/**
 * Polls `/api/health` every few seconds and shows a friendly retry screen
 * whenever the API is unreachable. Replaces the old `ConfigurationRequired`
 * gate that hard-stopped the app when Supabase env vars were missing.
 */
export function BackendUnavailable() {
  const [retryIn, setRetryIn] = useState(5);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;
      try {
        const res = await fetch("/api/health", { method: "GET" });
        if (res.ok) {
          // Reload so the rest of the app re-runs its auth probe with the
          // (now-working) backend instead of showing this screen forever.
          window.location.reload();
          return;
        }
      } catch {
        /* still down */
      }
      if (cancelled) return;
      setAttempt((n) => n + 1);
      setRetryIn(5);
      timer = setTimeout(tick, 5000);
    };

    timer = setTimeout(tick, 5000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <Card className="max-w-md w-full p-6 space-y-4 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
          <WifiOff className="w-6 h-6 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold">VibeCare API is unreachable</h1>
        <p className="text-sm text-muted-foreground">
          The local API server didn't respond. Make sure it's running, then we'll
          retry automatically.
        </p>
        <div className="text-xs text-muted-foreground">
          Attempt #{attempt + 1} · retrying in {retryIn}s
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="w-full"
        >
          Reload now
        </Button>
      </Card>
    </div>
  );
}