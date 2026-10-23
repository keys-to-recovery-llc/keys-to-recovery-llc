// Generalized county org merge — same gate and normalization as the Pierce /
// Grays Harbor merges (merge-pierce-orgs.mjs, merge-grays-harbor-orgs.mjs).
//
// Usage: node scripts/merge-county-orgs.mjs <slug>
// Configs live in COUNTIES below; the expected ready count is a hard guard —
// a mismatch aborts rather than shipping a silent partial county.
// Only status="ready" records ship; batch-programs.json wins EIN dedupe;
// EIN-less program/system records are kept (dedupe on name+city); the runtime
// gate (src/data/orgs.js publishableOrgs) still filters vetting CLEAR + the
// owner EXCLUDED_EINS set.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const COUNTIES = {
  spokane: { fips: '53063', county: 'Spokane', display: 'Spokane County', state: 'WA', expected: 26 },
  thurston: { fips: '53067', county: 'Thurston', display: 'Thurston County', state: 'WA', expected: 20 },
  snohomish: { fips: '53061', county: 'Snohomish', display: 'Snohomish County', state: 'WA', expected: 24 },
  clackamas: { fips: '41005', county: 'Clackamas', display: 'Clackamas County', state: 'OR', expected: 13 },
  multnomah: { fips: '41051', county: 'Multnomah', display: 'Multnomah County', state: 'OR', expected: 26 },
  'washington-or': { fips: '41067', county: 'Washington', display: 'Washington County', state: 'OR', expected: 12 },
  maricopa: { fips: '04013', county: 'Maricopa', display: 'Maricopa County', state: 'AZ', expected: 21 },
  pima: { fips: '04019', county: 'Pima', display: 'Pima County', state: 'AZ', expected: 32 },
  'san-diego': { fips: '06073', county: 'San Diego', display: 'San Diego County', state: 'CA', expected: 23 },
  'il-cook': { fips: '17031', county: 'Cook', display: 'Cook County', state: 'IL', expected: 14 },
  'il-dupage': { fips: '17043', county: 'DuPage', display: 'DuPage County', state: 'IL', expected: 12 },
  'oh-cuyahoga': { fips: '39035', county: 'Cuyahoga', display: 'Cuyahoga County', state: 'OH', expected: 14 },
  'oh-hamilton': { fips: '39061', county: 'Hamilton', display: 'Hamilton County', state: 'OH', expected: 15 },
  'mi-oakland': { fips: '26125', county: 'Oakland', display: 'Oakland County', state: 'MI', expected: 25 },
  'mi-macomb': { fips: '26099', county: 'Macomb', display: 'Macomb County', state: 'MI', expected: 11 },
  'tn-shelby': { fips: '47157', county: 'Shelby', display: 'Shelby County', state: 'TN', expected: 17 },
  'tn-knox': { fips: '47093', county: 'Knox', display: 'Knox County', state: 'TN', expected: 17 },
  cobb: { fips: '13067', county: 'Cobb', display: 'Cobb County', state: 'GA', expected: 9 },
  fulton: { fips: '13121', county: 'Fulton', display: 'Fulton County', state: 'GA', expected: 11 },
  gwinnett: { fips: '13135', county: 'Gwinnett', display: 'Gwinnett County', state: 'GA', expected: 14 },

  'mi-wayne': { fips: '26163', county: 'Wayne', display: 'Wayne County', state: 'MI', expected: 14 },
  'oh-franklin': { fips: '39049', county: 'Franklin', display: 'Franklin County', state: 'OH', expected: 12 },
  'tn-davidson': { fips: '47037', county: 'Davidson', display: 'Davidson County', state: 'TN', expected: 42 },
  'tx-dallas': { fips: '48113', county: 'Dallas', display: 'Dallas County', state: 'TX', expected: 10 },
  'tx-harris': { fips: '48201', county: 'Harris', display: 'Harris County', state: 'TX', expected: 19 },
  'tx-tarrant': { fips: '48439', county: 'Tarrant', display: 'Tarrant County', state: 'TX', expected: 14 },
};

// Known near-miss tag spellings normalized to the canonical taxonomy.
const TAG_ALIASES = { 'Reentry Support': 'Reentry Support (post-incarceration)' };

const slug = process.argv[2];
const cfg = COUNTIES[slug];
if (!cfg) { console.error(`unknown county slug: ${slug} (known: ${Object.keys(COUNTIES).join(', ')})`); process.exit(1); }

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(repoRoot, '..', '..', 'directory-data', 'orgs', slug);

const TAXONOMY = new Set([
  'Treatment & Detox', 'Recovery Housing / Sober Living', 'AA Meetings',
  'NA Meetings', 'Other Recovery Meetings & Peer Support', 'Crisis & Helplines',
  'Showers & Hygiene', 'Food Banks & Meals', 'Churches & Faith-Based Support',
  'Emergency Shelter', 'Rental Assistance', 'Utility Bill Assistance',
  'Gas Vouchers', 'Bus Tickets & Transportation Help', 'Employment Help',
  'Reentry Support (post-incarceration)', 'Family Support', 'Veterans Services',
  'Benefits & ID Help', 'Clothing & Household Goods', 'Legal Aid',
]);

const files = readdirSync(srcDir).filter((f) => f.startsWith('batch-') && f.endsWith('.json')).sort();
let total = 0;
const readyRaw = [];
const nonCanonicalTags = new Set();

for (const f of files) {
  const data = JSON.parse(readFileSync(join(srcDir, f), 'utf8'));
  const records = Array.isArray(data) ? data : data.orgs || data.records || [];
  total += records.length;
  for (const r of records) {
    if (r.status !== 'ready') continue;
    readyRaw.push({ ...r, _file: f });
  }
}

const byEin = new Map();
const noEin = [];
const dropped = [];
for (const r of readyRaw) {
  const ein = String(r.ein || '').replace(/\D/g, '');
  if (!ein) { noEin.push(r); continue; }
  if (!byEin.has(ein)) { byEin.set(ein, r); continue; }
  const kept = byEin.get(ein);
  if (r._file === 'batch-programs.json' && kept._file !== 'batch-programs.json') {
    dropped.push(kept.name); byEin.set(ein, r);
  } else {
    dropped.push(r.name);
  }
}
// EIN-less dedupe on normalized name + city
const seenNoEin = new Set();
const noEinKept = [];
for (const r of noEin) {
  const k = `${String(r.name || '').toUpperCase().replace(/\s+/g, ' ').trim()}|${String(r.city || '').toUpperCase().trim()}`;
  if (seenNoEin.has(k)) { dropped.push(`${r.name} (no-EIN dupe)`); continue; }
  seenNoEin.add(k); noEinKept.push(r);
}
const deduped = [...byEin.values(), ...noEinKept];
if (dropped.length) console.log('dedupe dropped:', dropped);

const cleanName = (n) => String(n || '').replace(/\s*\|\s*/g, ' — ').replace(/\s+/g, ' ').trim();

const ready = deduped.map((r) => {
  const rawCats = Array.isArray(r.categories) ? r.categories : r.categories ? [r.categories] : [];
  const tags = rawCats.map((t) => TAG_ALIASES[t] || t).filter((t) => {
    if (!TAXONOMY.has(t)) { nonCanonicalTags.add(t); return false; }
    return true;
  });
  return {
    name: cleanName(r.name),
    ein: String(r.ein || '').replace(/\D/g, ''),
    city: r.city || null,
    zip: r.zip || null,
    county: r.county || cfg.county,
    phone: r.phone || null,
    url: r.website || null,
    ...(r.meetingListUrl ? { meetingListUrl: r.meetingListUrl } : {}),
    services: Array.isArray(r.services) ? r.services : r.services ? [r.services] : [],
    serves: r.serves || null,
    tags,
    vetting: { result: r.vetting?.result || null, checkedAt: r.vetting?.checkedAt || null },
  };
});

ready.sort((a, b) => a.name.localeCompare(b.name));

const notClear = ready.filter((o) => o.vetting.result !== 'CLEAR');
console.log(`batch files: ${files.length} | total records: ${total} | ready gross: ${readyRaw.length} | ready unique: ${ready.length}`);
console.log(`ready without vetting CLEAR: ${notClear.length}`);
if (nonCanonicalTags.size) console.log('non-canonical tags dropped:', [...nonCanonicalTags]);
if (ready.length !== cfg.expected) { console.error(`EXPECTED ${cfg.expected} ready records, got ${ready.length} — aborting`); process.exit(1); }
if (notClear.length) { console.error('READY RECORDS FAILING THE GATE — aborting'); process.exit(1); }

const out = {
  county: cfg.display,
  state: cfg.state,
  countyFips: cfg.fips,
  generatedFrom: `directory-data/orgs/${slug}/*.json — IRS BMF roster + org-website enrichment + program-level sweep, VETTING.md gate (status=ready only)`,
  orgs: ready,
};
const dest = join(repoRoot, 'public', 'data', `orgs-${slug}.json`);
writeFileSync(dest, JSON.stringify(out));
console.log('wrote', dest, `(${(JSON.stringify(out).length / 1024).toFixed(1)} KB)`);
