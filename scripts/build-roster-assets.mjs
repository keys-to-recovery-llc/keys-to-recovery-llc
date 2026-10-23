// Build the national IRS-registry roster assets for the directory.
//
// Source: ~/workspace/keys-to-recovery-llc/directory-data/registry/eo/<ST>.json
// (IRS Exempt Organizations Business Master File per-state extracts, parsed by
// directory-data/registry/build_national_roster.py; county resolved from the
// project gazetteer ZIP->county, never inferred from city name).
//
// LABELING DOCTRINE: these are IRS REGISTRY records. The site presents them as
// "registered organizations" (name / city / category from federal records) —
// a tier BELOW the own-site-verified county-pilot listings. They are NOT
// vetted, NOT CLEAR, and must never render with verified language. Every
// asset carries tier:"irs-registry" and vetted:false so the UI can label
// them honestly. Vetting stays with the deep county pilots.
//
// Output: public/data/orgs/<ST>.json — a lazy per-state chunk mirroring the
// facilities pattern:
//   { state, generatedAt, tier, vetted, presentation, source, totalOrgs,
//     counties: { "<County Name>": [ {name, ein, city, zip, category} ] },
//     unresolved: [ ...same shape, ZIP did not resolve to a county... ] }
// If a state's chunk would exceed ~3 MB raw, it is sharded by county instead:
//   public/data/orgs/<ST>.json         (index: per-county file + count)
//   public/data/orgs/<ST>/<slug>.json  (one file per county)
//   public/data/orgs/<ST>/_unresolved.json (when unresolved orgs exist)
//
// Usage: node scripts/build-roster-assets.mjs

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(repoRoot, '..', '..', 'directory-data', 'registry', 'eo');
const outDir = join(repoRoot, 'public', 'data', 'orgs');

const SHARD_THRESHOLD = 3 * 1024 * 1024; // ~3 MB raw
const PRESENTATION =
  'Registered organizations — name, city and category from IRS federal ' +
  'records. This tier has not been individually verified; verified ' +
  'listings come from the county research pilots.';
const SOURCE_LABEL =
  'IRS Exempt Organizations Business Master File extract (irs.gov)';

function slug(county) {
  return county.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function slim(o) {
  return { name: o.name, ein: o.ein, city: o.city, zip: o.zip, category: o.category };
}

mkdirSync(outDir, { recursive: true });

const summary = [];
const files = readdirSync(srcDir)
  .filter((f) => /^[A-Z]{2}\.json$/.test(f))
  .sort();

for (const file of files) {
  const data = JSON.parse(readFileSync(join(srcDir, file), 'utf8'));
  const st = data.state;
  const generatedAt = new Date().toISOString();

  const counties = {};
  const unresolved = [];
  for (const o of data.orgs) {
    if (o.county) {
      (counties[o.county] ??= []).push(slim(o));
    } else {
      unresolved.push(slim(o));
    }
  }
  for (const k of Object.keys(counties)) {
    counties[k].sort((a, b) => a.name.localeCompare(b.name));
  }
  unresolved.sort((a, b) => a.name.localeCompare(b.name));

  const meta = {
    state: st,
    generatedAt,
    tier: 'irs-registry',
    vetted: false,
    presentation: PRESENTATION,
    source: SOURCE_LABEL,
    sourceFile: data.source,
    totalOrgs: data.orgs.length,
  };

  const whole = { ...meta, counties, unresolved };
  const wholeJson = JSON.stringify(whole);

  if (Buffer.byteLength(wholeJson) <= SHARD_THRESHOLD) {
    const outPath = join(outDir, `${st}.json`);
    writeFileSync(outPath, wholeJson);
    summary.push({ state: st, mode: 'single', orgs: data.orgs.length, bytes: Buffer.byteLength(wholeJson), counties: Object.keys(counties).length, unresolved: unresolved.length });
  } else {
    const stDir = join(outDir, st);
    mkdirSync(stDir, { recursive: true });
    const indexCounties = {};
    let totalBytes = 0;
    for (const [county, orgs] of Object.entries(counties)) {
      const fn = `${slug(county)}.json`;
      const payload = JSON.stringify({ ...meta, county, orgs });
      writeFileSync(join(stDir, fn), payload);
      totalBytes += Buffer.byteLength(payload);
      indexCounties[county] = { file: fn, count: orgs.length };
    }
    const index = { ...meta, sharded: true, counties: indexCounties, unresolvedCount: unresolved.length };
    if (unresolved.length) {
      const payload = JSON.stringify({ ...meta, county: null, orgs: unresolved });
      writeFileSync(join(stDir, '_unresolved.json'), payload);
      totalBytes += Buffer.byteLength(payload);
      index.unresolvedFile = '_unresolved.json';
    }
    const indexJson = JSON.stringify(index);
    writeFileSync(join(outDir, `${st}.json`), indexJson);
    totalBytes += Buffer.byteLength(indexJson);
    summary.push({ state: st, mode: 'sharded', orgs: data.orgs.length, bytes: totalBytes, counties: Object.keys(counties).length, unresolved: unresolved.length });
  }
}

console.log(JSON.stringify(summary, null, 1));
const totalOrgs = summary.reduce((a, s) => a + s.orgs, 0);
const totalBytes = summary.reduce((a, s) => a + s.bytes, 0);
console.log(`states=${summary.length} totalOrgs=${totalOrgs} totalAssetBytes=${totalBytes}`);
