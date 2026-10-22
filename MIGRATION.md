# MIGRATION.md — Keys to Recovery LLC, Base44 Independence

**Owner:** Keys to Recovery LLC (Bart Rowley). **Supervisor:** Jessica.
**Source:** Base44 app "Keys to Recovery" (ID `69925baf5daebb933c304d0e`),
original source imported at `main @ d6df0f7`.
**Normative interface:** [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md) —
both migration lanes build to it.

## Team model / branch map

| Lane | Branch | Scope |
| ---- | ------ | ----- |
| Backend (this lane) | `feat/debase44-independence` | `worker/` (API + D1 + Mailer), `public/` PWA assets + SPA redirects, `docs/API-CONTRACT.md`, this file |
| Frontend (Codex) | `feat/debase44-frontend` | `package.json` / `vite.config.js` plugin + SDK removal, `base44Client` replacement, `AuthContext`, SendEmail call sites, Layout footer credit, logo references, `index.html` |

**Parked frontend edits from this lane: NONE.** This lane made zero edits
to frontend files (read-only audit only). Nothing is stashed; nothing
frontend-shaped is committed on this branch.

**Nothing in this repo has been deployed.** No Cloudflare deploys, no DNS
changes, no changes to the live Base44 app. Cutover is owner-gated.

## Dependency audit — every Base44 dependency and its replacement

| Base44 dependency | Where it appeared | Replacement |
| ----------------- | ----------------- | ----------- |
| `@base44/sdk` (client, auth, integrations, appLogs) | `src/api/base44Client.js`, `src/lib/AuthContext.jsx` | Frontend lane: local client against the Worker API (contract §2/§4/§5). Backend: `worker/` in this repo |
| `@base44/vite-plugin` | `vite.config.js` | Frontend lane: removed; plain Vite + React plugin |
| `base44/config.jsonc` | repo root | Deleted by frontend lane; no replacement needed |
| `base44.integrations.Core.SendEmail` | Apply, Investors, Contact (feedback) | `POST /api/apply`, `/api/investors`, `/api/feedback` → D1 storage + `Mailer` (contract §2) |
| Base44 hosted auth (`auth.me/logout/redirectToLogin`, public-settings endpoint) | AuthContext, Account, PageNotFound | Worker auth: PBKDF2-SHA256 passwords, HMAC-signed revocable session cookie, `GET /api/auth/me` etc. (contract §4) |
| Base44 user base (7 users) | platform-side | Identity records in D1 `users` with `external_id`; passwords do **not** transfer — first-login set-password flow (contract §4.8; seed pending Q8) |
| `base44.appLogs.logUserInApp` | NavigationTracker | `POST /api/logs` → D1 `app_logs` (contract §5) |
| Base44 MCP consent endpoints | `OAuthConsent.jsx` (unrouted) | **No replacement** — no MCP server in the new architecture (contract §6; open question Q5) |
| Logo hot-linked from Base44/Supabase storage | Layout (×2), Home | Self-hosted `public/logo-full.png` (original `FullLogo_NoBuffer.png`, 1024×806) — frontend lane points references at it |
| `base44.com/logo_v2.svg` favicon + "Base44 APP" title | `index.html` | Local `/favicon.png` + icons from the recovered logo (this lane); `index.html` edits are frontend-lane hand-off (§Hand-off) |
| "Built with Base44" footer credit | `Layout.jsx` line 307 | Removed by frontend lane (owner directive); nothing replaces it |
| Base44 "Welcome Email" template (Draft, admin UI only) | platform-side | `sendWelcomeEmail` hook in the Worker, disabled until the owner supplies the template content (Q7) |
| Google sign-in (enabled on Base44 app) | platform-side | Config-gated stub: `501 google_auth_not_configured` until the owner provides OAuth credentials (contract §4.7; Q10) |

External services intentionally **kept**: the Donate page's Cash App link
(`https://cash.app/$KEYSTORECOVERY`) — it was never a Base44 feature.

## Deliberate behavior fix (documented, not silent)

**General contact form.** On Base44, `Contact.jsx`'s main form submitted
nothing — it waited 1.5 s and displayed success; inquiries were lost.
The new `POST /api/contact` endpoint persists the inquiry to D1 and
emails a notification (contract §2.4). The frontend lane wires the form
to it. The feedback form on the same page was real on Base44 and keeps
byte-exact behavior via `POST /api/feedback`.

## Sensitive data — housing applications

Application submissions (`kind = 'apply'`) contain personal data, DOB,
and recovery/substance-use history. Posture (contract §2.7):

- Stored in D1 only; **no read/list API exists for submissions of any
  kind.** Operator retrieval is by direct database access only.
- Notification email goes only to `Support@keystorecoveryllc.com`
  (recipient allowlist enforced server-side — the API cannot be used as
  an open relay).
- Bodies and field values are never written to logs; the dev mailer
  redacts `apply` messages (verified in smoke test, below).

## Architecture

```
Browser ──► Cloudflare Pages (SPA, dist/) ──► /api/* ──► Cloudflare Worker (worker/)
                                                              │
                                                              ├─► D1 (users, sessions,
                                                              │     password_reset_tokens,
                                                              │     submissions, app_logs)
                                                              └─► Mailer ─► HTTP email API (prod)
                                                                          └► console log (dev)
```

- Pages serves the Vite build; `public/_redirects` gives SPA fallback
  for deep links (`/About`, `/Apply`, `/Account`, …). Static files
  (manifest, icons, `sw.js`) are served directly.
- The Worker is routed on the **same domain** at `/api/*`, so the
  `ktr_session` cookie (HttpOnly, SameSite=Lax) works without CORS.
- PWA: `public/manifest.json` + icons generated from the recovered logo
  (192/512 + maskable-512 + apple-touch 180), `public/sw.js`
  (network-first pages, cache-first static, `/api/*` never intercepted).

## Environment variables

Full documented list: [`.env.example`](.env.example). In production,
secrets are Worker secrets (`wrangler secret put SESSION_SECRET`,
`EMAIL_API_KEY`, `GOOGLE_CLIENT_SECRET`) — never repo files. With **no**
email env set, the dev mailer logs messages and the whole site runs
end-to-end locally.

## Deploy instructions (OWNER-GATED — do not run without approval)

```bash
# 1. Backend: create D1 and wire its ID into worker/wrangler.toml
cd worker && npm install
npx wrangler d1 create keys-to-recovery-llc        # copy the printed ID into wrangler.toml
npx wrangler d1 migrations apply keys-to-recovery-llc --remote
npx wrangler secret put SESSION_SECRET             # long random value
#    when an email provider is chosen:
npx wrangler secret put EMAIL_API_KEY
#    set [vars] in wrangler.toml: EMAIL_API_URL, EMAIL_FROM,
#    NOTIFICATION_RECIPIENTS, CONTACT_RECIPIENT, APP_BASE_URL
npx wrangler deploy
#    Add a route: keystorecoveryllc.com/api/* → this Worker.

# 2. Frontend (after feat/debase44-frontend merges): Cloudflare Pages
#    project connected to this repo; build: npm run build; output: dist.

# 3. Migrated users: insert the 7 identity records (needs Q8 data) with
#    password_hash NULL, must_set_password 1, external_id = Base44 user ID,
#    then trigger POST /api/auth/request-password-reset per user so each
#    receives a set-password link.

# 4. DNS cutover for keystorecoveryllc.com — LAST, only on the owner's
#    explicit approval, after acceptance tests pass.
```

## What remains for production (all owner-gated)

1. **Email provider**: choose one, set `EMAIL_API_URL` / `EMAIL_API_KEY`
   / `EMAIL_FROM`; confirm sending-domain SPF/DKIM (see Q1/Q6 context).
2. **Google OAuth credentials** (if Google sign-in is wanted at launch —
   see Q10) + implement the OAuth flow behind the existing stub.
3. **Migrated-user seed data** (Q8) and the set-password rollout.
4. **Welcome Email template content** (Q7) if welcome mail is desired.
5. **DNS cutover** + acceptance pass on the live domain.
6. Frontend branch merge, then the final `dist` grep (below).

## Verification log (backend lane, 2026-10-22)

Environment: node v24.20.0, npm 10.9.4, wrangler 4.x (worker devDependency).

```bash
cd worker && npm install                      # OK
npm run db:migrate:local                      # 0001_init.sql ✅ (10 commands)
npx wrangler dev --port 8787                  # Ready on http://localhost:8787
```

| Check | Result |
| ----- | ------ |
| `GET /api/health` | `200 {"ok":true}` |
| `POST /api/contact` (valid) | `200 {"ok":true}`; row stored; dev mailer logged composed email to `Support@keystorecoveryllc.com` |
| `POST /api/contact` (bad `inquiryType`) | `400` with enum error |
| `POST /api/feedback` (exact §2.3 envelope) | `200`; row stored with recipient `bart@keystorecoveryllc.com`, subject byte-identical |
| `POST /api/apply` (601-char `substanceHistory`) | `400 substanceHistory exceeds 600 characters` |
| `POST /api/apply` (valid) | `200`; row stored; dev mailer logged **redacted** (subject + byte count only; body string occurs 0× in the log) |
| `POST /api/auth/register` | `201` + user JSON + session cookie |
| `GET /api/auth/me` with cookie | `200` user |
| `POST /api/auth/login` wrong password | `401 invalid_credentials` |
| `POST /api/auth/logout` → `GET /api/auth/me` | `200` → `401` (server-side revocation works) |
| Migrated-style user (`password_hash NULL`) login | `401 password_not_set` |
| `POST /api/auth/request-password-reset` | `200`; dev mailer logged the email containing `reset_token` link |
| `POST /api/auth/set-password` with token | `200` + signed in; token reuse → `400 invalid_or_expired_token`; login with the new password succeeds |
| Duplicate register | `409 email_already_registered` |
| `GET /api/auth/google` | `501 google_auth_not_configured` |
| `POST /api/logs {"page":"Home"}` | `204`; row in `app_logs` |
| D1 counts after battery | users 2, submissions 3, sessions 2, app_logs 1 |
| `public/manifest.json` | Valid JSON; name “Keys to Recovery LLC”; icons 192/512/maskable present |
| Icon files (PIL-verified dimensions) | icon-192 = 192×192, icon-512 = 512×512, maskable = 512×512, apple-touch = 180×180, favicon = 64×64, logo-full = 1024×806 |

**Not verified by this lane (explicit dependencies):**

- `npm run build` of the frontend + `grep dist` for `base44` /
  `supabase.co` returning zero — requires the frontend lane's branch
  (`feat/debase44-frontend`) and a merge; the acceptance grep must run
  then. This lane guarantees the Worker/PWA side introduces no Base44
  references (`worker/`, `public/`, `docs/` are clean by construction —
  the only `base44` strings on this branch are historical notes in
  `docs/API-CONTRACT.md` and this file).
- Route rendering of the 10 SPA routes (frontend lane + merged build).
- Real email delivery (needs the production provider, owner-gated).
- Anything on the live domain (no deploy performed).

## Hand-off notes for the frontend lane (Codex)

1. **SendEmail mapping** (per contract §2.5): each call site posts to its
   semantic endpoint with `{ to, subject, body, fields }` — `fields` is
   the page's existing `formData` object, unchanged. The general contact
   form posts `{ fields }` to `POST /api/contact` (contract §2.4 fix).
2. **Password set/reset landing**: reset emails link to
   `/Account?reset_token=<token>`; the Account page (or a set-password
   view) should read `reset_token` and POST it with the new password to
   `/api/auth/set-password`. Login responses may carry
   `401 {"error":"password_not_set"}` for migrated users — route those
   users to the set-password flow.
3. **`index.html`**: set `<title>` to “Keys to Recovery LLC” (currently
   “Base44 APP”); favicon → `/favicon.png`; add
   `<meta name="theme-color" content="#000000">` and
   `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">`.
   The existing `<link rel="manifest" href="/manifest.json">` stays.
4. **Service worker registration** (add near app entry, e.g. `main.jsx`):
   ```js
   if ('serviceWorker' in navigator) {
     window.addEventListener('load', () => {
       navigator.serviceWorker.register('/sw.js').catch(() => {});
     });
   }
   ```
5. **Local dev proxy**: to run the full stack locally, proxy `/api` to
   the Worker dev server in `vite.config.js`:
   ```js
   server: { proxy: { '/api': 'http://localhost:8787' } }
   ```
   with `cd worker && npx wrangler dev` running alongside `npm run dev`.
6. **Logo**: reference `/logo-full.png` (in `public/`) where Layout/Home
   currently hot-link the Supabase URL.

## Questions for the ChatGPT lane (do not guess — supervisor relays)

- **Q1.** What From address / from-name and Reply-To did Base44's
  SendEmail actually use in production? (Call sites pass only
  to/subject/body.) Needed to configure `EMAIL_FROM` faithfully.
- **Q2.** Were form submissions visible anywhere in the Base44 admin
  (inbox/records), i.e. is there historical submission data to migrate,
  or was email the only record?
- **Q3.** Was public self-registration open on the Base44 app, or were
  the 7 accounts invite/admin-created only? (Launch posture; the new
  backend supports open registration either way.)
- **Q4.** Did anything consume `appLogs.logUserInApp` data (owner
  dashboard, analytics, retention rules), or was it write-only?
- **Q5.** Does anything still depend on the Base44 MCP OAuthConsent flow
  (integrations, automations, external clients)? It has no replacement
  in the new architecture (contract §6).
- **Q6.** Confirm `Support@keystorecoveryllc.com` as the notification
  recipient for general contact-form inquiries (contract §2.4 — the form
  never sent anything, so there is no observed recipient).
- **Q7.** Provide the content of the custom "Welcome Email" template
  (Draft status in the Base44 admin UI, not connector-visible) if new
  registrations should keep receiving it.
- **Q8.** For the 7 migrated users: each user's **email address** and
  **Base44 user ID** (for `users.external_id`), so the seed migration
  can be generated (contract §4.8).
- **Q9.** `roweysfinest90` and `rowleysfinest90` — two distinct accounts
  or a duplicate registration by the same person? Both are preserved as
  separate identity records regardless; asking so the owner isn't
  surprised at cutover.
- **Q10.** Did any of the 7 users actually sign in with Google (vs
  email/password)? If yes, Google sign-in must be a real flow before
  cutover rather than the config-gated stub.

## Push status (blocker for the supervisor)

As of 2026-10-22, this branch's commits exist **locally** in the clone at
`~/workspace/keys-to-recovery-llc/migration/repo`. `git push` from the
agent runtime fails: HTTPS asks for a GitHub username (no credential
helper/token available) and SSH to github.com is blocked by the runtime
proxy. The supervisor should push `feat/debase44-independence` from an
authenticated environment; Codex's start is gated on the contract commit
(`8828b0d`) being visible.
