// Merge the Pierce County org pilot batches into the shipped lazy-loaded asset.
//
// Source: ~/workspace/keys-to-recovery-llc/directory-data/orgs/pierce/*.json
// (20 batch files; IRS BMF roster + org-site enrichment + VETTING.md gate).
// Only status="ready" records ship, normalized to the UI shape. The runtime
// publication gate (src/data/orgs.js publishableOrgs) still filters on
// vetting.result === "CLEAR" — the merge-time filter is the first of two.
//
// Usage: node scripts/merge-pierce-orgs.mjs
// Output: public/data/orgs-pierce.json

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(
  repoRoot, '..', '..', 'directory-data', 'orgs', 'pierce',
);

// Canonical taxonomy (src/data/directory.js TAXONOMY / directory-data/TAXONOMY.md)
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
const ready = [];
const nonCanonicalTags = new Set();

for (const f of files) {
  const data = JSON.parse(readFileSync(join(srcDir, f), 'utf8'));
  const records = Array.isArray(data) ? data : data.orgs || data.records || [];
  total += records.length;
  for (const r of records) {
    if (r.status !== 'ready') continue;
    const tags = (r.categories || []).filter((t) => {
      if (!TAXONOMY.has(t)) { nonCanonicalTags.add(t); return false; }
      return true;
    });
    ready.push({
      name: r.name,
      ein: String(r.ein || '').replace(/\D/g, ''),
      city: r.city || null,
      zip: r.zip || null,
      county: r.county || 'Pierce',
      phone: r.phone || null,
      url: r.website || null,
      ...(r.meetingListUrl ? { meetingListUrl: r.meetingListUrl } : {}),
      services: Array.isArray(r.services) ? r.services : r.services ? [r.services] : [],
      serves: r.serves || null,
      tags,
      // Ship only the gate fields; the full vetting source trail stays in
      // directory-data (audit copy), it is never rendered.
      vetting: { result: r.vetting?.result || null, checkedAt: r.vetting?.checkedAt || null },
    });
  }
}

ready.sort((a, b) => a.name.localeCompare(b.name));

const notClear = ready.filter((o) => o.vetting.result !== 'CLEAR');
console.log(`batch files: ${files.length} | total records: ${total} | ready: ${ready.length}`);
console.log(`ready without vetting CLEAR: ${notClear.length}`);
if (nonCanonicalTags.size) console.log('non-canonical tags dropped:', [...nonCanonicalTags]);
if (ready.length !== 145) { console.error(`EXPECTED 145 ready records, got ${ready.length} — aborting`); process.exit(1); }
if (notClear.length) { console.error('READY RECORDS FAILING THE GATE — aborting'); process.exit(1); }

const out = {
  county: 'Pierce County',
  state: 'WA',
  countyFips: '53053',
  generatedFrom: 'directory-data/orgs/pierce/*.json — IRS BMF roster + org-website enrichment, VETTING.md gate (status=ready only)',
  orgs: ready,
};
const dest = join(repoRoot, 'public', 'data', 'orgs-pierce.json');
writeFileSync(dest, JSON.stringify(out));
console.log('wrote', dest, `(${(JSON.stringify(out).length / 1024).toFixed(1)} KB)`);
