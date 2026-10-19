/* ============================================================
   AUTH - password hashing + signed session tokens.

   Deliberately dependency-free: everything is built on the Web
   Crypto API (globalThis.crypto.subtle), which is available in
   both the Node runtime (route handlers) and the edge runtime
   (proxy.ts). No bcrypt, no jose, no native builds.

     • Passwords → PBKDF2-SHA256, 210k iterations, per-user salt.
     • Sessions  → compact HMAC-SHA256 signed token in a cookie.
   ============================================================ */

import { SITE } from "@/lib/site";

export const SESSION_COOKIE = SITE.sessionCookie;
const PBKDF2_ITERATIONS = 210_000;
const KEY_LEN = 32;

/* ---------- base64url helpers ---------- */
function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

const enc = new TextEncoder();

/* Constant-time string comparison. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

/* ============================================================
   PASSWORD HASHING (PBKDF2)
   Stored format: pbkdf2$<iterations>$<saltB64url>$<hashB64url>
   ============================================================ */
async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    keyMaterial,
    KEY_LEN * 8,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, iterStr, saltB64, hashB64] = stored.split("$");
    if (scheme !== "pbkdf2") return false;
    const iterations = parseInt(iterStr, 10);
    const salt = fromBase64Url(saltB64);
    const expected = hashB64;
    const actual = toBase64Url(await pbkdf2(password, salt, iterations));
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/* ============================================================
   SESSION TOKENS (HMAC-SHA256)
   Token format: <payloadB64url>.<signatureB64url>
   ============================================================ */
export interface SessionPayload {
  /** username */
  u: string;
  /** account session_version at sign-in - bumping it in the DB
      (password reset, disable) invalidates every older token */
  v: number;
  /** expiry, epoch seconds */
  exp: number;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set a long random value in .env.local (openssl rand -hex 32).",
    );
  }
  return secret;
}

export function sessionTtl(): number {
  const raw = parseInt(process.env.AUTH_SESSION_TTL ?? "", 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 60 * 60 * 24 * 7; // 7 days
}

export async function signSession(username: string, version: number): Promise<string> {
  const payload: SessionPayload = {
    u: username,
    v: version,
    exp: Math.floor(Date.now() / 1000) + sessionTtl(),
  };
  const body = toBase64Url(enc.encode(JSON.stringify(payload)));
  const key = await hmacKey(getSecret());
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const key = await hmacKey(getSecret());
    const expectedSig = toBase64Url(
      new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(body))),
    );
    if (!timingSafeEqual(sig, expectedSig)) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
