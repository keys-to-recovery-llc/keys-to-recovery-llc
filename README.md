# Keys to Recovery LLC — Website

The public website for **Keys to Recovery LLC** (recovery housing,
Tacoma / Pierce County, WA) — https://keystorecoveryllc.com

A React + Vite single-page app with a small Cloudflare Worker API
backend. Self-hosted and independent: no third-party site-builder
platform is involved in building, serving, or operating this site.

## Layout

| Path | What |
| ---- | ---- |
| `src/` | React app (pages in `src/pages/`, API client in `src/api/client.js`) |
| `public/` | PWA manifest + icons, service worker, self-hosted logo, SPA `_redirects` |
| `worker/` | Cloudflare Worker API (`/api/*`) + D1 schema migrations |
| `docs/API-CONTRACT.md` | The normative frontend↔Worker API contract |
| `MIGRATION.md` | Migration record, dependency audit, deploy instructions |

## Local development

```bash
npm install
npm run dev            # Vite dev server; /api proxies to localhost:8787

cd worker
npm install
npm run db:migrate:local
npx wrangler dev       # API on http://localhost:8787 (dev mailer logs email)
```

With no email-provider env set, the Worker logs outgoing mail to the
console and the whole site runs end-to-end with no external keys.
See `.env.example` for the full configuration list.

## Build

```bash
npm run build          # outputs dist/ (Cloudflare Pages)
```

## Deployment

Owner-gated. Nothing in this repo deploys automatically. The full
procedure (D1 creation, Worker secrets, Pages project, DNS cutover)
is in `MIGRATION.md`.
