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

## Frontend completion (Jessica's lane, after Codex handoff)

Codex (ChatGPT's coding agent) started this branch and hit its session
tool-call limit mid-job, honestly reporting the work incomplete. Its
commits, all verified present and correct by this lane:

- `6cee4bd` — `src/api/client.js` (same-origin Worker API client)
- `820e555` — `package.json` (`@base44/*` removed), `ecf4827` —
  `vite.config.js` (plugin removed, `/api` dev proxy added)
- `122ec4d` — `index.html` (local favicon/icons, manifest, title),
  `7303c2e` — `src/main.jsx` (service-worker registration)
- `d4bba5a` — `src/Layout.jsx` (footer credit removed, local logo),
  `395f071` — `src/pages/Home.jsx` (local logo)
- `277b362` — `src/lib/AuthContext.jsx` (slim rewrite on the API
  client), `df404e4` — `src/lib/NavigationTracker.jsx`
  (`POST /api/logs`), `56a88ef` — `src/lib/PageNotFound.jsx`
  (`auth.me` via client)
- `c406b2b` — `src/pages/Apply.jsx` submission wired to
  `POST /api/apply`

Finished by this lane (commits `305e14e`, `d694521`, `f15e58b`,
`07724c2`):

1. **Investors** — the `SendEmail` call now posts
   `{ fields, to, subject, body }` to `POST /api/investors`
   (contract §2.2/§2.5). Em-dash subject template and the
   success/error UX are unchanged.
2. **Contact** — both workflows wired. The main form now really
   submits: `POST /api/contact` with `{ fields }` (`phone` sent as
   `null` when empty, per §2.4) — the documented defect fix; the
   fake 1.5 s delay is gone and a failure now surfaces an error
   banner (new UX, part of the fix). The feedback form posts the
   byte-exact §2.3 envelope to `POST /api/feedback`, keeping the
   original no-`try/catch` structure (a rejected request leaves the
   form in its loading state, exactly as the original behaved;
   contract §2.3 accepts either).
3. **Account** — `auth.me()` / `auth.logout()` via
   `src/api/client` (§4.2/§4.3). See deviation note (b) below.
4. **Legacy deletion** — `src/api/base44Client.js`,
   `base44/config.jsonc` (and the `base44/` directory),
   `src/lib/app-params.js`, `src/pages/OAuthConsent.jsx` deleted.
   After the rewrites, `app-params.js` had no importers left
   (contract §4.6 anticipated exactly this). `OAuthConsent.jsx` was
   unrouted (absent from `pages.config.js` and `App.jsx`) and is
   the platform MCP consent surface, which has **no replacement**
   (contract §6; question Q5 stays open) — it is preserved in git
   history at `main @ d6df0f7` if Q5 ever resolves differently.
5. **Dependencies** — fresh `npm install` regenerated
   `package-lock.json` (the branch previously had none): 592
   packages, zero `@base44` entries in the lockfile and no
   `node_modules/@base44`.
6. **Client reconciliation (§8)** — `src/api/client.js` endpoints,
   `{ user }` unwrapping, and the reject-with-`.status` error
   contract all match §4.2/§4.7/§8. One fix: `auth.logout` now
   accepts an optional redirect URL and navigates after the session
   ends, as §4.3 specifies (previously it ignored the argument).
7. **Reference purge** — the stock site-builder README was replaced
   with a project README; stale platform mentions in comments,
   `.env.example`, `.gitignore`, and the `worker/` notes were
   reworded (no behavior change). Case-insensitive grep for
   `base44` over `src/`, `index.html`, root configs, `public/`,
   `README.md`, `.env.example`, and `worker/` (excluding lockfiles)
   returns **zero**; the only remaining mentions in the repo are
   historical notes in `docs/API-CONTRACT.md` and this file.

Deviations and observations (all deliberate, none silent):

- **(a) `client.js` `auth.logout`** gained the optional-redirect
  behavior in item 6 — contract §4.3 wins over Codex's shape.
- **(b) Account delete flow** calls `auth.logout()` *without* the
  original's `'/'` argument. The original argument targeted the
  platform SDK's post-logout redirect; no such redirect exists in
  the independent architecture, and the page's own "Account
  Deleted" confirmation screen is its designed terminal state.
  The session is ended server-side (`POST /api/auth/logout`)
  exactly as before.
- **(c) `AuthContext.logout`** (Codex's rewrite, verified, left as
  built) redirects to `/` after sign-out; the original returned to
  the current URL. It currently has no UI call site on this branch,
  so the difference is not user-visible today; flagged for the
  supervisor rather than silently changed.

### Verification log (frontend completion, 2026-10-22)

Environment: node v24.20.0, npm 10.9.4, wrangler 4.x (worker
devDependency). Commands run in the fresh clone
`~/workspace/keys-to-recovery-llc/migration/repo-frontend`:

```bash
npm install                                   # 592 packages
npm run build                                 # ✓ built in ~7s (2103 modules)
grep -ri "base44" dist/                       # 0 matches
grep -ri "supabase.co" dist/                  # 0 matches
cd worker && npm install && npm run db:migrate:local   # 0001_init ✅
npx wrangler dev --port 8787 &                # Worker (dev mailer)
npx vite preview --port 4173 &                # built SPA from dist/
```

| Check | Result |
| ----- | ------ |
| All 10 routes on the preview server (`/`, `/Home`, `/About`, `/Services`, `/Apply`, `/Contact`, `/Donate`, `/Investors`, `/Resources`, `/Account`) | `200` + app shell on every route |
| `POST /api/contact` (payload shaped exactly as the new form sends, `phone: null`) | `200 {"ok":true}`; row stored, subject `Website Contact Inquiry: Smoke Contact`, notification logged by dev mailer |
| `POST /api/feedback` (§2.3 envelope) | `200`; stored subject verified **byte-identical** (UTF-8 comparison incl. the em dash) |
| `POST /api/apply` (601-char `substanceHistory`) | `400 substanceHistory exceeds 600 characters` |
| `POST /api/apply` (valid) | `200`; dev mailer logged the **redacted** line only — application body occurs 0× in the Worker log |
| `POST /api/investors` (valid, em-dash subject) | `200`; row stored with subject intact |
| `POST /api/auth/register` → `GET /api/auth/me` | `201` + `{id, email, full_name, role}`; `me` `200` with the session cookie |
| `POST /api/auth/logout` → `GET /api/auth/me` | `200` → `401 unauthenticated` (server-side revocation) |
| `POST /api/auth/login` → `me`; wrong password | `200` → `200`; wrong password `401 invalid_credentials` |

**Not verified by this lane:** real email delivery (needs the
production provider, owner-gated); the Account page's rendered
profile card against a live session in a browser (API round-trip
verified; rendering was verified only to the app-shell level);
anything on the live domain (no deploy performed).

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

## Auth UI completion (Jessica's lane, 2026-10-22)

Gap closed: the Worker auth API and `src/api/client.js` auth methods
existed and were smoke-verified, but no page consumed them — on Base44,
sign-in was platform-hosted, so without a UI nobody (including the
migrated users whose set-password links land on
`/Account?reset_token=...`) could authenticate. `src/pages/Account.jsx`
now carries the full auth surface as state-driven views in the page's
existing design system (navy `#1e3a5f` / gold `#d4a574`, `ui/*` inputs
at `h-12`, Apply-style error/success boxes):

- **Set Password view** — entered when `reset_token` is in the query
  string. New password + confirm; client-side validation mirrors the
  Worker rule exactly (≥ 8 characters, from
  `handleSetPassword`/`handleRegister` in `worker/src/index.js`) plus a
  match check. Submits `POST /api/auth/set-password`; on success the API
  signs the user in and the account view shows. On
  `400 invalid_or_expired_token`, the error shows with an inline
  "request a new link" form (email → `POST /api/auth/request-password-reset`).
- **Sign-in view** (signed-out default): login form
  (`POST /api/auth/login`); `401 password_not_set` (§4.8 migrated user)
  switches to an amber guidance panel — "Your account was moved from
  our previous website" — with an "Email me a set-password link" action;
  `401 invalid_credentials` shows a plain error. A "Forgot your
  password?" action leads to the reset view.
- **Register view**: full name + email + password + confirm — the exact
  field set the Worker register handler requires (§4.7). Client-side
  mirror of the server rules (name non-empty, password ≥ 8, match);
  `409 email_already_registered` maps to a "try signing in" message.
  Success signs the user in (201 + session cookie).
- **Forgot Password view**: email → `POST /api/auth/request-password-reset`,
  then a neutral confirmation ("If an account exists for that email
  address, a link … is on its way") that never reveals whether the
  account exists, matching the API's always-200 behavior.
- **Signed-in view**: unchanged profile + delete cards, plus a Sign Out
  button on the profile card wired to `AuthContext.logout()` (which
  ends the session and redirects to `/`).

Choices worth noting:

- **returnTo (§4.4)**: after login/register/set-password, if the
  `returnTo` query param is present it is honored via
  `window.location.assign` — same-origin targets only, and never
  `/Account` itself. Otherwise the user stays on `/Account` and the
  one-time `reset_token` is scrubbed from the address bar with
  `history.replaceState`.
- **AuthContext**: Account keeps its own `user` state (as the page
  always did) and uses the context only for `logout()`. It deliberately
  does **not** call `checkAppState()` after sign-in actions: that
  helper flips the app shell into its loading state and remounts the
  route tree, which would discard this page's local state (including
  the "Account Deleted" confirmation). No component renders from the
  provider's cached user on this page, and the provider re-checks
  `/api/auth/me` on the next full load, so the cached value cannot go
  visibly stale.
- **No Google sign-in UI** — the Worker route is a config-gated 501
  stub and no credentials exist (§4.7).

Verification (2026-10-22, this lane):

```bash
npm run build                                 # OK (9.55s, chunk-size warning only)
grep -ri "base44" dist | wc -l                # 0
grep -ri "supabase.co" dist | wc -l           # 0
# built bundle contains the new views: "Set Your Password",
# "Email me a set-password link", "Forgot your password",
# "Create Account", "Email me a reset link" — each found 1x.
cd worker && npm run db:migrate:local         # OK (already applied)
# seeded a migrated-style user into LOCAL D1 (synthetic test data only):
#   migrated.smoke@example.com, password_hash NULL, must_set_password 1
npx wrangler dev --port 8787                  # Worker on http://localhost:8787
npx vite preview --port 4173                  # built SPA; /api proxied to :8787
```

| Check | Result |
| ----- | ------ |
| `POST /api/auth/login` as migrated user (no password set) | `401 {"error":"password_not_set"}` |
| `POST /api/auth/request-password-reset` (migrated user) | `200 {"ok":true}`; reset link with token logged by the dev mailer |
| `POST /api/auth/set-password` with that token | `200 {user}` + session cookie |
| `GET /api/auth/me` with the new session | `200 {user}` |
| Same token reused | `400 invalid_or_expired_token` |
| `POST /api/auth/set-password` with a 5-char password | `400 "password must be at least 8 characters"` |
| `POST /api/auth/login` wrong password | `401 invalid_credentials` |
| `POST /api/auth/login` correct password | `200 {user}`; subsequent `GET /api/auth/me` → `200` |
| `POST /api/auth/register` (new user) | `201 {user}` + session cookie; `GET /api/auth/me` → `200` |
| `POST /api/auth/register` duplicate email | `409 email_already_registered` |
| `GET /Account` via `vite preview` | `200`, `<title>Keys to Recovery LLC</title>` |
| Through the preview origin (same path the SPA uses): `GET /api/health`, `POST /api/auth/login`, `GET /api/auth/me` | `200` / `200` / `200` |
| D1 after the battery | migrated user's `must_set_password` cleared to `0` |

**Not verified at rendered-UI level:** this runtime has no browser, so
the forms were not clicked through in a rendered page. Verification is
at API level (full battery above against the real Worker + local D1),
page-serve level (`/Account` serves `200` from the new `dist`, and the
API round-trip succeeds through the preview origin with cookies), and
bundle level (the built output contains the new views and zero
platform references). A human click-through of the four views on a
staging deploy remains an acceptance step.

## Review fixes (Codex F-01/F-02)

From Codex's independent review of the frontend branch; both accepted
by the supervisor and fixed in this lane (2026-10-22).

### F-02 (High) — account deletion was cosmetic; now real

The Account page's delete flow only called `auth.logout()` while its
UI claimed "Your account and associated data have been removed." —
untrue, and user-facing copy must be honest. Fix:

- **Worker**: `DELETE /api/auth/me` requires a valid session
  (`401 unauthenticated` otherwise) and deletes, in order: the user's
  `sessions` rows, their `password_reset_tokens` rows, their
  `users` row; `app_logs` rows are kept but unlinked
  (`user_id` set to `NULL`) since they are fire-and-forget navigation
  analytics. The response clears the session cookie. **Submissions are
  not touched**: they are anonymous form posts (`apply` / `investor` /
  `feedback` / `contact`) with no user column or link in the schema —
  there is nothing user-linked to delete there.
- **Client**: `auth.deleteAccount()` → `DELETE /api/auth/me`.
- **Account page**: the existing confirmation flow and copy are
  unchanged; the confirm button now calls `auth.deleteAccount()` and
  the "Account Deleted" screen shows **only** after the server
  confirms. On failure it shows an error inside the confirmation box
  and stays signed in (the previous logout-and-claim-success fallback
  is gone).

Smoke (same battery as above): register `delete.smoke@example.com` →
`201`; `GET /api/auth/me` → `200`; `DELETE /api/auth/me` → `200
{"ok":true}`; `GET /api/auth/me` with the same cookie → `401`;
`POST /api/auth/login` with the deleted credentials → `401
invalid_credentials`; `DELETE /api/auth/me` with no session → `401`;
users table afterwards no longer contains the deleted user.

### F-01 (Medium) — feedback form could stick in its loading state

`Contact.jsx`'s `handleFeedbackSubmit` awaited `post('/api/feedback')`
with no `try/catch`: a Worker rejection left the submit button spinning
forever and surfaced nothing. It now mirrors the page's main contact
handler exactly: `try/catch/finally` (`setFeedbackLoading(false)` in
`finally`), and a `feedbackError` rendered in the page's existing
error-box style above the submit button. The §2.3 request envelope
(`{fields, to, subject, body}`) is byte-identical — only indentation
inside the `try` block changed — and success behavior is unchanged.
Covered by the build (passes) and the diff audit; the endpoint itself
was already smoke-verified by the earlier lanes.

## Resources build-out (2026-10-22, branch `feat/resources-buildout`)

The Resources page listed 15 resources, every one with `link:"#"`. Per the
owner's order, all 15 now resolve to real, viewable content:

- **6 internal articles** (original copy in `src/data/resourceArticles.js`,
  rendered by `src/pages/ResourceArticle.jsx` at `/Resources/:resourceId`):
  What is Recovery Housing? · The 12 Steps Explained (flagship — all twelve
  steps in short standard wording with per-step exposition, "attraction rather
  than promotion" tone, AA non-affiliation note pointing to aa.org) · Early
  Recovery: What to Expect · Navigating Relationships in Recovery · Supporting
  a Loved One in Recovery · Co-occurring Disorders: Dual Diagnosis. Standard
  articles run 739–835 words; the flagship runs longer by design. Facts are
  grounded in SAMHSA (recovery dimensions/principles, co-occurring disorders,
  National Helpline) and NARR levels — sources in `docs/resources-mapping.md`.
- **9 external links** (new tab, `rel="noopener noreferrer"`), each fetched and
  title/topic-verified during the build: WA HCA peer specialists (#15), SMART
  Recovery Toolbox (#13), SAMHSA Matrix relapse-prevention handouts via AHRQ
  (#6), CFPB Your Money, Your Goals booklets (#8), CareerOneStop
  justice-impacted get-started guide (#14), Johann Hari TED talk on YouTube
  (#3), UCLA Mindful guided meditations (#5, #10), TED-Ed lesson on Dr. Nadine
  Burke Harris's trauma talk (#9 — TED-Ed page chosen because YouTube
  rate-limited direct verification; it embeds the same talk).

Verification: `npm run build` passes; dist greps base44 = 0, supabase.co = 0;
all six article routes serve 200 in `vite preview`; all external URLs fetched
200 (non-YouTube set re-fetched at end of run). No `link:"#"` remains. Diff is
limited to `src/App.jsx` (one route), `src/pages/Resources.jsx`, the two new
files, `docs/resources-mapping.md`, and this section — no other pages, no
`worker/`, no DNS changes. Not deployed; supervisor pushes/merges/deploys.

## Recovery directory (2026-10-22, branch `feat/recovery-directory`)

A nationwide recovery resource directory at **`/Directory`** (nav link added
after Resources; explicit route in `src/App.jsx` following the Resources
pattern). Built by the directory platform agent; **not deployed by that
agent** — supervisor merges/deploys after QC.

- **Crisis block** (pinned first, visually distinct): 988 Lifeline, SAMHSA
  National Helpline, Crisis Text Line, Never Use Alone, plus a plain
  emergencies = 911 note.
- **National directory**: 23 verified locators/gateways in 9 groups
  (`src/data/directory.js`), each tagged with the owner's canonical service
  taxonomy (`directory-data/TAXONOMY.md` — the filter set; AA/NA finders are
  labeled AA Meetings / NA Meetings). Every URL was fetched and
  content-checked during the build; record in `docs/directory-mapping.md`.
- **Locality search**: ZIP / city / county search resolving through the
  Census gazetteer (33,791 ZIPs, 3,235 counties), served lazily from
  `/data/localities.json` (~4.5 MB, never bundled). A locality view shows the
  place identity, its state's verified gateway set, and national-locator
  links — prefilled ONLY where a deep-link pattern was verified by fetching
  a live example (Oxford House `?q=<city>`; VA SUD locator `?STATE=<ST>`).
  All other locators open plainly; no parameter pattern was fabricated.
- **State gateways**: 56 verified files (50 states + DC + AS/GU/MP/PR/VI) in
  `src/data/states/`, imported via glob so future refreshes drop in. 23
  states/territories have no NARR affiliate and say so on the card.
- **County org layer (WIRED, Pierce County pilot)**: per-organization
  listings plug into `CountyOrgsSection`, grouped by taxonomy category.
  Publication gate enforced by default: only records with
  `vetting.result === "CLEAR"` (VETTING.md) can render; EXCLUDE-*/HOLD-REVIEW/
  no-vetting records never render and no accusation text appears in the UI.
  Integration state below.
- **Coverage**: crisis 4 (+911 note) · national 23 · states 56/56 ·
  gazetteer 33,791 ZIPs. Build passes; dist greps base44 = 0,
  supabase.co = 0; preview /Directory 200 with locality spot checks
  (Tacoma WA 98402, Sheridan WY 82801, Miami FL 33101) passing.
- **Facility layer (WIRED)**: the SAMHSA licensed-facility roster plugs into
  `src/data/facilities.js` / `FacilitiesSection` in the locality view —
  listed by level of care, filterable by Detox / Residential / Outpatient /
  MAT / Medicaid. Integration state below.

### Data integration (2026-10-22, supervisor handover)

Three hookups landed on top of the platform build (commits: state sync,
Pierce orgs, facility layer). Regeneration scripts live in `scripts/` —
re-run them after refreshing the source data in
`~/workspace/keys-to-recovery-llc/directory-data/`.

1. **State gateways synced.** `directory-data/states/*.json` (QC-backfilled:
   4 dead links fixed, several notes updated; changed files MD/MS/NJ/NM/RI/
   VA/VT) copied over `src/data/states/`. All 56 files parse; the glob
   import in `src/data/states.js` picks them up (verified: the built bundle
   contains the backfilled NJ-CARS entry).
2. **Pierce County orgs live.** `scripts/merge-pierce-orgs.mjs` merges the
   20 pilot batch files (902 records) into `public/data/orgs-pierce.json`
   (82.6 KB; ~23 KB gzip), keeping ONLY `status="ready"` records — **137
   orgs, all `vetting.result="CLEAR"`**. The asset is lazy-loaded by the new
   orgs data module `src/data/orgs.js` (`useCountyOrgs`), which re-applies
   the publication gate at runtime; the Pierce County, WA locality view
   renders the orgs grouped by canonical taxonomy tags (name, city,
   plain-language services, phone, verified website; a catch-all group
   keeps cleared-but-untagged orgs visible). Shipped records carry only the
   gate fields (`vetting.result/checkedAt`) — the full vetting source trail
   stays in directory-data.
   - **Flip switch**: `EXCLUDED_EINS` at the top of `src/data/orgs.js`,
     EMPTY. Greater Lakes Mental Healthcare (Lakewood, EIN 916064184) is
     the one ready record with a MultiCare affiliation disclosure in its
     vetting sources (parent MultiCare's $3.728M settlement over Spokane
     spinal surgeries; Greater Lakes not named, conduct unrelated — record
     stands CLEAR). If the owner rules strict, add `'916064184'` — one
     line, no data change.
3. **Facilities live.** `scripts/slim-facilities.mjs` slims the 20,371
   SAMHSA records (2025 National Directories / 2024 N-SUMHSS; provenance in
   `directory-data/facilities/source/PROVENANCE.md`; full records archived
   in directory-data, untouched) into `public/data/facilities/<ST>.json`
   (55 chunks, UI fields only). `src/data/facilities.js` lazy-fetches the
   locality's state chunk, adapts records (levels: detox / residential /
   outpatient incl. partial-hospitalization / hospital-inpatient under its
   own label; a "Level of care not reported" catch-all covers 34 survey
   rows with no setting codes — all 20,371 records render in ≥1 group) and
   narrows to the locality's county with a state-roster fallback. Filters
   Detox / Residential / Outpatient / MAT / Medicaid verified working (see
   below). Cards show program name, street address, intake lines and
   licensure/accreditation (`licenseSummary`). The section carries the
   provenance disclosure: 2024 survey snapshot, services may change, verify
   when contacting a facility, facility websites are not in the published
   directories (phone-first). `facilities-stats.json` is copied to
   `public/data/facilities-stats.json`; the hero line surfaces its counts
   ("20,371 licensed treatment facilities (SAMHSA 2024 survey)").
   - **Verification (node, against the shipped chunks + modules):**
     98402 Tacoma → Pierce County narrows to 36 facilities (matches
     `facilities-stats.json` byStateCounty exactly); Detox filter → the 2
     Pierce County detox facilities (Royal WA Sumner; Sound Integrated
     Health LLC, Tacoma); Residential 3, Outpatient 29, MAT 13, Medicaid
     35. 60614 Chicago → Cook County 350 (matches stats). 82801 Sheridan
     WY → 3 Sheridan County facilities.
   - **Asset weight**: facilities 28.0 MB raw total across 55 chunks but
     lazy per state — largest chunk CA 2,466,124 B raw / 174,501 B gzip;
     WA 582,563 B raw. All-55 gzip total would be 1,860,434 B if ever
     preloaded (it is not). Orgs asset 82,632 B raw / 22,947 B gzip.
     Stats 74,075 B. `public/data/` is never bundled.
- **Post-integration verification**: `npm run build` passes; dist greps
  base44 = 0, supabase.co = 0; `vite preview`: `/Directory` 200 and
  `/data/orgs-pierce.json`, `/data/facilities/{WA,IL,WY,CA}.json`,
  `/data/facilities-stats.json`, `/data/localities.json` all 200.
