// Keys to Recovery LLC — API Worker.
// Implements docs/API-CONTRACT.md (normative). No framework, no dependencies.
//
// Routes:
//   POST /api/apply | /api/investors | /api/feedback   composed-email submissions (§2.5)
//   POST /api/contact                                  general contact form (§2.4 fix)
//   POST /api/auth/register | /login | /logout
//   GET  /api/auth/me
//   POST /api/auth/request-password-reset | /set-password
//   GET|POST /api/auth/google*                         config-gated stub (§4.7)
//   POST /api/logs                                     (§5)
//   GET  /api/health

import { createMailer, sendWelcomeEmail } from './mailer.js';
import {
  hashPassword,
  verifyPassword,
  createSession,
  clearSessionCookie,
  getSessionUser,
  destroySession,
  createPasswordResetToken,
  consumePasswordResetToken,
} from './auth.js';
import { validateEnvelope, validateSubmissionFields, isEmail } from './validation.js';

const DEFAULT_RECIPIENTS = ['support@keystorecoveryllc.com', 'bart@keystorecoveryllc.com'];

function json(status, obj, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function publicUser(u) {
  return { id: u.id, email: u.email, full_name: u.full_name, role: u.role };
}

function allowedRecipients(env) {
  const raw = env.NOTIFICATION_RECIPIENTS;
  if (!raw) return DEFAULT_RECIPIENTS;
  const list = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.length ? list : DEFAULT_RECIPIENTS;
}

// §2.5 step 2: never an open relay — unknown recipients are substituted
// with the default notification recipient.
function resolveRecipient(env, requested) {
  const allowed = allowedRecipients(env);
  return allowed.includes(String(requested).toLowerCase()) ? requested : allowed[0];
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// --- Submissions ----------------------------------------------------------

async function storeSubmission(env, { kind, recipient, subject, body, fields }) {
  await env.DB.prepare(
    'INSERT INTO submissions (id, kind, recipient, subject, body, fields, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      crypto.randomUUID(),
      kind,
      recipient,
      subject,
      body,
      fields ? JSON.stringify(fields) : null,
      new Date().toISOString(),
    )
    .run();
}

// POST /api/apply | /api/investors | /api/feedback — §2.1–§2.3, §2.5
async function handleComposedSubmission(env, kind, payload) {
  const envelopeErrors = validateEnvelope(payload);
  if (envelopeErrors.length) return json(400, { error: envelopeErrors.join('; ') });
  const fieldErrors = validateSubmissionFields(kind, payload.fields);
  if (fieldErrors.length) return json(400, { error: fieldErrors.join('; ') });

  const recipient = resolveRecipient(env, payload.to);
  // Store before delivery: a mail outage never loses a submission.
  await storeSubmission(env, {
    kind,
    recipient,
    subject: payload.subject,
    body: payload.body,
    fields: payload.fields,
  });
  const mailer = createMailer(env);
  try {
    await mailer.send({
      to: recipient,
      subject: payload.subject,
      body: payload.body,
      sensitive: kind === 'apply',
    });
  } catch {
    return json(502, { error: 'delivery_failed' });
  }
  return json(200, { ok: true });
}

// POST /api/contact — §2.4. The original form sent nothing (defect);
// this endpoint provides real persistence + email delivery.
async function handleContact(env, payload) {
  const fields = payload?.fields;
  const fieldErrors = validateSubmissionFields('contact', fields);
  if (fieldErrors.length) return json(400, { error: fieldErrors.join('; ') });

  const recipient = env.CONTACT_RECIPIENT || 'Support@keystorecoveryllc.com';
  const subject = `Website Contact Inquiry: ${fields.name}`;
  const body = [
    'NEW WEBSITE CONTACT INQUIRY',
    '===========================',
    '',
    `Name: ${fields.name}`,
    `Email: ${fields.email}`,
    `Phone: ${fields.phone || 'N/A'}`,
    `Inquiry Type: ${fields.inquiryType}`,
    '',
    'Message:',
    fields.message,
    '',
    '===========================',
    `Submitted: ${new Date().toISOString()}`,
  ].join('\n');

  await storeSubmission(env, { kind: 'contact', recipient, subject, body, fields });
  const mailer = createMailer(env);
  try {
    await mailer.send({ to: recipient, subject, body });
  } catch {
    return json(502, { error: 'delivery_failed' });
  }
  return json(200, { ok: true });
}

// --- Auth -----------------------------------------------------------------

async function handleRegister(env, request, payload, url) {
  const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload?.password === 'string' ? payload.password : '';
  const fullName = typeof payload?.full_name === 'string' ? payload.full_name.trim() : '';
  if (!isEmail(email)) return json(400, { error: 'valid email is required' });
  if (password.length < 8) return json(400, { error: 'password must be at least 8 characters' });
  if (!fullName || fullName.length > 200) return json(400, { error: 'full_name is required' });

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return json(409, { error: 'email_already_registered' });

  const user = {
    id: crypto.randomUUID(),
    email,
    full_name: fullName,
    role: 'user',
  };
  await env.DB.prepare(
    'INSERT INTO users (id, email, full_name, role, password_hash, must_set_password, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
  )
    .bind(user.id, user.email, user.full_name, user.role, await hashPassword(password), new Date().toISOString())
    .run();

  // Welcome-email hook: disabled until the owner supplies the template.
  await sendWelcomeEmail(env, createMailer(env), user);

  const cookie = await createSession(env.DB, env, user.id, url);
  return json(201, { user }, { 'Set-Cookie': cookie });
}

async function handleLogin(env, payload, url) {
  const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload?.password === 'string' ? payload.password : '';
  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return json(401, { error: 'invalid_credentials' });
  if (!user.password_hash) {
    // Migrated user who has not set a password yet (§4.8).
    return json(401, { error: 'password_not_set' });
  }
  if (!(await verifyPassword(password, user.password_hash))) {
    return json(401, { error: 'invalid_credentials' });
  }
  const cookie = await createSession(env.DB, env, user.id, url);
  return json(200, { user: publicUser(user) }, { 'Set-Cookie': cookie });
}

async function handleRequestPasswordReset(env, request, payload) {
  const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
  // Always 200 — never reveal whether an account exists.
  if (isEmail(email)) {
    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (user) {
      const token = await createPasswordResetToken(env.DB, user.id);
      const base = env.APP_BASE_URL || new URL(request.url).origin;
      const link = `${base}/Account?reset_token=${token}`;
      const mailer = createMailer(env);
      try {
        await mailer.send({
          to: user.email,
          subject: 'Set your Keys to Recovery LLC password',
          body: `Hello ${user.full_name},\n\nUse this link within 1 hour to set your password:\n${link}\n\nIf you did not request this, you can ignore this email.\n`,
        });
      } catch (err) {
        console.error('[auth] reset email failed:', err.message);
      }
    }
  }
  return json(200, { ok: true });
}

async function handleSetPassword(env, payload, url) {
  const token = typeof payload?.token === 'string' ? payload.token : '';
  const password = typeof payload?.password === 'string' ? payload.password : '';
  if (password.length < 8) return json(400, { error: 'password must be at least 8 characters' });
  const userId = token ? await consumePasswordResetToken(env.DB, token) : null;
  if (!userId) return json(400, { error: 'invalid_or_expired_token' });

  await env.DB.prepare('UPDATE users SET password_hash = ?, must_set_password = 0 WHERE id = ?')
    .bind(await hashPassword(password), userId)
    .run();
  // Revoke any existing sessions, then sign the user in fresh.
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  const cookie = await createSession(env.DB, env, user.id, url);
  return json(200, { user: publicUser(user) }, { 'Set-Cookie': cookie });
}

// --- Router ---------------------------------------------------------------

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    try {
      if (pathname === '/api/health' && method === 'GET') {
        return json(200, { ok: true });
      }

      if (method === 'POST' && ['/api/apply', '/api/investors', '/api/feedback'].includes(pathname)) {
        const kind = pathname === '/api/apply' ? 'apply' : pathname === '/api/investors' ? 'investor' : 'feedback';
        return handleComposedSubmission(env, kind, await readJson(request));
      }

      if (pathname === '/api/contact' && method === 'POST') {
        return handleContact(env, await readJson(request));
      }

      if (pathname === '/api/auth/register' && method === 'POST') {
        return handleRegister(env, request, await readJson(request), url);
      }
      if (pathname === '/api/auth/login' && method === 'POST') {
        return handleLogin(env, await readJson(request), url);
      }
      if (pathname === '/api/auth/logout' && method === 'POST') {
        await destroySession(env.DB, env, request);
        return json(200, { ok: true }, { 'Set-Cookie': clearSessionCookie(url) });
      }
      if (pathname === '/api/auth/me' && method === 'GET') {
        const user = await getSessionUser(env.DB, env, request);
        if (!user) return json(401, { error: 'unauthenticated' });
        return json(200, { user: publicUser(user) });
      }
      if (pathname === '/api/auth/request-password-reset' && method === 'POST') {
        return handleRequestPasswordReset(env, request, await readJson(request));
      }
      if (pathname === '/api/auth/set-password' && method === 'POST') {
        return handleSetPassword(env, await readJson(request), url);
      }

      // Google sign-in: config-gated stub (§4.7). Credentials are owner-
      // gated; nothing is invented. When unconfigured → 501. When
      // configured, the OAuth flow itself is future work → still 501.
      if (pathname.startsWith('/api/auth/google')) {
        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
          return json(501, { error: 'google_auth_not_configured' });
        }
        return json(501, { error: 'google_auth_not_implemented' });
      }

      if (pathname === '/api/logs' && method === 'POST') {
        // §5: fire-and-forget; never surface errors to the client.
        try {
          const payload = await readJson(request);
          const page = typeof payload?.page === 'string' ? payload.page.slice(0, 100) : '';
          if (page) {
            const user = await getSessionUser(env.DB, env, request);
            await env.DB.prepare('INSERT INTO app_logs (user_id, page, created_at) VALUES (?, ?, ?)')
              .bind(user?.id ?? null, page, new Date().toISOString())
              .run();
          }
        } catch {
          /* logging must never fail the request */
        }
        return new Response(null, { status: 204 });
      }

      if (pathname.startsWith('/api/')) return json(404, { error: 'not_found' });
      return json(404, { error: 'not_found' });
    } catch (err) {
      console.error('[worker] unhandled error:', err);
      return json(500, { error: 'internal_error' });
    }
  },
};
