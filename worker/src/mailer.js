// Mailer interface (API-CONTRACT.md §2.5).
//
// Two drivers:
//  - HTTP API driver (production): used when EMAIL_API_URL and EMAIL_API_KEY
//    are set. POSTs { from, to, subject, text } as JSON with a Bearer key.
//    The exact payload can be adapted to the chosen provider at deploy time
//    without touching call sites.
//  - Dev driver (default): logs the message to the console. The site runs
//    end-to-end locally with NO external keys.
//
// Sensitive messages (housing applications, API-CONTRACT.md §2.7) are never
// logged with their body, in any driver: the dev driver logs recipient,
// subject, and byte count only.

export function createMailer(env) {
  const httpConfigured = Boolean(env.EMAIL_API_URL && env.EMAIL_API_KEY);

  if (httpConfigured) {
    return {
      driver: 'http',
      async send({ to, subject, body }) {
        const res = await fetch(env.EMAIL_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.EMAIL_API_KEY}`,
          },
          body: JSON.stringify({
            from: env.EMAIL_FROM || 'no-reply@keystorecoveryllc.com',
            to,
            subject,
            text: body,
          }),
        });
        if (!res.ok) {
          // Never include the message body in errors (sensitive data hygiene).
          throw new Error(`email provider returned ${res.status}`);
        }
        return { delivered: true, driver: 'http' };
      },
    };
  }

  return {
    driver: 'dev-log',
    async send({ to, subject, body, sensitive = false }) {
      if (sensitive) {
        console.log(
          `[mailer:dev] SENSITIVE message not logged in full.\n  to: ${to}\n  subject: ${subject}\n  body: <redacted, ${body.length} chars>`,
        );
      } else {
        console.log(
          `[mailer:dev] ---- outgoing email ----\n  to: ${to}\n  subject: ${subject}\n\n${body}\n[mailer:dev] ---- end ----`,
        );
      }
      return { delivered: true, driver: 'dev-log' };
    },
  };
}

// Optional welcome email for newly registered users. A custom "Welcome
// Email" template exists in the previous platform's admin UI in Draft
// status, but its content is not available outside that UI — until the owner supplies
// it (see MIGRATION.md, Questions for ChatGPT lane Q7), this hook is a
// no-op unless explicitly enabled with template env vars. Registration
// must never fail because the welcome email did.
export async function sendWelcomeEmail(env, mailer, user) {
  if (env.WELCOME_EMAIL_ENABLED !== 'true') return { sent: false, reason: 'disabled' };
  const subject = env.WELCOME_EMAIL_SUBJECT || 'Welcome to Keys to Recovery LLC';
  const template =
    env.WELCOME_EMAIL_BODY ||
    'Hello {full_name},\n\nYour account for Keys to Recovery LLC is ready.\n';
  const body = template.replaceAll('{full_name}', user.full_name || '');
  try {
    await mailer.send({ to: user.email, subject, body });
    return { sent: true };
  } catch (err) {
    console.error('[mailer] welcome email failed:', err.message);
    return { sent: false, reason: 'delivery_failed' };
  }
}
