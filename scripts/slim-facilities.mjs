// Slim the SAMHSA facility roster into per-state lazy-loaded UI chunks.
//
// Source: ~/workspace/keys-to-recovery-llc/directory-data/facilities/<ST>.json
// (55 files, 20,371 records — SAMHSA 2025 National Directories built from the
// 2024 N-SUMHSS; provenance: facilities/source/PROVENANCE.md). The full
// records stay archived in directory-data; the chunks keep ONLY UI fields.
//
// Usage: node scripts/slim-facilities.mjs
// Output: public/data/facilities/<ST>.json (bare array per state)
//         public/data/facilities-stats.json (copied verbatim)

import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(repoRoot, '..', '..', 'directory-data', 'facilities');
const outDir = join(repoRoot, 'public', 'data', 'facilities');
mkdirSync(outDir, { recursive: true });

const dedupe = (arr) => [...new Set((arr || []).filter(Boolean))];

function slim(r) {
  const lf = r.licenseFields || {};
  const licenseSummary = dedupe([
    ...(lf.licenseCertificationAccreditation || []),
    ...(lf.accreditation || []),
  ]);
  const populations = dedupe([
    ...((r.populations || {}).ageGroups || []),
    ...((r.populations || {}).specialPrograms || []),
    ...((r.populations || {}).sexAccepted || []),
  ]).slice(0, 8);
  return {
    name: r.name,
    name2: r.name2 || null,
    address: r.address || '',
    city: r.city || null,
    zip: r.zip || null,
    county: r.county || null,
    phone: r.phone || null,
    // Intake lines, minus any that just repeat the main number.
    intakePhones: dedupe(r.intakePhones).filter((p) => p !== r.phone),
    type: r.type || [],
    detox: Boolean(r.detox),
    mat: {
      methadone: Boolean(r.mat?.methadone),
      buprenorphine: Boolean(r.mat?.buprenorphine),
      naltrexone: Boolean(r.mat?.naltrexone),
      otpCertified: Boolean(r.mat?.otpCertified),
      any: Boolean(r.mat?.any),
    },
    services: dedupe(r.services).slice(0, 8),
    payment: r.payment || [],
    paymentAssistance: r.paymentAssistance || [],
    populations,
    languages: r.languages || [],
    licenseSummary,
    dataYear: r.dataYear || 2024,
    source: r.source || null,
  };
}

const files = readdirSync(srcDir)
  .filter((f) => /^[A-Z]{2}\.json$/.test(f))
  .sort();

let total = 0;
for (const f of files) {
  const data = JSON.parse(readFileSync(join(srcDir, f), 'utf8'));
  const records = Array.isArray(data) ? data : data.facilities || [];
  const slimmed = records.map(slim);
  total += slimmed.length;
  writeFileSync(join(outDir, f), JSON.stringify(slimmed));
  console.log(`${f}: ${slimmed.length}`);
}
console.log(`TOTAL: ${total} facilities across ${files.length} state chunks`);
if (total !== 20371) { console.error('EXPECTED 20,371 — aborting'); process.exit(1); }

copyFileSync(join(srcDir, 'facilities-stats.json'), join(repoRoot, 'public', 'data', 'facilities-stats.json'));
console.log('copied facilities-stats.json -> public/data/facilities-stats.json');
