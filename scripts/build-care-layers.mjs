// Build the meetings + health-center lazy assets from directory-data.
//
// Sources (all public, no credentials — see PROVENANCE.md beside each):
//  - NA meetings: directory-data/meetings/na/<ST>.json (BMLT aggregator pull)
//  - AA meetings: directory-data/meetings/aa-sample-*.json (TSML feeds from
//    local AA service entities; WA launch scope). Field whitelist strips
//    admin/internal fields (edit_url, import hashes) — never published.
//  - HRSA health centers: directory-data/health-centers/hrsa-sites-national.json
//
// Usage: node scripts/build-care-layers.mjs

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const dd = join(repoRoot, '..', '..', 'directory-data');
const pub = join(repoRoot, 'public', 'data');
for (const d of ['meetings-na', 'meetings-aa', 'health-centers']) mkdirSync(join(pub, d), { recursive: true });

// ---- NA meetings (per state, whitelisted) ----
const naDir = join(dd, 'meetings', 'na');
let naTotal = 0;
for (const f of readdirSync(naDir).filter((x) => /^[A-Z]{2}\.json$/.test(x))) {
  const st = f.replace('.json', '');
  const data = JSON.parse(readFileSync(join(naDir, f), 'utf8'));
  const meetings = (data.meetings || []).map((m) => ({
    name: m.name, weekday: m.weekday, start_time: m.start_time, duration: m.duration,
    formats: m.formats || [], location_name: m.location_name || null,
    street: m.street || null, city: m.city || null, zip: m.zip || null,
    county: m.county || null, attendance: m.attendance || null,
    virtual_meeting_link: m.virtual_meeting_link || null,
    temporarily_closed: Boolean(m.temporarily_closed),
    service_body: m.service_body || null,
  }));
  naTotal += meetings.length;
  writeFileSync(join(pub, 'meetings-na', f), JSON.stringify({
    state: st, source: 'Narcotics Anonymous service bodies via the BMLT open meeting network (tomato.bmltenabled.org), retrieved 2026-10-22',
    meetings,
  }));
}
console.log('NA meetings shipped:', naTotal);

// ---- HRSA health centers (split national file by state, whitelisted) ----
const hrsa = JSON.parse(readFileSync(join(dd, 'health-centers', 'hrsa-sites-national.json'), 'utf8'));
const sites = hrsa.sites || hrsa;
const byState = new Map();
for (const s of sites) {
  if (!s.state) continue;
  if (!byState.has(s.state)) byState.set(s.state, []);
  byState.get(s.state).push({
    name: s.name, address: s.address || null, city: s.city || null, zip: s.zip || null,
    county: s.county || null, countyFips: s.countyFips || null, phone: s.phone || null,
    type: s.healthCenterType || null, siteType: s.siteType || null,
    locationType: s.locationType || null,
  });
}
let hrsaTotal = 0;
for (const [st, arr] of byState) {
  hrsaTotal += arr.length;
  writeFileSync(join(pub, 'health-centers', `${st}.json`), JSON.stringify({
    state: st, source: 'HRSA Health Center Program service delivery sites (data.hrsa.gov), retrieved 2026-10-22',
    sites: arr,
  }));
}
console.log('HRSA sites shipped:', hrsaTotal, 'across', byState.size, 'states/territories');

// ---- AA meetings (TSML samples -> per-county assets via ZIP->countyFIPS) ----
const gaz = JSON.parse(readFileSync(join(dd, 'gazetteer', 'localities.json'), 'utf8'));
const locArr = gaz.localities || gaz.zips || Object.values(gaz);
const zipToFips = new Map();
for (const l of locArr) {
  const zip = l.zip || l.ZIP || l.zipcode;
  const fips = l.countyFips || l.county_fips || l.fips;
  if (zip && fips) zipToFips.set(String(zip).padStart(5, '0'), String(fips));
}
// Clean prior AA assets (county assignment method changed; stale files must not linger).
for (const f of readdirSync(join(pub, 'meetings-aa'))) { try { writeFileSync(join(pub, 'meetings-aa', f), ''); } catch {} }
import { unlinkSync } from 'node:fs';
for (const f of readdirSync(join(pub, 'meetings-aa'))) unlinkSync(join(pub, 'meetings-aa', f));
const aaFiles = readdirSync(join(dd, 'meetings')).filter((x) => x.startsWith('aa-sample-'));
const aaByCounty = new Map();
for (const f of aaFiles) {
  const data = JSON.parse(readFileSync(join(dd, 'meetings', f), 'utf8'));
  const arr = Array.isArray(data) ? data : data.meetings || [];
  for (const m of arr) {
    // ZIP = the 5 digits after the state code in ", WA 98444" — NEVER the
    // first 5-digit run (street numbers like "12345 Main St" poisoned the
    // first pass, scattering meetings into same-numbered out-of-state ZIPs).
    const zipMatch = /,\s*[A-Z]{2}\s+(\d{5})/.exec(m.formatted_address || '');
    const fips = zipMatch ? zipToFips.get(zipMatch[1]) : null;
    if (!fips) continue;
    if (!aaByCounty.has(fips)) aaByCounty.set(fips, []);
    aaByCounty.get(fips).push({
      name: m.name, day: m.day, time: m.time || null, time_formatted: m.time_formatted || null,
      location: m.location || null, formatted_address: m.formatted_address || null,
      conference_url: m.conference_url || null, types: m.types || [], updated: m.updated || null,
    });
  }
}
for (const [fips, arr] of aaByCounty) {
  writeFileSync(join(pub, 'meetings-aa', `${fips}.json`), JSON.stringify({
    countyFips: fips, source: 'Local A.A. service entity public Meeting Guide (TSML) feed, retrieved 2026-10-22',
    meetings: arr,
  }));
  console.log('AA meetings shipped: county', fips, arr.length);
}
if (!existsSync(join(pub, 'meetings-na', 'WA.json'))) { console.error('WA NA asset missing — aborting'); process.exit(1); }
console.log('care layers built.');
