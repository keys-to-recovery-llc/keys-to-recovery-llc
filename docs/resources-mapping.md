# Resources build-out — item mapping and verification

**Date:** 2026-10-22 · **Branch:** `feat/resources-buildout` · **Owner order:** all 15
Resources cards previously pointed at `link:"#"`. Every card now resolves to real,
viewable content. Models: **internal** = original article hosted in-app at
`/Resources/:resourceId`; **external** = authoritative destination, opened in a new
tab (`target="_blank" rel="noopener noreferrer"`, ExternalLink affordance).

## Per-item mapping

| # | Title | Model | Final URL / route | Verification (2026-10-22) |
|---|-------|-------|-------------------|---------------------------|
| 1 | What is Recovery Housing? | Internal article | `/Resources/what-is-recovery-housing` | Route serves 200 in `vite preview`; 800 words |
| 2 | The 12 Steps Explained (flagship) | Internal article | `/Resources/the-12-steps-explained` | Route 200; 2,517 words — intentionally beyond the standard band: all twelve steps in short standard wording, each with its own exposition, plus framing and closing sections |
| 3 | Finding Your Why in Recovery (Video) | External | `https://www.youtube.com/watch?v=PY9DcIMGxMs` — Johann Hari, "Everything you think you know about addiction is wrong" (TED) | Fetched HTTP 200; landing title matched exactly. A later YouTube request in the same run returned 429 (rate limit), so YouTube was not re-requested; this URL was verified before the limit hit |
| 4 | Early Recovery: What to Expect | Internal article | `/Resources/early-recovery-what-to-expect` | Route 200; 745 words |
| 5 | Breathing for Calm (Audio) | External | `https://www.uclahealth.org/uclamindful/guided-meditations` — UCLA Mindful guided meditation library; includes the 5-minute Breathing Meditation with transcript | Fetched 200, page content read in full; re-fetched 200 at end of run |
| 6 | Building a Relapse Prevention Plan (Worksheet) | External | `https://integrationacademy.ahrq.gov/resources/17186` — SAMHSA's *Matrix Intensive Outpatient Treatment: Client's Handbook* (Early Recovery Skills + Relapse Prevention handouts), hosted by AHRQ Integration Academy | Fetched 200; title/source matched (Source: SAMHSA, public domain); re-fetched 200 |
| 7 | Navigating Relationships in Recovery | Internal article | `/Resources/navigating-relationships-in-recovery` | Route 200; 819 words |
| 8 | Financial Literacy for Beginners (Worksheet) | External | `https://www.consumerfinance.gov/consumer-tools/educator-tool/your-money-your-goals/booklets-talk-about-money/` — CFPB *Your Money, Your Goals* printable booklets (bills, debt, credit, savings) | Fetched 200; page content matched; re-fetched 200 |
| 9 | Trauma & Addiction: The Connection (Video) | External | `https://ed.ted.com/on/eczPoVp6` — TED-Ed lesson built on Dr. Nadine Burke Harris, "How childhood trauma affects health across a lifetime" | Fetched 200; landing title matched. Chosen over the direct YouTube watch page because YouTube rate-limited (429) further verification; the TED-Ed page embeds the same TED talk and adds lesson structure |
| 10 | Mindfulness in Recovery (Audio) | External | `https://www.uclahealth.org/uclamindful/free-guided-meditations` — UCLA Mindful hub for its free guided meditations and the free UCLA Mindful app | Fetched 200, title "Free Guided Meditations - UCLA Mindful \| UCLA Health"; re-fetched 200 |
| 11 | Supporting a Loved One in Recovery | Internal article | `/Resources/supporting-a-loved-one-in-recovery` | Route 200; 835 words |
| 12 | Co-occurring Disorders: Dual Diagnosis | Internal article | `/Resources/co-occurring-disorders-dual-diagnosis` | Route 200; 739 words |
| 13 | SMART Recovery Workbook (Worksheet) | External | `https://smartrecovery.org/toolbox` — SMART Recovery Toolbox (Cost-Benefit Analysis, Change Plan, Urge Log, and other worksheets) | Fetched 200, title "SMART Recovery Toolbox - SMART Recovery"; re-fetched 200. Card title kept as itemized; description clarifies the Toolbox destination |
| 14 | Employment After Incarceration | External | `https://reentry.careeronestop.org/JusticeImpacted/get-started-guide.aspx` — CareerOneStop for Justice-Impacted Job Seekers, Get Started Guide (U.S. Dept. of Labor) | Fetched 200; page content matched; re-fetched 200 |
| 15 | Peer Support Specialist Certification | External | `https://hca.wa.gov/billers-providers-partners/program-information-providers/peer-counselors` — WA Health Care Authority, Peer specialists (owner-specified destination) | Fetched 200, title "Peer specialists \| Washington State Health Care Authority"; content covers the full CPSS path (prerequisite course → application → HCA-approved 80-hour training → state exams); re-fetched 200 |

No card uses `link:"#"`. No URL was invented: every external URL was returned by
search or discovered on a fetched page, then fetched and title/topic-checked.
No external item had to be converted to an internal page; all nine verified to
stable authoritative destinations.

Card description edits (accuracy only): #3, #5, #6, #8, #9, #10, #13, #14, #15
descriptions were rewritten to describe the actual linked destination (the
originals described content that did not exist, e.g. #10's "15-minute guided
mindfulness session"). External cards also show the source name (e.g. "UCLA
Mindful", "WA Health Care Authority") in place of the category label.
Search/filter UI and card grid are unchanged.

## Sources consulted for the internal articles

All facts cited in article copy come from pages opened during this build-out:

- SAMHSA, "About Recovery" — `https://www.samhsa.gov/substance-use/recovery/about`
  — the Four Major Dimensions of recovery (Health, Home, Purpose, Community) and
  the guiding principles (hope, person-driven, many pathways, holistic, peers and
  allies, setbacks are a natural part of the process). Grounds #1, #4, #11.
- SAMHSA, "Managing Life with Co-Occurring Disorders" —
  `https://www.samhsa.gov/mental-health/serious-mental-illness/co-occurring-disorders`
  — integrated treatment and its improved outcomes (reduced substance use,
  improved psychiatric symptoms and functioning, improved housing stability,
  fewer arrests, decreased hospitalization); the "no wrong door" policy;
  National Helpline 1-800-662-HELP (4357), TTY 1-800-487-4889. Grounds #12, and
  the helpline references in #4 and #11.
- National Alliance for Recovery Residences (NARR) levels of support, as
  documented in the peer-reviewed overview at PMC (PMC12075534) and NARR
  affiliate pages opened during research — Level I peer-run (democratic, no paid
  staff; Oxford House model), Level II monitored (house manager/senior resident),
  Level III supervised (trained staff, peer services + life-skills programming),
  Level IV service provider (adds on-site clinical services). Grounds #1.
- The Twelve Steps are quoted in their short standard wording only (per the
  brief). All exposition in #2 is original copy; no AA literature text beyond the
  steps themselves was used. The article carries the required closing note: Keys
  to Recovery LLC is not affiliated with Alcoholics Anonymous or any 12-step
  fellowship; meeting information is at aa.org.

## Implementation notes

- New files: `src/data/resourceArticles.js` (article content model:
  lede / sections / steps / postSections / closingNote),
  `src/pages/ResourceArticle.jsx` (article view; unknown slugs render an
  in-app "Article not found" state with a path back to the library).
- `src/App.jsx`: added `<Route path="/Resources/:resourceId">` beside the
  existing `/Resources` route, same `LayoutWrapper` (`currentPageName="Resources"`).
  `public/_redirects` already provides the SPA fallback.
- `src/pages/Resources.jsx`: data changed from `link:"#"` to `article:"<slug>"`
  (rendered as an in-app `Link` with an ArrowRight "Read" affordance) or
  `external:"<url>"` + `source:"<name>"` (rendered as a new-tab anchor with the
  ExternalLink "View" affordance and sr-only "(opens external site)" text).
- Design language matched to the existing site: black background, gold `#d4a574`
  accents, `bg-[#0d0d00]` cards with `border-[#d4a574]/20`, font-light headings,
  framer-motion entrances — mirroring `Resources.jsx` and `About.jsx`.

## Verification summary

- `npm run build` passes (chunk-size warning only, pre-existing pattern).
- `grep -ri base44 dist` = 0; `grep -ri supabase.co dist` = 0.
- Built bundle contains the article content (flagship marker strings), all six
  slugs' routes' content, and all nine external domains.
- `vite preview`: `/`, `/Resources`, and all six article routes serve 200.
- All eight non-YouTube external URLs re-fetched at the end of the run: 200.
  (#3's YouTube URL: verified 200 with exact title earlier in the run; YouTube
  subsequently rate-limited this client with 429 and was not re-requested.)
- Diff scope: `src/App.jsx`, `src/pages/Resources.jsx`, new
  `src/pages/ResourceArticle.jsx`, new `src/data/resourceArticles.js`, this doc,
  and the MIGRATION.md section. No other pages, no `worker/`, no DNS changes.
