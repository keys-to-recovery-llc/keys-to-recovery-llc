import { useEffect, useState } from 'react';
import { EXCLUDED_EINS, normalizeEin } from './orgs';

// Owner-excluded organizations never render in ANY tier — including this
// registry skeleton (Bart directive 2026-10-23: Share & Care House +
// Homeward Bound removed from the whole site, not just the verified layer).
const withoutExcluded = (orgs) => (orgs || []).filter((o) => !EXCLUDED_EINS.has(normalizeEin(o.ein)));

// IRS REGISTRY TIER — national organization skeleton.
//
// Every county's registered nonprofits from the IRS Exempt Organizations
// Business Master File (public federal records), shipped as lazy per-state
// assets under public/data/orgs/ (index per state; large states sharded by
// county). This tier is DELIBERATELY below the verified county-pilot layer
// (src/data/orgs.js): records carry name/city/ZIP/NTEE category from federal
// filings only. They are NOT vetted, NOT site-verified, and carry no service
// claims — the UI labels them as registry records everywhere they render.

const indexPromises = new Map();
const countyPromises = new Map();

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`registry fetch ${r.status}`);
  return r.json();
}

function countyKeyCandidates(county) {
  if (!county) return [];
  const base = String(county).trim();
  const keys = [base];
  if (!/county$/i.test(base)) keys.push(`${base} County`);
  else keys.push(base.replace(/ county$/i, ''));
  return [...new Set(keys)];
}

export function loadCountyRegistry(state, county) {
  if (!state || !county) return Promise.resolve(null);
  const key = `${state}|${county}`;
  if (!countyPromises.has(key)) {
    countyPromises.set(
      key,
      (async () => {
        const idx = await fetchJson(`/data/orgs/${state}.json`);
        const counties = idx.counties || {};
        const hitKey = countyKeyCandidates(county).find((k) => counties[k] !== undefined);
        if (!hitKey) return { orgs: [], presentation: idx.presentation || null, countyCount: 0 };
        if (idx.sharded) {
          const ent = counties[hitKey];
          if (!ent || !ent.file) return { orgs: [], presentation: idx.presentation || null, countyCount: 0 };
          const shard = await fetchJson(`/data/orgs/${state}/${ent.file}`);
          const kept = withoutExcluded(shard.orgs || []);
          return {
            orgs: kept,
            presentation: idx.presentation || null,
            countyCount: (ent.count || (shard.orgs || []).length) - ((shard.orgs || []).length - kept.length),
          };
        }
        const arr = withoutExcluded(Array.isArray(counties[hitKey]) ? counties[hitKey] : []);
        return { orgs: arr, presentation: idx.presentation || null, countyCount: arr.length };
      })().catch(() => null),
    );
  }
  return countyPromises.get(key);
}

export function useCountyRegistry(state, county) {
  const [result, setResult] = useState({ data: null, loading: Boolean(state && county) });
  useEffect(() => {
    let live = true;
    if (!state || !county) {
      setResult({ data: null, loading: false });
      return undefined;
    }
    setResult({ data: null, loading: true });
    loadCountyRegistry(state, county)
      .then((data) => { if (live) setResult({ data, loading: false }); })
      .catch(() => { if (live) setResult({ data: null, loading: false }); });
    return () => { live = false; };
  }, [state, county]);
  return result;
}
