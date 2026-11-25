/**
 * Base HTTP wrapper used by every service in `src/services/*`.
 *
 * - Reads `VITE_API_BASE_URL` (defaults to `/api`).
 * - Attaches the Bearer token from `tokenStore`.
 * - Throws `ApiError` on non-2xx responses with the parsed JSON body.
 *
 * Tests can stub `globalThis.fetch` directly.
 */

const BASE = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

export interface ApiErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly payload: ApiErrorPayload | undefined;

  constructor(status: number, message: string, payload?: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

type TokenGetter = () => string | null;
type TokenClearer = () => void;

let _tokenGetter: TokenGetter = () => null;
let _tokenClearer: TokenClearer = () => {};

export function configureHttp(opts: {
  getToken: TokenGetter;
  clearToken: TokenClearer;
}): void {
  _tokenGetter = opts.getToken;
  _tokenClearer = opts.clearToken;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** If true, send the body as JSON only if it's truthy. Default: always JSON. */
  jsonBody?: boolean;
  signal?: AbortSignal;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const headers: Record<string, string> = { accept: "application/json" };

  const token = _tokenGetter();
  if (token) headers.authorization = `Bearer ${token}`;

  const init: RequestInit = { method: opts.method ?? "GET", headers };
  if (opts.signal) init.signal = opts.signal;

  if (opts.body !== undefined) {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, init);

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const parsed = text ? (JSON.parse(text) as unknown) : undefined;

  if (!res.ok) {
    const payload =
      parsed && typeof parsed === "object" && "error" in parsed
        ? (parsed as { error: ApiErrorPayload }).error
        : undefined;
    if (res.status === 401) _tokenClearer();
    throw new ApiError(
      res.status,
      payload?.message ?? `${res.status} ${res.statusText}`,
      payload,
    );
  }

  return parsed as T;
}