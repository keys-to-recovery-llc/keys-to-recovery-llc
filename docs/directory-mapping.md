# Recovery Directory — mapping & verification record

**Built:** 2026-10-22 · **Branch:** `feat/recovery-directory` · **Page:** `/Directory`
**Safety posture (owner addendum):** read-only public research only — no logins,
no credentials or saved sessions, no form submissions, no downloads of anything
executable, nothing deployed or merged by the build agent; the supervisor
merges and deploys after QC.

## Architecture

| Layer | Where | Notes |
| --- | --- | --- |
| Crisis + national data | `src/data/directory.js` | crisis (4) + national entries grouped by category, each tagged with canonical taxonomy labels (`TAXONOMY`, from `directory-data/TAXONOMY.md`) |
| State gateways | `src/data/states/*.json` via glob import in `src/data/states.js` | one verified JSON per state/territory from the regional research agents; new files are picked up automatically on rebuild |
| Gazetteer | `public/data/localities.json`, loaded lazily by `src/data/gazetteer.js` | Census-built dataset (56 states/territories, 3,235 counties, 33,791 ZIPs); ~4.5 MB, fetched on first locality search, never bundled |
| Deep links | `src/data/locators.js` | prefilled URLs ONLY where a pattern was verified by fetching a live example (below) |
| County orgs (future) | slot in `src/data/gazetteer.js` + `CountyOrgsSection` in the page | org-level listings land later (Pierce County pilot first); renders only `vetting.result === "CLEAR"` records (VETTING.md gate), grouped by taxonomy category |

## Crisis entries (all fetched in-run, HTTP 200, content matched)

| Entry | URL | Contact |
| --- | --- | --- |
| 988 Suicide & Crisis Lifeline | https://988lifeline.org/ | Call or text 988 |
| SAMHSA National Helpline | https://www.samhsa.gov/find-help/helplines/national-helpline | 1-800-662-4357 |
| Crisis Text Line | https://www.crisistextline.org/ | Text HOME to 741741 |
| Never Use Alone | https://neverusealone.com/ | via site |
| Emergency note | — | Emergencies = 911 (plain text in the crisis block) |

## National entries (all fetched in-run, HTTP 200 / clean redirect, content matched)

Find Treatment: FindTreatment.gov (https://findtreatment.gov/) · Treatment ATLAS
(https://treatmentatlas.org/) · SAMHSA SSA directory
(https://www.samhsa.gov/grants/block-grants/subg/ssa-directory).
Recovery Housing: NARR affiliates (https://narronline.org/affiliates/) · Oxford
House Vacancy Finder (https://oxfordvacancies.com/) · Oxford House
(https://www.oxfordhouse.org/).
Meetings (taxonomy-labeled): AA — AA Meetings (https://www.aa.org/find-aa) ·
NA — NA Meetings (https://www.na.org/meetingsearch/) · SMART — Other Recovery
Meetings & Peer Support (https://meetings.smartrecovery.org/meetings/) ·
Celebrate Recovery — Other Recovery Meetings & Peer Support + Churches &
Faith-Based Support (https://www.celebraterecovery.com/) · Al-Anon — Family
Support (https://meetings.al-anon.org/ — note: al-anon.org/meetings/ returns a 404 page; the meeting search lives on the meetings subdomain, fetched 200) · Nar-Anon — Family Support
(https://www.nar-anon.org/find-a-meeting/).
Peer & Community: Faces & Voices of Recovery (https://facesandvoicesofrecovery.org/).
Family: Partnership to End Addiction (https://drugfree.org/).
Reentry: National Reentry Resource Center (https://nationalreentryresourcecenter.org/ —
verified via rendered page fetch; plain curl receives a 404 from its WAF) ·
CareerOneStop justice-impacted guide
(https://reentry.careeronestop.org/JusticeImpacted/get-started-guide.aspx).
Benefits & Local Help: 211 (https://www.211.org/) · findhelp (https://www.findhelp.org/).
Veterans: VA substance-use treatment
(https://www.va.gov/health-care/health-needs-conditions/substance-use-problems/) ·
Veterans Crisis Line (https://www.veteranscrisisline.net/).
Harm Reduction: NEXT Distro (https://nextdistro.org/) · National Harm Reduction
Coalition (https://harmreduction.org/). Harm-reduction entries carry no taxonomy
tag because the canonical taxonomy has no harm-reduction category; they appear
under "All" and their group heading.

Notes on named sources: no briefed national source was omitted. Faces & Voices
publishes no separate RCO-locator URL that could be verified, so the entry
points to its verified homepage, which routes to local recovery community
organizations. The National Harm Reduction Coalition entry uses its homepage
because its /resources/ path returns 404.

## Deep-link verification (fetched examples, 2026-10-22)

| Locator | Pattern | Verdict |
| --- | --- | --- |
| Oxford House Vacancy Finder | `https://oxfordvacancies.com/?q=<city>` (e.g. ?q=Tacoma) | **VERIFIED** — ?q=Tacoma returned Tacoma×15, Miami×0; ?q=Miami returned the inverse (Miami×16, Tacoma×0). ?state=<ST> also changed results by state. Builder uses ?q=<city>. |
| VA SUD Program Locator | `https://www.va.gov/directory/GUIDE/state_SUD.cfm?STATE=<ST>` | **VERIFIED** — STATE=WA returned the Washington locations page (title matched); STATE=WY example re-fetched 200 at end of run. Builder uses the locality's state. |
| FindTreatment.gov | — | NOT verified. The site is a JS app: fetched HTML shell is identical with and without parameters. Its documented JSON API (sAddr lat,lng) is a data API, not a user-facing link. Plain locator link used. |
| AA — Find A.A. | `?dist_center[geocoder][geolocation_geocoder_address]=<city>` | NOT verified — Tacoma, Miami, and a nonsense-city (Zxqville, ZZ) example each returned a ~66.6 KB page in which the submitted term appears 13 times as a form/config echo with no location-specific meeting results in the fetched content (results load client-side). Plain link used. Correction 2026-10-22: an earlier draft of this row cited a 4,979-byte shell — that figure belonged to FindTreatment.gov, not AA; the verdict is unchanged. |
| NA Meeting Search | — | NOT verified — form/session-based search; no GET pattern could be confirmed. Plain link used. |
| SMART Recovery Meetings | `?location=` / `?search=` | NOT verified — both returned the generic meeting list with no location content. Plain link used. |
| 211.org | `?query=` on /search | NOT valid — https://www.211.org/search?query=98402 returns 404; homepage search is JS-driven. Plain link used; the practical local route is each state's own 211 (in the state gateways). |
| findhelp.org | — | No pattern fetched/verified. Plain link used. |

## State gateways — coverage: 56 of 56 files

All 50 states + DC + 5 territories (AS, GU, MP, PR, VI) have a verified gateway
file (regional agents, verifiedAt 2026-10-22). 23 carry `narrAffiliate: null`
and render "No NARR affiliate listed" — never a substitute. Full per-state
agency/NARR/211 detail lives in the JSON files themselves; summary:

| ST | State | Agency (name — URL) | NARR affiliate | 211 | Verified |
| --- | --- | --- | --- | --- | --- |
| AK | Alaska | Alaska Division of Behavioral Health (Department of Health) — https://health.alaska.gov/dbh/Pages/default.aspx | — (none listed) | Alaska 211 | 2026-10-22 |
| AL | Alabama | Division of Mental Health and Substance Abuse Services, Alabama Department of Mental Health — https://mh.alabama.gov/division-of-mental-health-substance-abuse-services/ | Alabama Alliance for Recovery Residences (AARR) | 211 Connects Alabama | 2026-10-22 |
| AR | Arkansas | Office of Substance Abuse and Mental Health (OSAMH), Arkansas Department of Human Services — https://humanservices.arkansas.gov/divisions-shared-services/shared-services/office-of-substance-abuse-and-mental-health/ | — (none listed) | Arkansas 211 | 2026-10-22 |
| AS | American Samoa | American Samoa Department of Health — Behavioral Health Services Division — https://doh.as/ | — (none listed) | dial 2-1-1 | 2026-10-22 |
| AZ | Arizona | Arizona Health Care Cost Containment System (AHCCCS) - Behavioral Health Services — https://www.azahcccs.gov/Members/BehavioralHealthServices/ | Arizona Recovery Housing Association (AzRHA) | 2-1-1 Arizona | 2026-10-22 |
| CA | California | Dept. of Health Care Services (DHCS) — Substance Use Disorder Services — https://www.dhcs.ca.gov/services/Pages/BHS.aspx | California Consortium of Addiction Programs and Professionals (CCAPP) | 211 LA / California 211 | 2026-10-22 |
| CO | Colorado | Behavioral Health Administration (BHA), Colorado Department of Human Services — https://bha.colorado.gov/ | Ohio Recovery Housing – Colorado (ORH-C) | 211 Colorado | 2026-10-22 |
| CT | Connecticut | Department of Mental Health and Addiction Services (DMHAS) — https://www.ct.gov/dmhas | Connecticut Alliance of Recovery Residences (CTARR) | 211 Connecticut (United Way of Connecticut) | 2026-10-22 |
| DC | District of Columbia | Department of Behavioral Health (DBH) — https://dbh.dc.gov | — (none listed) | DC 211 Warmline | 2026-10-22 |
| DE | Delaware | Division of Substance Abuse and Mental Health (DSAMH), Delaware Department of Health and Social Services — https://dhss.delaware.gov/dsamh/ | First State Alliance of Recovery Residences (FSARR) | Delaware 211 (United Way of Delaware) | 2026-10-22 |
| FL | Florida | Florida Department of Children and Families — Substance Abuse and Mental Health (SAMH) Program — https://www.myflfamilies.com/services/samh/treatment | Florida Association of Recovery Residences (FARR) | Florida 211 | 2026-10-22 |
| GA | Georgia | Georgia Department of Behavioral Health and Developmental Disabilities (DBHDD) — https://dbhdd.georgia.gov/ | Georgia Association of Recovery Residences (GARR) — The GARR Network | Georgia 211 (United Ways of Georgia) | 2026-10-22 |
| GU | Guam | Guam Behavioral Health and Wellness Center (GBHWC) — https://gbhwc.guam.gov/ | — (none listed) | dial 2-1-1 | 2026-10-22 |
| HI | Hawaii | Hawai'i Department of Health — Alcohol and Drug Abuse Division (ADAD) — http://health.hawaii.gov/substance-abuse | — (none listed) | Aloha United Way 211 | 2026-10-22 |
| IA | Iowa | Iowa Department of Health and Human Services — Division of Behavioral Health (Behavioral Health Service System) — https://hhs.iowa.gov/health-prevention/behavioral-health-service-system | — (none listed) | 211 Iowa | 2026-10-22 |
| ID | Idaho | Division of Behavioral Health — Substance Use Disorder Services Program, Idaho Department of Health and Welfare — https://healthandwelfare.idaho.gov/services-programs/behavioral-health/about-substance-use-disorder | — (none listed) | Idaho CareLine 2-1-1 | 2026-10-22 |
| IL | Illinois | Division of Behavioral Health and Recovery (DBHR), Illinois Department of Human Services — https://www.dhs.state.il.us | Illinois Association of Extended Care (IAEC) | 211 Illinois | 2026-10-22 |
| IN | Indiana | Division of Mental Health and Addiction (DMHA), Indiana Family and Social Services Administration — https://www.in.gov/fssa/dmha/ | Indiana Affiliation of Recovery Residences (INARR) | Indiana 211 | 2026-10-22 |
| KS | Kansas | Kansas Department for Aging and Disability Services (KDADS), Behavioral Health Services — https://www.kdads.ks.gov/ | — (none listed) | 211 Kansas | 2026-10-22 |
| KY | Kentucky | Kentucky Department for Behavioral Health, Developmental and Intellectual Disabilities (DBHDID), Cabinet for Health and Family Services — https://www.chfs.ky.gov/agencies/dbhdid/Pages/default.aspx | Kentucky Alliance of Recovery Residences (KYARR) | Kentucky 211 (United Way of Kentucky) | 2026-10-22 |
| LA | Louisiana | Office of Behavioral Health, Louisiana Department of Health — https://ldh.la.gov/AddictiveDisorders | — (none listed) | Louisiana 211 Statewide Network | 2026-10-22 |
| MA | Massachusetts | Bureau of Substance Addiction Services (BSAS), Massachusetts Department of Public Health — https://www.mass.gov/orgs/bureau-of-substance-addiction-services | Massachusetts Alliance for Sober Housing (MASH) | Mass 211 | 2026-10-22 |
| MD | Maryland | Behavioral Health Administration (BHA), Maryland Department of Health — https://health.maryland.gov/bha/Pages/Home.aspx | — (none listed) | 211 Maryland (Maryland Information Network) | 2026-10-22 |
| ME | Maine | Office of Behavioral Health, Maine Department of Health and Human Services — https://www.maine.gov/dhhs/obh | Maine Association of Recovery Residences (MARR) | 211 Maine | 2026-10-22 |
| MI | Michigan | Michigan Department of Health and Human Services (MDHHS) — https://www.michigan.gov/mdhhs | Michigan Association of Recovery Resources (MARR) | Michigan 2-1-1 | 2026-10-22 |
| MN | Minnesota | Minnesota Department of Human Services — Behavioral Health Administration — https://mn.gov/dhs/partners-and-providers/program-overviews/alcohol-drug-other-addictions/ | Minnesota Association of Sober Homes (MASH) | United Way 211 (Greater Twin Cities United Way) | 2026-10-22 |
| MO | Missouri | Missouri Department of Mental Health, Division of Behavioral Health — https://dmh.mo.gov/behavioral-health | Missouri Coalition of Recovery Support Providers (MCRSP) | United Way 211 — Missouri (211helps.org) | 2026-10-22 |
| MP | Northern Mariana Islands | Commonwealth Healthcare Corporation — Community Guidance Center — https://chcc.gov.mp/ | — (none listed) | dial 2-1-1 | 2026-10-22 |
| MS | Mississippi | Mississippi Department of Mental Health (Bureau of Alcohol and Drug Services) — https://www.dmh.ms.gov/service-options/alcohol-and-drug-services/ | — (none listed) | 211 Mississippi Helpline (United Way of the Capital Area) | 2026-10-22 |
| MT | Montana | Behavioral Health and Developmental Disabilities Division (BHDD), Montana Department of Public Health and Human Services — https://dphhs.mt.gov/bhdd/ | Recovery Access Montana (RAM) | Montana 211 | 2026-10-22 |
| NC | North Carolina | North Carolina Department of Health and Human Services — Division of Mental Health, Developmental Disabilities and Substance Use Services (DMH/DD/SUS) — https://www.ncdhhs.gov/divisions/mental-health-developmental-disabilities-and-substance-use-services | North Carolina Association of Recovery Residences (NCARR) | NC 211 (United Way of North Carolina) | 2026-10-22 |
| ND | North Dakota | North Dakota Department of Health and Human Services — Behavioral Health Division — https://www.hhs.nd.gov/behavioral-health | — (none listed) | FirstLink 2-1-1 | 2026-10-22 |
| NE | Nebraska | Nebraska Department of Health and Human Services — Division of Behavioral Health — https://dhhs.ne.gov/Pages/behavioral-health.aspx | — (none listed) | Nebraska 211 (United Way of the Midlands) | 2026-10-22 |
| NH | New Hampshire | Bureau of Drug and Alcohol Services, New Hampshire Department of Health and Human Services — https://www.dhhs.nh.gov/programs-services/alcohol-tobacco-other-substance-misuse | New Hampshire Coalition of Recovery Residences (NHCORR) | 211 NH (Granite United Way) | 2026-10-22 |
| NJ | New Jersey | Division of Mental Health and Addiction Services (DMHAS), New Jersey Department of Human Services — https://nj.gov/humanservices/dmhas/help/substance/ | — (none listed) | NJ 211 | 2026-10-22 |
| NM | New Mexico | Behavioral Health Services Division (BHSD), New Mexico Health Care Authority — https://www.hsd.state.nm.us/about_the_department/behavioral_health_services_division/ | — (none listed) | New Mexico 211 - United Way of North Central New Mexico | 2026-10-22 |
| NV | Nevada | Nevada Division of Public and Behavioral Health (DPBH), Department of Health and Human Services — https://dpbh.nv.gov/ | — (none listed) | Nevada 211 | 2026-10-22 |
| NY | New York | Office of Addiction Services and Supports (OASAS) — https://oasas.ny.gov/ | New York State Alliance of Recovery Residences (NYSARR) | 211 New York (211 New York, Inc.) | 2026-10-22 |
| OH | Ohio | Ohio Department of Behavioral Health (DBH) — formerly Ohio Department of Mental Health and Addiction Services (OhioMHAS) — https://mha.ohio.gov/ | Ohio Recovery Housing (ORH) | Ohio 211 | 2026-10-22 |
| OK | Oklahoma | Oklahoma Department of Mental Health and Substance Abuse Services (ODMHSAS) — https://oklahoma.gov/odmhsas.html | Oklahoma Alliance for Recovery Resources (OKARR) | 211 Oklahoma | 2026-10-22 |
| OR | Oregon | Oregon Health Authority (OHA) — Behavioral Health Division — https://www.oregon.gov/oha/BH/Pages/About-Us.aspx | Mental Health and Addiction Certification Board of Oregon (MHACBO) | 211info | 2026-10-22 |
| PA | Pennsylvania | Department of Drug and Alcohol Programs (DDAP) — https://www.pa.gov/agencies/ddap | Pennsylvania Alliance of Recovery Residences (PARR) | PA 211 | 2026-10-22 |
| PR | Puerto Rico | Administración de Servicios de Salud Mental y Contra la Adicción (ASSMCA) — https://assmca.pr.gov/ | — (none listed) | 2-1-1 de Puerto Rico (United Way de Puerto Rico) | 2026-10-22 |
| RI | Rhode Island | Department of Behavioral Healthcare, Developmental Disabilities and Hospitals (BHDDH) — https://bhddh.ri.gov/ | Rhode Island Communities for Addiction Recovery Efforts (RICARES) | United Way of Rhode Island 211 | 2026-10-22 |
| SC | South Carolina | South Carolina Department of Behavioral Health and Developmental Disabilities (BHDD) — Office of Substance Use Services (OSUS) — https://www.daodas.sc.gov/ | South Carolina Alliance for Recovery Residences (SCARR) | South Carolina 211 (SC 211) | 2026-10-22 |
| SD | South Dakota | South Dakota Department of Social Services — Division of Behavioral Health — https://dss.sd.gov/behavioralhealth/default.aspx | — (none listed) | Helpline Center — South Dakota 211 | 2026-10-22 |
| TN | Tennessee | Tennessee Department of Mental Health and Substance Abuse Services (TDMHSAS) — https://www.tn.gov/behavioral-health.html | Tennessee Alliance of Recovery Residences (TN-ARR) | Tennessee 211 (United Way of Greater Nashville — Middle Tennessee hub) | 2026-10-22 |
| TX | Texas | Texas Health and Human Services Commission (HHSC) — https://www.hhs.texas.gov/services/mental-health-substance-use | Texas Recovery Oriented Housing Network (TROHN) | 2-1-1 Texas | 2026-10-22 |
| UT | Utah | Office of Substance Use and Mental Health (SUMH), Utah Department of Health and Human Services — https://sumh.utah.gov/ | — (none listed) | Utah 211 | 2026-10-22 |
| VA | Virginia | Virginia Department of Behavioral Health and Developmental Services (DBHDS) — https://dbhds.virginia.gov | Virginia Association of Recovery Residences (VARR) | 211 Virginia | 2026-10-22 |
| VI | U.S. Virgin Islands | Virgin Islands Department of Health — Division of Behavioral Health, Alcoholism and Drug Dependency Services (BHADDS) — https://doh.vi.gov/programs/behavioral-health-alcoholism-and-drug-dependency | — (none listed) | dial 2-1-1 | 2026-10-22 |
| VT | Vermont | Division of Substance Use Programs (DSU), Vermont Department of Health — https://www.healthvermont.gov/alcohol-drugs/system-care-enhancement | Vermont Alliance for Recovery Residences (VTARR) | Vermont 211 (United Ways of Vermont) | 2026-10-22 |
| WA | Washington | Washington State Health Care Authority (HCA) — Division of Behavioral Health and Recovery (DBHR) — https://www.hca.wa.gov/ | Washington Alliance for Quality Recovery Residences (WAQRR) | Washington 211 | 2026-10-22 |
| WI | Wisconsin | Wisconsin Department of Health Services (DHS) — https://www.dhs.wisconsin.gov | Wisconsin Association of Sober Housing (WASH) | 211 Wisconsin | 2026-10-22 |
| WV | West Virginia | Bureau for Behavioral Health (BBH), West Virginia Department of Human Services — https://bbh.wv.gov | West Virginia Alliance of Recovery Residences (WVARR) | West Virginia 211 | 2026-10-22 |
| WY | Wyoming | Behavioral Health Division, Wyoming Department of Health — https://health.wyo.gov/behavioralhealth/ | — (none listed) | Wyoming 211 | 2026-10-22 |
## Gazetteer

Source: `directory-data/gazetteer/localities.json` (Census 2024 Gazetteer +
2020 ZCTA relationship files; ZIP→primary county by largest land share;
ZIP→city = Census place with largest land share — a Census place name, not
necessarily the USPS preferred city name). The build copies
{ meta, states, counties (trimmed), zips } to `public/data/localities.json`.
Spot checks against the served dataset: ZIP 98402 → Tacoma, Pierce County, WA;
ZIP 82801 → Sheridan, Sheridan County, WY (rural); ZIP 33101 → Miami,
Miami-Dade County, FL; city search "Tacoma" → 13 ZIPs; county search
"Pierce County" → 57 ZIPs; "Miami-Dade County" → 80 ZIPs.

## Verification performed at build

- `npm run build` passes. dist greps: `base44` = 0, `supabase.co` = 0.
- `vite preview`: `/` 200, `/Directory` 200, `/data/localities.json` 200.
- End-of-run re-fetch sample (≥15 URLs across crisis/national/state): see the
  build report; all 200 at time of check except any noted in the report.
