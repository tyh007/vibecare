import { randomUUID } from "node:crypto";

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

/**
 * JWT helpers.
 *
 * Tokens are HS256 signed and carry:
 *   sub  = user_id (uuid)
 *   jti  = session token (random; also stored in `sessions` for revocation)
 *   exp  = 7 days from issue
 *
 * The same `jti` is inserted as the `sessions.token` row, so logging out (or
 * rotating the AUTH_SECRET) can revoke a token without scanning all in-flight
 * requests.
 */

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface VibecareTokenClaims extends JWTPayload {
  sub: string;
  jti: string;
}

let _secret: Uint8Array | null = null;

function secret(): Uint8Array {
  if (_secret) return _secret;
  const raw = process.env.AUTH_SECRET;
  if (!raw) throw new Error("AUTH_SECRET is not configured");
  _secret = new TextEncoder().encode(raw);
  return _secret;
}

export interface IssueTokenInput {
  userId: string;
}

export async function issueToken(input: IssueTokenInput): Promise<{
  token: string;
  jti: string;
  expiresAt: string;
}> {
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString();
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(input.userId)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS)
    .sign(secret());
  return { token, jti, expiresAt };
}

export async function verifyToken(token: string): Promise<VibecareTokenClaims> {
  const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
  if (typeof payload.sub !== "string") throw new Error("Token missing sub");
  if (typeof payload.jti !== "string") throw new Error("Token missing jti");
  return payload as VibecareTokenClaims;
}