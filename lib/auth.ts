// Edge-compatible session auth (Web Crypto only — no Node "crypto" module),
// so this works both in middleware and in route handlers.

export const SESSION_COOKIE = "tar_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90 days, in seconds

async function getKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const enc = new TextEncoder().encode(secret);
  return crypto.subtle.importKey("raw", enc, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(): Promise<string> {
  const issuedAt = Date.now().toString();
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(issuedAt));
  return `${issuedAt}.${toHex(sig)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [issuedAt, sigHex] = token.split(".");
  if (!issuedAt || !sigHex) return false;

  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0 || age > SESSION_MAX_AGE * 1000) {
    return false;
  }

  const key = await getKey();
  const expectedSig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(issuedAt));
  const expectedHex = toHex(expectedSig);

  if (expectedHex.length !== sigHex.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ sigHex.charCodeAt(i);
  }
  return diff === 0;
}

export async function hashPin(pin: string): Promise<string> {
  const secret = process.env.AUTH_SECRET ?? "";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${pin}:${secret}`));
  return toHex(buf);
}

/**
 * Verifies a candidate PIN against the DB-stored hash if one exists,
 * otherwise falls back to the APP_PIN env var (used before any in-app
 * PIN change has happened).
 */
export async function verifyPin(candidate: string, storedHash: string | null | undefined): Promise<boolean> {
  if (storedHash) {
    const candidateHash = await hashPin(candidate);
    return candidateHash === storedHash;
  }
  const pin = process.env.APP_PIN;
  if (!pin) throw new Error("APP_PIN is not set");
  return candidate === pin;
}
