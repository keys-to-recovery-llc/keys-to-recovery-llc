// KTR Credit Repair Advocate — public chat endpoint.
//
// Mirrors Amanda's Ask Lexi pattern (Responses API, server-side doctrine,
// graceful "not enabled" fallback) with two KTR-specific choices:
//
// 1. DOCTRINE LIVES IN SECRETS, NOT IN THIS FILE. The keys-to-recovery-llc
//    repo is PUBLIC, and the Advocate's instructions are Bart's IP (extracted
//    verbatim from his ChatGPT GPT "KTR Credit Repair Advocate", see
//    workspace/keys-to-recovery-llc/credit-advocate/extract-2026-10-23.md).
//    Cloudflare secrets cap at 5.1 kB and the instructions are 6.1 kB, so
//    they are split across two secrets, concatenated here in order:
//      wrangler secret put CREDIT_ADVOCATE_INSTRUCTIONS   (part 1)
//      wrangler secret put CREDIT_ADVOCATE_INSTRUCTIONS_2 (part 2)
//    A deploy missing either part serves the credit_chat_not_configured
//    fallback instead of answering with truncated doctrine.
// 2. PUBLIC-ENDPOINT ABUSE CARE. The endpoint is unauthenticated (clients
//    are site visitors), so each caller IP gets 20 messages/day, counted in
//    D1 (credit_chat_usage). The key is a SHA-256 of the IP, never the IP
//    itself. Client privacy rule from the doctrine applies throughout:
//    visitors are told in the UI not to paste SSNs, dates of birth, or full
//    account numbers, and the worker stores no message content at all.
//
// Route: POST /api/credit-chat
//   Request:  { message: string (1..4000 chars),
//               history?: [{ role: 'user'|'assistant', content: string }] }
//             history is capped at 12 turns; the browser holds the thread.
//   Response: { reply: string, model: string }
//   Errors:   400 invalid_request, 429 daily_limit_reached,
//             502 provider_* (OpenAI unreachable/auth/rate-limit),
//             503 credit_chat_not_configured (key or doctrine secret missing)

const MAX_MESSAGE_CHARS = 4000;
const MAX_HISTORY_TURNS = 12;
const DAILY_LIMIT_PER_IP = 20;

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function cleanTurn(turn) {
  if (!turn || typeof turn !== 'object') return null;
  if (turn.role !== 'user' && turn.role !== 'assistant') return null;
  if (typeof turn.content !== 'string') return null;
  const content = turn.content.trim();
  if (!content) return null;
  return { role: turn.role, content: content.slice(0, MAX_MESSAGE_CHARS) };
}

async function checkDailyLimit(env, request) {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const day = new Date().toISOString().slice(0, 10); // UTC day
  const ipHash = await sha256Hex(ip);
  await env.DB.prepare(
    `INSERT INTO credit_chat_usage (ip_hash, day, count) VALUES (?, ?, 1)
     ON CONFLICT(ip_hash, day) DO UPDATE SET count = count + 1`,
  )
    .bind(ipHash, day)
    .run();
  const row = await env.DB.prepare('SELECT count FROM credit_chat_usage WHERE ip_hash = ? AND day = ?')
    .bind(ipHash, day)
    .first();
  return (row?.count ?? 0) <= DAILY_LIMIT_PER_IP;
}

function extractReplyText(data) {
  const output = Array.isArray(data.output) ? data.output : [];
  return output
    .flatMap((item) => {
      const content = Array.isArray(item?.content) ? item.content : [];
      return content.filter((part) => part.type === 'output_text').map((part) => part.text || '');
    })
    .join('\n')
    .trim();
}

export async function handleCreditChat(env, request, payload) {
  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';
  if (!message || message.length > MAX_MESSAGE_CHARS) {
    return json(400, { error: 'invalid_request' });
  }
  const history = Array.isArray(payload?.history)
    ? payload.history.map(cleanTurn).filter(Boolean).slice(-MAX_HISTORY_TURNS)
    : [];

  const doctrine = env.CREDIT_ADVOCATE_INSTRUCTIONS && env.CREDIT_ADVOCATE_INSTRUCTIONS_2
    ? env.CREDIT_ADVOCATE_INSTRUCTIONS + '\n\n' + env.CREDIT_ADVOCATE_INSTRUCTIONS_2
    : null;
  if (!env.OPENAI_API_KEY || !doctrine) {
    return json(503, {
      error: 'credit_chat_not_configured',
      message: 'The Credit Repair Advocate is not enabled yet. Please try again later.',
    });
  }

  try {
    if (!(await checkDailyLimit(env, request))) {
      return json(429, {
        error: 'daily_limit_reached',
        message: 'You have reached the daily message limit for the Credit Repair Advocate. Please try again tomorrow.',
      });
    }
  } catch (err) {
    console.error('[credit-chat] usage counting failed:', err.message);
    return json(500, { error: 'internal_error' });
  }

  const model = env.OPENAI_MODEL || 'gpt-5-mini';
  let response;
  try {
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        instructions: doctrine,
        input: [...history, { role: 'user', content: message }],
        store: false,
      }),
      signal: AbortSignal.timeout(60000),
    });
  } catch (err) {
    console.error('[credit-chat] OpenAI request failed:', err.message);
    return json(502, { error: 'provider_error' });
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Never forward the provider's message text — it can carry account
    // details. Log it server-side only.
    console.error('[credit-chat] OpenAI error:', response.status, data?.error?.message || '');
    if (response.status === 401 || response.status === 403) {
      return json(502, { error: 'provider_auth_error' });
    }
    if (response.status === 429) {
      return json(429, { error: 'provider_rate_limited' });
    }
    return json(502, { error: 'provider_error' });
  }

  const reply = extractReplyText(data);
  if (!reply) {
    console.error('[credit-chat] OpenAI returned no text output');
    return json(502, { error: 'provider_error' });
  }
  return json(200, { reply, model });
}
