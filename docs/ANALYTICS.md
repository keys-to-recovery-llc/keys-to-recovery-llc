# Site analytics — keystorecoveryllc.com

First-party, anonymous usage counts built for what this company actually
needs to know: which resources people use, where the need is, and whether
visitors turn into applications, messages, donations, and chat users.

## What is measured

| Question the company needs answered | How it is answered |
|---|---|
| Which pages get visited? | `pageview` events by page key, 7d / 30d / all-time |
| Where is directory demand? | `directory_state` (picked state) and `directory_tag` (picked category) |
| Which resources get used? | `resource_category` (picked category), `resource_outbound` (tapped link hostname) |
| Do visitors apply / contact / donate? | Funnels: Apply, Contact, and Donate page views vs `submissions` counts and `donate_click` events |
| Is the Credit Repair Advocate used? | Resources page views vs `credit_chat_usage` message totals |
| How do people arrive? | Referrer hostname on pageviews (domain only) |
| Phone or computer? | Device class (`mobile` / `desktop`) on pageviews |

## Events (allowlisted server-side, `worker/src/analytics.js`)

`pageview`, `directory_state`, `directory_tag`, `resource_category`,
`resource_outbound`, `donate_click`. Anything else is dropped.

## Privacy guarantees (also stated on the Privacy page)

- No cookies, no identifiers, no IP addresses, no user-agent strings.
- No third parties, no advertising trackers, no cross-site tracking.
- No free-text input is ever sent: directory/resource filters send only
  the picked state or category; search text is never transmitted.
- Application, contact, and feedback contents are NEVER written to
  analytics (API-CONTRACT §2.7). The summary endpoint exposes submission
  counts by kind only — never subjects, bodies, or fields.
- Signed-in page records (`app_logs`) are unchanged and stay separate;
  analytics covers all visitors, anonymously.
- Raw event rows are deleted after 90 days by the worker's daily
  scheduled prune (`[triggers] crons` in `worker/wrangler.toml`).

## Endpoints

- `POST /api/analytics` — accepts `{ event, page, detail, device, referrer }`,
  always answers 204, silently drops invalid input. Fire-and-forget from
  the client; analytics can never break the site.
- `GET /api/analytics/summary` — admin role only (403 otherwise).
  Aggregate counts: page views, directory demand, resource demand,
  outbound links, referrers, devices, funnels, account/submission totals.

## Dashboard

`src/pages/Analytics.jsx`, route `/Analytics`, linked from the Account
page for admin users only. Non-admins see an "admins only" notice.

## Abuse note

The ingest endpoint is intentionally open (anonymous visitors must be
able to count). Exposure is bounded by the event allowlist, the 120-char
detail cap, and the 90-day prune. If spam rows ever appear, the summary
is still aggregate-only and the prune bounds the damage; a stricter
per-minute cap can be added then.
