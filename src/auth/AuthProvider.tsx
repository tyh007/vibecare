import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { authService, type VibecareUser } from "@/services/auth";
import { clearToken, getToken, setToken } from "@/auth/tokenStore";
import { configureHttp } from "@/services/http";
import { AuthContext } from "./authContext";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  user: VibecareUser | null;
  status: AuthStatus;
  signIn: (email: string, password: string) => Promise<VibecareUser>;
  signUp: (email: string, password: string, displayName?: string) => Promise<VibecareUser>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [user, setUser] = useState<VibecareUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // Wire HTTP layer to the token store before any request is made.
  useEffect(() => {
    configureHttp({ getToken, clearToken });
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setStatus("unauthenticated");
      return;
    }
    try {
      const { user: u } = await authService.session();
      setUser(u);
      setStatus(u ? "authenticated" : "unauthenticated");
    } catch {
      setUser(null);
      setStatus("unauthenticated");
      clearToken();
    }
  }, []);

  // On mount: probe session.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authService.signIn({ email, password });
    setToken(result.token);
    setUser(result.user);
    setStatus("authenticated");
    return result.user;
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const result = await authService.signUp({
      email,
      password,
      display_name: displayName,
    });
    setToken(result.token);
    setUser(result.user);
    setStatus("authenticated");
    return result.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
    } catch {
      /* server logout may fail if the token is already invalid — still clear locally. */
    }
    clearToken();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, signIn, signUp, signOut, refresh }),
    [user, status, signIn, signUp, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}