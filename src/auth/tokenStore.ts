/**
 * Token storage backed by localStorage. Single key, one token at a time.
 *
 * AuthProvider is the only writer; everyone else goes through `getToken()`.
 * The HTTP layer uses this via `configureHttp({ getToken, clearToken })`.
 */

const KEY = "vibecare.auth.token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* swallow quota errors — fail closed on the next API call. */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}