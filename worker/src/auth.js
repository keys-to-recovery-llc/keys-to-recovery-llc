// Auth primitives (API-CONTRACT.md §4.7).
// Passwords: PBKDF2-SHA256 via WebCrypto, per-user random salt.
// Sessions: opaque token, HMAC-signed cookie, SHA-256 hash stored in D1
// so logout revokes server-side.

const PBKDF2_ITERATIONS = 100_000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const SESSION_COOKIE = 'ktr_session';

const enc = new TextEncoder();

function toB64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromB64(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

function toB64Url(bytes) {
  return toB64(bytes).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function fromB64Url(str) {
  const b64 = str.replaceAll('-', '+').replaceAll('_', '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  return fromB64(padded);
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${toB64(salt)}$${toB64(new Uint8Array(bits))}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [scheme, iterStr, saltB64, hashB64] = String(stored).split('$');
    if (scheme !== 'pbkdf2-sha256') return false;
    const iterations = Number.parseInt(iterStr, 10);
    const salt = fromB64(saltB64);
    const expected = fromB64(hashB64);
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      key,
      expected.length * 8,
    );
    const actual = new Uint8Array(bits);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
}

function sessionSecret(env) {
  if (env.SESSION_SECRET) return env.SESSION_SECRET;
  console.warn('[auth] SESSION_SECRET is not set — using an insecure dev secret. Set it in production.');
  return 'dev-only-insecure-session-secret';
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return toB64Url(new Uint8Array(sig));
}

function randomToken(bytes = 32) {
  return toB64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

// Creates a session row and returns the Set-Cookie header value.
export async function createSession(db, env, userId, requestUrl) {
  const token = randomToken();
  const signature = await hmac(sessionSecret(env), token);
  const tokenHash = await sha256Hex(token);
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_TTL_MS);
  await db
    .prepare('INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), userId, tokenHash, now.toISOString(), expires.toISOString())
    .run();
  const secure = requestUrl.protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${token}.${signature}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}${secure}`;
}

export function clearSessionCookie(requestUrl) {
  const secure = requestUrl.protocol === 'https:' ? '; Secure' : '';
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}

function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return null;
}

// Resolves the session cookie to a user row, or null.
export async function getSessionUser(db, env, request) {
  const raw = readCookie(request, SESSION_COOKIE);
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot < 1) return null;
  const token = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  const expected = await hmac(sessionSecret(env), token);
  if (signature.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < signature.length; i++) diff |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  const tokenHash = await sha256Hex(token);
  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.full_name, u.role
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .bind(tokenHash, new Date().toISOString())
    .first();
  return row || null;
}

export async function destroySession(db, env, request) {
  const raw = readCookie(request, SESSION_COOKIE);
  if (!raw) return;
  const dot = raw.lastIndexOf('.');
  if (dot < 1) return;
  const tokenHash = await sha256Hex(raw.slice(0, dot));
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
}

export async function createPasswordResetToken(db, userId) {
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const now = new Date();
  const expires = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
  await db
    .prepare(
      'INSERT INTO password_reset_tokens (id, user_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(crypto.randomUUID(), userId, tokenHash, now.toISOString(), expires.toISOString())
    .run();
  return token;
}

export async function consumePasswordResetToken(db, token) {
  const tokenHash = await sha256Hex(token);
  const row = await db
    .prepare('SELECT * FROM password_reset_tokens WHERE token_hash = ?')
    .bind(tokenHash)
    .first();
  if (!row || row.used_at) return null;
  if (row.expires_at <= new Date().toISOString()) return null;
  await db
    .prepare('UPDATE password_reset_tokens SET used_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), row.id)
    .run();
  return row.user_id;
}
