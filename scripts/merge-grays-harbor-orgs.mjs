// Merge the Grays Harbor County org pilot batches into the shipped asset.
//
// Source: ~/workspace/keys-to-recovery-llc/directory-data/orgs/grays-harbor/*.json
// (IRS BMF roster + org-site enrichment + VETTING.md gate + program-level sweep).
// Only status="ready" records ship, normalized to the UI shape. Duplicate EINs
// are resolved with batch-programs.json canonical (the program-level records
// supersede roster-batch records for the same org — coordinator ruling,
// grays-harbor-summary.md). The runtime publication gate (src/data/orgs.js
// publishableOrgs) still filters on vetting.result === "CLEAR".
//
// Usage: node scripts/merge-grays-harbor-orgs.mjs
// Output: public/data/orgs-grays-harbor.json

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(
  repoRoot, '..', '..', 'directory-data', 'orgs', 'grays-harbor',
);

const TAXONOMY = new Set([
  'Treatment & Detox', 'Recovery Housing / Sober Living', 'AA Meetings',
  'NA Meetings', 'Other Recovery Meetings & Peer Support', 'Crisis & Helplines',
  'Showers & Hygiene', 'Food Banks & Meals', 'Churches & Faith-Based Support',
  'Emergency Shelter', 'Rental Assistance', 'Utility Bill Assistance',
  'Gas Vouchers', 'Bus Tickets & Transportation Help', 'Employment Help',
  'Reentry Support (post-incarceration)', 'Family Support', 'Veterans Services',
  'Benefits & ID Help', 'Clothing & Household Goods', 'Legal Aid',
]);

const files = readdirSync(srcDir).filter((f) => f.endsWith('.json')).sort();
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

// Dedupe on EIN: batch-programs.json wins; otherwise first record wins.
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
const deduped = [...byEin.values(), ...noEin];
if (dropped.length) console.log('dedupe dropped (programs canonical):', dropped);

const ready = deduped.map((r) => {
  const tags = (r.categories || []).filter((t) => {
    if (!TAXONOMY.has(t)) { nonCanonicalTags.add(t); return false; }
    return true;
  });
  return {
    name: r.name,
    ein: String(r.ein || '').replace(/\D/g, ''),
    city: r.city || null,
    zip: r.zip || null,
    county: r.county || 'Grays Harbor',
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
if (ready.length !== 36) { console.error(`EXPECTED 36 ready records, got ${ready.length} — aborting`); process.exit(1); }
if (notClear.length) { console.error('READY RECORDS FAILING THE GATE — aborting'); process.exit(1); }

const out = {
  county: 'Grays Harbor County',
  state: 'WA',
  countyFips: '53027',
  generatedFrom: 'directory-data/orgs/grays-harbor/*.json — IRS BMF roster + org-website enrichment + program-level sweep, VETTING.md gate (status=ready only)',
  orgs: ready,
};
const dest = join(repoRoot, 'public', 'data', 'orgs-grays-harbor.json');
writeFileSync(dest, JSON.stringify(out));
console.log('wrote', dest, `(${(JSON.stringify(out).length / 1024).toFixed(1)} KB)`);
