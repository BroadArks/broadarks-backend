/**
 * Generate a password hash compatible with the admin panel.
 *
 *   node scripts/hash-password.mjs 'your-password'
 *
 * Copy the printed string into the `password_hash` column when
 * seeding an admin account by hand in Supabase.
 *
 * Matches lib/auth.ts: PBKDF2-SHA256, 210k iterations, 16-byte salt,
 * 32-byte key, base64url, stored as pbkdf2$<iters>$<salt>$<hash>.
 */
const PBKDF2_ITERATIONS = 210_000;
const KEY_LEN = 32;

function toBase64Url(bytes) {
  return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_LEN * 8,
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(new Uint8Array(bits))}`;
}

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.mjs 'your-password'");
  process.exit(1);
}
console.log(await hashPassword(password));
