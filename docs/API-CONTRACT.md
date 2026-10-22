# API Contract — Keys to Recovery LLC (Base44 Independence Migration)

**Status:** Normative coordination artifact for the de-Base44 migration.
**Extracted:** 2026-10-22, from the original Base44 source at `main @ d6df0f7`.
**Revised:** 2026-10-22, incorporating platform findings from the
ChatGPT/Base44-connector lane (no standalone Base44 backend functions exist;
the four form workflows live entirely in the pages; 7 users to migrate;
form validation is client-side only today).
**Consumers:** the backend lane (Cloudflare Worker + D1) and the frontend
lane (branch `feat/debase44-frontend`). Both lanes build to this document.
If a call site and this document disagree, the call site wins and this
document must be corrected.

A full-source sweep (`grep -rn "base44\." src/`) confirms the frontend's
entire Base44 backend surface is: email (×3 call sites), auth
(`me` / `logout` / `redirectToLogin`), one app-log call, one platform
"public settings" fetch, and one platform MCP consent page. The frontend
uses **no** Base44 entities, **no** backend-function invokes, **no** file
storage/uploads. The connector lane confirms the platform side matches: no
entity schemas, no connected third-party integrations, no standalone backend
functions, no other hidden config. Base44's build of this app was
`npm install` / `npm run build` → `./dist`.

---

## 1. Route inventory (frontend)

Registered in `src/pages.config.js` (`PAGES`) and `src/App.jsx`:

| Route          | Component     | Backend usage |
| -------------- | ------------- | ------------- |
| `/`            | Home          | none (logo image hot-link only) |
| `/Home`        | Home          | none |
| `/About`       | About         | none |
| `/Services`    | Services      | none |
| `/Apply`       | Apply         | `SendEmail` (§2.1) — **sensitive data** |
| `/Contact`     | Contact       | main form: **no submission today** (§2.4, defect fix); feedback form: `SendEmail` (§2.3) |
| `/Donate`       | Donate        | **none** — external Cash App link (§3) |
| `/Investors`   | Investors     | `SendEmail` (§2.2) |
| `/Resources`   | Resources     | none (explicit route in `App.jsx`) |
| `/Account`     | Account       | `auth.me`, `auth.logout` (§4) |
| *(unrouted)*   | OAuthConsent  | platform MCP endpoints (§6). Present in `src/pages/` but **not wired into `App.jsx` routes**. |
| `*` (fallback) | PageNotFound  | `auth.me` (§4) |

Every route is also wrapped by `AuthProvider` (`src/lib/AuthContext.jsx`)
and `NavigationTracker` (`src/lib/NavigationTracker.jsx`), which run on
all pages (§4, §5).

---

## 2. Form submissions

### 2.0 The email primitive — `base44.integrations.Core.SendEmail`

Imported as `import { base44 } from '@/api/base44Client'`. All three live
call sites pass **exactly** `{ to, subject, body }` — no `from`, no
`from_name`, no attachments, no HTML flag. `body` is plain text built by the
page from its form state with a template literal. The return value is
ignored by every call site; only promise resolution/rejection matters.

### 2.1 Housing application — `src/pages/Apply.jsx`, `handleSubmit`

**⚠ SENSITIVE.** The application body contains personal data, date of
birth, and recovery background including substance-use and treatment
history. Application submissions are **protected records**: they are stored
in D1 with no public listing and no read API, delivered by mail only to the
support address, and never written to logs (see §2.7).

Call (inside `try/catch/finally`; `await`ed):

```js
await base44.integrations.Core.SendEmail({
  to: 'Support@keystorecoveryllc.com',
  subject: `New Application: ${formData.fullName} - ${formData.applicationType}`,
  body: emailBody
});
```

Subject separator is a hyphen-minus with spaces (`" - "`). `emailBody`
template (verbatim structure; final line is
`Submitted: ${new Date().toLocaleString()}`, client-local time):

```
NEW RECOVERY HOUSING APPLICATION
================================

PERSONAL INFORMATION
--------------------
Name: ${fullName}
Email: ${email}
Phone: ${phone}
Date of Birth: ${dateOfBirth}

APPLICATION TYPE
----------------
Type: ${applicationType}

RECOVERY BACKGROUND
-------------------
Sobriety Date: ${sobrietyDate}
Substance History: ${substanceHistory}
Previous Treatment: ${previousTreatment}
Current Support Programs: ${currentSupport}

HOUSING INFORMATION
-------------------
Reason for Seeking Housing: ${reasonForHousing}
Room Preference: ${housingPreference}
Preferred Move-in Date: ${moveInDate}

ADDITIONAL INFORMATION
----------------------
Employment Status: ${employment}
Emergency Contact: ${emergencyContact}
Emergency Contact Phone: ${emergencyPhone}

Additional Notes:
${additionalInfo}

================================
Submitted: ${new Date().toLocaleString()}
```

**Semantics:** on resolve → success screen. On reject → error banner
`"Failed to submit application. Please try again or call us at
(253) 240-9724."` and the error is logged to console.

### 2.2 Investor inquiry — `src/pages/Investors.jsx`, `handleSubmit`

Call (inside `try/catch/finally`; `await`ed). Subject separator is an
**em dash** (`" — "`):

```js
await base44.integrations.Core.SendEmail({
  to: 'Support@keystorecoveryllc.com',
  subject: `Investor Inquiry: ${formData.fullName} — ${formData.investorType}`,
  body: emailBody
});
```

`emailBody` template (verbatim structure):

```
NEW INVESTOR INQUIRY — SCHEDULE A MEETING
==========================================

CONTACT INFORMATION
-------------------
Name: ${fullName}
Email: ${email}
Phone: ${phone}
Company / Organization: ${company || 'N/A'}

INVESTMENT PROFILE
------------------
Investor Type: ${investorType}
Capital Range: ${capitalRange}

PREFERRED MEETING TIME
-----------------------
Date: ${preferredDate}
Time: ${preferredTime}

MESSAGE / NOTES
---------------
${message}

==========================================
Submitted: ${new Date().toLocaleString()}
```

**Semantics:** on resolve → success screen. On reject → error banner
`"Failed to submit. Please try again or call us at (253) 240-9724."`

### 2.3 Site feedback — `src/pages/Contact.jsx`, `handleFeedbackSubmit`

Call (**not** wrapped in `try/catch`; `await`ed directly):

```js
await base44.integrations.Core.SendEmail({
  to: 'bart@keystorecoveryllc.com',
  subject: `Site Feedback [${feedbackData.feedbackType}] — ${feedbackData.name}`,
  body: `DEVELOPER FEEDBACK / COMPLAINT PORTAL\n======================================\n\nFrom: ${feedbackData.name}\nEmail: ${feedbackData.email}\nType: ${feedbackData.feedbackType}\n\nMessage:\n${feedbackData.message}\n\nSubmitted: ${new Date().toLocaleString()}`
});
```

Subject separator is an em dash; body is one template literal with literal
`\n` escapes (no `.trim()`).

**Semantics:** after the `await`, unconditionally shows the success state.
With no `try/catch`, a rejected promise leaves the form in its loading
state (plus an unhandled rejection in console). A replacement client that
never rejects reproduces the visible success behavior exactly; one that
rejects on HTTP errors reproduces the failure behavior. Either is
acceptable; the success path must work end-to-end.

### 2.4 General contact — `src/pages/Contact.jsx`, `handleSubmit` — **DEFECT, FIX SPECIFIED**

Today the main contact form sends **nothing**: `handleSubmit` waits
1,500 ms (`setTimeout`) and shows the success state. Inquiries submitted
through it are silently lost. This is a known defect, confirmed by the
connector lane.

**Specified fix (deliberate behavior change, flagged in `MIGRATION.md` —
not silent):** the frontend lane wires this form to a real submission:

```
POST /api/contact
{
  "fields": {
    "name": string,         // required
    "email": string,        // required, email format
    "phone": string | null, // optional
    "inquiryType": string,  // required, enum §2.6
    "message": string       // required
  }
}
```

Server behavior: validate (§2.6) → store (`submissions.kind = 'contact'`)
→ compose a notification email and deliver it via the Mailer:

- **To:** `Support@keystorecoveryllc.com` (the site's published contact
  address — assumption flagged as Question Q6 in `MIGRATION.md`)
- **Subject (defined by this contract; no client template exists):**
  `Website Contact Inquiry: ${name}`
- **Body (defined by this contract):** the field values in labeled lines,
  ending with a server-generated `Submitted: <ISO 8601 UTC>` line.

Success response `200 { "ok": true }` → the form shows its existing success
state. Failure → non-2xx; the frontend lane surfaces an error state (new
UX for this form, part of the fix).

### 2.5 Submission endpoint envelope (normative)

The three pre-existing flows (§2.1–§2.3) keep their exact composed emails.
Each maps to a semantic endpoint. The request JSON carries the composed
SendEmail payload **and** the structured form fields (the frontend has
`formData` in hand at every call site), so the server can validate
(§2.6) and store structured data while emailing the byte-exact body:

```jsonc
POST /api/apply | /api/investors | /api/feedback
{
  "to": string,       // as constructed by the page
  "subject": string,  // as constructed by the page
  "body": string,     // as constructed by the page (byte-exact email body)
  "fields": { /* the page's formData, keys per §2.6 */ }
}
```

Server behavior per submission endpoint:

1. Parse + validate: envelope fields are strings within limits
   (`subject` ≤ 500 chars, `body` ≤ 50,000 chars); `fields` validated
   against the form rules in §2.6. Invalid → `400 { "error": string }`.
2. Recipient safety: the server must not become an open relay. If `to`
   is in the server-side allowlist (`NOTIFICATION_RECIPIENTS` env,
   comma-separated), it is used; otherwise the server substitutes the
   default notification recipient (first allowlist entry). Response shape
   unaffected.
3. Store **before** delivery: `submissions` row (`kind, recipient,
   subject, body, fields` as JSON, `created_at`), so a mail outage never
   loses a submission.
4. Deliver via the `Mailer` interface with the stored `to` / `subject` /
   `body` unchanged.
5. Respond `200 { "ok": true }` after successful delivery. If delivery
   fails after storage → `502 { "error": "delivery_failed" }` (Apply and
   Investors show their error banner; the submission remains stored).

| Call site | Endpoint | `submissions.kind` |
| --------- | -------- | ------------------ |
| Apply (§2.1) | `POST /api/apply` | `apply` |
| Investors (§2.2) | `POST /api/investors` | `investor` |
| Contact feedback (§2.3) | `POST /api/feedback` | `feedback` |
| Contact main form (§2.4, fix) | `POST /api/contact` | `contact` |

### 2.6 Server-side validation (new — mirrors the forms)

Today validation is HTML-only (`required` attributes + input types); no
server-side validation exists anywhere in the Base44 setup. The Worker
validates every submission against the same rules the forms declare:

**Apply** (`fields`):

| Field | Rule |
| ----- | ---- |
| `fullName` | required, string |
| `dateOfBirth` | required, `YYYY-MM-DD` date |
| `email` | required, email format |
| `phone` | required, string |
| `applicationType` | required, one of `resident`, `family`, `referral` |
| `sobrietyDate` | optional, date if present |
| `substanceHistory` | required, **≤ 600 chars** (form `maxLength={600}`) |
| `previousTreatment` | required, string |
| `currentSupport` | optional, string |
| `reasonForHousing` | required, string |
| `housingPreference` | optional, one of `private`, `shared`, `any` |
| `moveInDate` | optional, date if present |
| `employment` | required, one of `employed`, `parttime`, `seeking`, `unemployed`, `disabled` |
| `emergencyContact` | required, string |
| `emergencyPhone` | required, string |
| `additionalInfo` | optional, string |

**Investors** (`fields`):

| Field | Rule |
| ----- | ---- |
| `fullName` | required, string |
| `email` | required, email format |
| `phone` | required, string |
| `company` | optional, string |
| `investorType` | required, one of `PMI - Private Money Investor`, `PML - Private Money Lender`, `PMP - Private Money Partner`, `Mission-Based Investor`, `Mission-Based Lender`, `Other` |
| `capitalRange` | required, one of `Under $25,000`, `$25,000 - $50,000`, `$50,000 - $100,000`, `$100,000 - $250,000`, `$250,000+` |
| `preferredDate` | required, date |
| `preferredTime` | required, one of `Morning (9am - 12pm)`, `Afternoon (12pm - 3pm)`, `Late Afternoon (3pm - 5pm)`, `Evening (5pm - 7pm)` |
| `message` | optional, string |

**Contact** (`fields`):

| Field | Rule |
| ----- | ---- |
| `name` | required, string |
| `email` | required, email format |
| `phone` | optional, string |
| `inquiryType` | required, one of `housing`, `family`, `referral`, `employment`, `other` |
| `message` | required, string |

**Feedback** (`fields`):

| Field | Rule |
| ----- | ---- |
| `name` | required, string |
| `email` | required, email format |
| `feedbackType` | required, one of `Bug Report`, `Suggestion`, `Complaint`, `Accessibility Issue`, `Content Error`, `Other` |
| `message` | required, string |

General string caps (abuse hygiene, above any form-declared cap):
single-line fields ≤ 500 chars, free-text fields ≤ 10,000 chars except
`substanceHistory` (600, form-declared).

### 2.7 Sensitive-data handling (applications)

`kind = 'apply'` submissions are protected records:

- Stored in D1 only; **no GET/list endpoint** exposes submissions of any
  kind. Retrieval is by direct database access (owner/operator only).
- Notification email goes only to `Support@keystorecoveryllc.com`
  (the page-constructed recipient; also enforced by the §2.5 allowlist).
- The Worker must never log application bodies or field values. The dev
  mailer redacts `apply` messages (logs recipient + subject + byte count,
  not the body). Production mail errors must not include body content.
- `MIGRATION.md` documents this sensitivity and the storage posture.

---

## 3. Donate — `src/pages/Donate.jsx`

**Donate makes no backend call of any kind** (confirmed by both the source
sweep and the connector lane). It is a static page whose only conversion
action is an external link:

- Cashtag displayed: `$KEYSTORECOVERY`
- Link: `<a href="https://cash.app/$KEYSTORECOVERY" target="_blank"
  rel="noopener noreferrer">` ("Open Cash App & Donate")

There is no donate form, no amount selection, and no donation processing
or ledger to build. **No `/api/donate` endpoint is part of this system.**
(The original migration brief assumed form workflows named
apply/contact/donate on the platform side; the source and the connector
lane agree there are none.)

---

## 4. Auth interface

### 4.1 What the UI consumes

| Field | Used in | Purpose |
| ----- | ------- | ------- |
| `user.full_name` | `src/pages/Account.jsx` | "Name:" line on profile card |
| `user.email` | `src/pages/Account.jsx` | "Email:" line on profile card |
| `user.role` | `src/lib/PageNotFound.jsx` | `role === 'admin'` shows an "Admin Note" block on the 404 page |

`GET /api/auth/me` returns at least
`{ "id": string, "email": string, "full_name": string, "role": string }`.

### 4.2 `base44.auth.me()`

Call sites: `AuthContext.checkUserAuth`, `PageNotFound` (react-query
`['user']`), `Account` (`useEffect`, `.then(setUser).catch(() => {})`).

Semantics to reproduce:

- Authenticated → promise **resolves** with the user object (§4.1).
- Not authenticated → promise **rejects** with an error carrying
  `status` 401/403 (`AuthContext` checks `error.status === 401 ||
  error.status === 403`). A replacement client must reject with an error
  exposing `.status === 401` when `GET /api/auth/me` returns 401.

### 4.3 `base44.auth.logout(redirectUrl?)`

Call sites:

- `AuthContext.logout(shouldRedirect)`:
  `base44.auth.logout(window.location.href)` when redirecting,
  `base44.auth.logout()` when not.
- `Account.handleDeleteAccount`: `await base44.auth.logout('/')` — this
  page's "Delete Account" flow performs **no deletion API call**; it logs
  out (post-logout redirect `'/'`) and shows an "Account Deleted"
  confirmation screen. Current behavior; parity preserves it.

Semantics to reproduce: end the session server-side, clear client auth
state, and if a URL argument was passed, navigate the browser to it
afterwards. Replacement endpoint: `POST /api/auth/logout` (clears the
session cookie and deletes the session row), after which the client
performs the redirect itself.

### 4.4 `base44.auth.redirectToLogin(returnUrl)`

Single call site: `AuthContext.navigateToLogin`, invoked as
`base44.auth.redirectToLogin(window.location.href)`, triggered from
`App.jsx` when `authError.type === 'auth_required'`.

Semantics to reproduce: navigate the browser to a login screen carrying
the current URL so the user returns after signing in. There is no hosted
login page in the independent architecture; the replacement navigates to
`/Account` (the only auth-aware page) with the return URL preserved
(e.g. `/Account?returnTo=<encoded>`), or to a dedicated login view if the
frontend lane implements one. The context function name
(`navigateToLogin`) and signature must be preserved for `App.jsx`.

### 4.5 `AuthContext` state machine (frontend lane preserves the shape)

`AuthProvider` currently:

1. On mount, fetches app public settings from the Base44 platform:
   `GET /api/apps/public/prod/public-settings/by-id/{appId}` with header
   `X-App-Id` (axios client from `@base44/sdk/dist/utils/axios-client`).
   A `403` whose body carries `extra_data.reason` of `auth_required` or
   `user_not_registered` sets `authError` accordingly.
2. If an access token exists (`appParams.token` — `access_token` URL
   param or `localStorage`), calls `base44.auth.me()`.
3. Exposes via context: `user, isAuthenticated, isLoadingAuth,
   isLoadingPublicSettings, authError, appPublicSettings, logout,
   navigateToLogin, checkAppState`.

Independent-architecture equivalent: there is no public-settings document
and no bearer token. The provider settles `isLoadingPublicSettings` to
`false` with `appPublicSettings = null`, resolves auth state from
`GET /api/auth/me` (200 → authenticated; 401 → anonymous, **not** an
`authError` — this is a public site), and keeps the exposed context shape
identical so `App.jsx` needs no changes. `authError` stays `null` in
normal operation; `user_not_registered` has no trigger in the new
architecture (self-service registration, §4.7).

### 4.6 `appParams` (`src/lib/app-params.js`)

Supplies `appId`, `token` (URL `access_token` param → `localStorage`
under `base44_`-prefixed keys), `fromUrl`, `functionsVersion`,
`appBaseUrl` from `VITE_BASE44_*` env vars. Consumed by `AuthContext.jsx`,
`OAuthConsent.jsx`, and `src/api/base44Client.js` only. **No replacement
is needed** once those consumers are migrated; no page outside
auth/platform code reads it.

### 4.7 Auth endpoints (normative, Worker)

| Endpoint | Body | Success | Failure |
| -------- | ---- | ------- | ------- |
| `POST /api/auth/register` | `{ email, password, full_name }` | `201 { user }` + session cookie | `400` invalid input; `409` email already registered |
| `POST /api/auth/login` | `{ email, password }` | `200 { user }` + session cookie | `401 { "error": "invalid_credentials" }`; for migrated users who have not set a password yet: `401 { "error": "password_not_set" }` (§4.8) |
| `POST /api/auth/logout` | — | `200 { "ok": true }`, cookie cleared, session row deleted | idempotent — same response when not logged in |
| `GET /api/auth/me` | — (session cookie) | `200 { user }` | `401 { "error": "unauthenticated" }` |
| `POST /api/auth/request-password-reset` | `{ email }` | always `200 { "ok": true }` (no account enumeration) | — |
| `POST /api/auth/set-password` | `{ token, password }` | `200 { user }` + session cookie | `400` invalid/expired token or weak password |

Registration validation: `email` valid format; `password` ≥ 8 chars;
`full_name` non-empty string ≤ 200 chars.

Session: opaque random token, HMAC-signed with `SESSION_SECRET`,
delivered as an `HttpOnly; SameSite=Lax; Path=/` cookie named
`ktr_session` (`Secure` in production). Server stores sessions in D1
(`sessions` table, token stored hashed) so logout truly revokes.
Passwords: PBKDF2-SHA256 (WebCrypto), per-user random salt, never stored
or logged in plaintext.

Password reset / set tokens: random token, stored **hashed** in
`password_reset_tokens` (`user_id, token_hash, expires_at` — 1 hour),
single-use. `request-password-reset` emails a set-password link through
the Mailer when an account exists (in dev, the link is logged by the dev
mailer). `set-password` sets the PBKDF2 hash, clears `must_set_password`,
consumes the token, and revokes the user's other sessions.

Google sign-in: **not implemented.** The Base44 app had both
email/password and Google sign-in enabled platform-side (supervisor's
admin inventory). The Worker exposes a config-gated stub
(`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` env): when unset, any
`/api/auth/google*` route returns
`501 { "error": "google_auth_not_configured" }`. Credentials are
owner-gated; nothing is invented.

Welcome email: a custom "Welcome Email" template exists in the Base44
admin UI in **Draft** status (not visible to the connector lane, so its
content is unavailable). The Worker leaves a `sendWelcomeEmail(user)`
hook via the Mailer, **disabled** until the owner supplies the template
content (Question Q7 in `MIGRATION.md`). Registration must not fail if
the hook is disabled or delivery fails.

### 4.8 User migration (7 identity records)

Passwords do **not** transfer from Base44. The following users are
preserved as identity records in the `users` table with
`external_id` = their original Base44 user ID, `password_hash = NULL`,
and `must_set_password = 1`. Their first sign-in goes through the
§4.7 set-password flow.

| Display name / username | Role |
| ----------------------- | ---- |
| Bart Rowley | `admin` |
| roweysfinest90 | `user` |
| rowleysfinest90 | `user` |
| Marshall Joseph | `user` |
| Marcus L. Radford | `user` |
| Jadi Craig | `user` |
| Jonathan Rowley | `user` |

Schema support (in the initial D1 migration, so no later change is
needed): `users.external_id TEXT` (nullable, unique when present),
`users.password_hash TEXT` (nullable), `users.must_set_password INTEGER
NOT NULL DEFAULT 0`.

Blocking input: the users' **email addresses and Base44 user IDs are not
yet supplied** (names/usernames above are what the connector lane and the
admin inventory provide; note `roweysfinest90` and `rowleysfinest90` are
two distinct records — do not merge). The seed migration is generated
when the supervisor supplies the records (Question Q8 in `MIGRATION.md`).
Until then, registration/login work for new accounts and the migrated
rows are simply absent.

---

## 5. App logs — `base44.appLogs.logUserInApp`

Single call site: `src/lib/NavigationTracker.jsx` (line 35), inside a
`useEffect` on route change:

```js
if (isAuthenticated && pageName) {
  base44.appLogs.logUserInApp(pageName).catch(() => {});
}
```

`pageName` is the `pages.config` key for the current route (`Home`,
`About`, …; the main page key for `/`). Fire-and-forget: errors are
swallowed, nothing awaits it, and it fires **only for authenticated
users**.

Replacement contract: a local logger with the same fire-and-forget
signature. It may `POST /api/logs` with `{ "page": pageName }` (Worker
accepts with the session cookie, stores to the `app_logs` table,
responds `204`), or be a pure client-side no-op/console logger.
User-visible behavior is identical either way; the endpoint must never
block navigation and never surface errors.

---

## 6. OAuthConsent — platform MCP surface (no replacement)

`src/pages/OAuthConsent.jsx` is the consent screen for the Base44 app's
MCP server. It does **not** use the SDK client; it calls platform
endpoints directly with `fetch`, using `appParams.appId` and (when
present) a `Bearer` token from `appParams.token`:

- `GET /api/apps/{appId}/mcp/consent-info?handle={ctx}`
  (`credentials: "include"`) → expects `{ authenticated, login_path,
  client_name, app_name, tools: [...] }`
- `POST /api/apps/{appId}/mcp/authorize-grant` with JSON `{ ctx, action }`
  (`"approve"` / `"deny"`) → expects `{ redirect_url }`

The page's own header comment says: *"Do not change the fetch calls,
headers, or the `ctx` handle handling."* The page is not routed in
`App.jsx`.

There is **no MCP server in the independent architecture**, so these
endpoints have no replacement. Post-migration the page (if ever routed)
can only show its "invalid or expired link" state. Whether anything
still depends on this flow is Question Q5 in `MIGRATION.md` — do not
guess; the supervisor relays it to the ChatGPT/Base44-connector lane.

---

## 7. Static assets referenced from Base44 hosting

Not backend calls, but part of the interface surface:

- Logo: `src/Layout.jsx` (×2) and `src/pages/Home.jsx` (×1) hot-link
  `https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69925baf5daebb933c304d0e/80c05212b_FullLogo_NoBuffer.png`.
  The build must contain **zero** `supabase.co` references; the frontend
  lane self-hosts the recovered original (`FullLogo_NoBuffer-original.png`).
- Favicon: `index.html` links `https://base44.com/logo_v2.svg`. Replaced
  by the PWA/favicon assets (backend lane ships `public/favicon.png` +
  `public/manifest.json` icons; frontend lane points `index.html` at
  them).
- Footer credit: `src/Layout.jsx` line 307 renders *"This website was
  built with Base44"* linking to `https://base44.com`. Owner directive:
  removed by the frontend lane; nothing replaces it.

---

## 8. Summary of the normative endpoint set (Worker)

```
POST /api/apply        {to, subject, body, fields}    → 200 {ok:true}
POST /api/investors    {to, subject, body, fields}    → 200 {ok:true}
POST /api/feedback     {to, subject, body, fields}    → 200 {ok:true}
POST /api/contact      {fields}                       → 200 {ok:true}   (§2.4 fix)
POST /api/auth/register {email, password, full_name}  → 201 {user} + cookie
POST /api/auth/login    {email, password}             → 200 {user} + cookie
POST /api/auth/logout                                 → 200 {ok:true}
GET  /api/auth/me                                     → 200 {user} | 401
POST /api/auth/request-password-reset {email}         → 200 {ok:true} (always)
POST /api/auth/set-password {token, password}         → 200 {user} + cookie
POST /api/logs          {page}                        → 204
GET  /api/health                                      → 200 {ok:true}
```

No other endpoints are required for parity with the current frontend.
