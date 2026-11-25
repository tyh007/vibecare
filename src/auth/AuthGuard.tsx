import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "./useAuth";

const LoadingScreen = () => (
  <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
    Loading VibeCare…
  </div>
);

/**
 * Wrap protected route trees with this. While the auth probe is running
 * (status === 'loading') we show a spinner; once resolved, unauthenticated
 * users get bounced to /auth (preserving the requested path so they can be
 * sent back after login).
 */
export function AuthGuard({ children }: { children: ReactNode }): React.ReactElement {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <LoadingScreen />;
  if (status === "unauthenticated") {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}