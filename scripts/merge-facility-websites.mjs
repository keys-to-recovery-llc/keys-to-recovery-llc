// Merge verified facility website enrichment into the shipped SAMHSA facility
// assets (public/data/facilities/<ST>.json), keyed on (name|name2|city|zip5) —
// the same protocol as the manual WA wave (2026-10-22, 412 applied).
//
// Usage: node scripts/merge-facility-websites.mjs TN TX IL OH MI
// Source: ~/workspace/keys-to-recovery-llc/directory-data/facilities/enrichment/<ST>-websites.json
// (flat list of matched records: name, name2, city, zip, website — own-domain
// operator sites only, per the enrichment protocol). Unmatched keys are
// reported, never guessed. Closures are applied from the CLOSURES table
// below — each entry was verified against the enrichment report text and the
// facility record's address before being added here.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(repoRoot, '..', '..', 'directory-data', 'facilities', 'enrichment');

const norm = (v) => String(v || '').toUpperCase().replace(/\s+/g, ' ').trim();
const key = (r) => [norm(r.name), norm(r.name2), norm(r.city), String(r.zip || '').slice(0, 5)].join('|');

// Operator-evidenced closures (see each state's enrichment report, 2026-10-23).
const CLOSURES = {
  MI: [
    {
      name: 'Kalamazoo Probation', name2: 'Enhancement Program', zip: '49022',
      note: "Closure announced by the operator — this site's residential operations close effective March 6, 2026 (operator's closure letter, checked 2026-10-23)",
    },
  ],
  IL: [
    {
      name: 'Wayward DUI Counseling Inc', name2: '', zip: '60102',
      note: 'Reported permanently closed (checked 2026-10-23)',
    },
    {
      name: 'Sandstone Care', name2: 'Treatment Center', zip: '60089',
      note: "Reported closed — the operator's own site no longer lists this location (checked 2026-10-23)",
    },
  ],
};

for (const st of process.argv.slice(2)) {
  const enrich = JSON.parse(readFileSync(join(srcDir, `${st}-websites.json`), 'utf8'));
  const matched = Array.isArray(enrich) ? enrich : enrich.matched || [];
  const assetPath = join(repoRoot, 'public', 'data', 'facilities', `${st}.json`);
  const facilities = JSON.parse(readFileSync(assetPath, 'utf8'));
  const byKey = new Map(facilities.map((f) => [key(f), f]));

  let applied = 0;
  const unapplied = [];
  for (const m of matched) {
    const f = byKey.get(key(m));
    if (!f) { unapplied.push(`${m.name} (${m.city} ${m.zip})`); continue; }
    if (m.website) { f.url = m.website; applied += 1; }
  }

  let closures = 0;
  for (const c of CLOSURES[st] || []) {
    const f = facilities.find((x) => norm(x.name) === norm(c.name) && norm(x.name2) === norm(c.name2) && String(x.zip || '').slice(0, 5) === c.zip);
    if (f) { f.closureNote = c.note; delete f.url; closures += 1; }
    else console.log(`  !! closure target NOT FOUND: ${c.name} ${c.zip}`);
  }

  writeFileSync(assetPath, JSON.stringify(facilities));
  console.log(`${st}: facilities ${facilities.length} | websites applied ${applied}/${matched.length} | closures ${closures}`);
  if (unapplied.length) console.log(`  unapplied: ${unapplied.join('; ')}`);
}
