import { request } from "./http.js";

export interface VibecareUser {
  id: string;
  email: string;
  display_name: string;
}

export interface AuthResult {
  token: string;
  user: VibecareUser;
}

export const authService = {
  signUp(input: {
    email: string;
    password: string;
    display_name?: string;
  }): Promise<AuthResult> {
    return request<AuthResult>("/auth/signup", { method: "POST", body: input });
  },

  signIn(input: { email: string; password: string }): Promise<AuthResult> {
    return request<AuthResult>("/auth/login", { method: "POST", body: input });
  },

  signOut(): Promise<void> {
    return request<void>("/auth/logout", { method: "POST" });
  },

  session(): Promise<{ user: VibecareUser | null }> {
    return request<{ user: VibecareUser | null }>("/auth/session");
  },
};