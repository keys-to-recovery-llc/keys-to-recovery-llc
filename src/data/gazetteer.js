// Gazetteer loader + locality search.
//
// Source dataset: U.S. Census Bureau Gazetteer + ZCTA relationship files,
// built by the gazetteer agent into directory-data/gazetteer/localities.json
// (counts: 56 states/territories, 3,235 counties, 32,333 places, 33,791 ZIPs).
// The build copies { meta, states, counties, zips } to
// public/data/localities.json (~4 MB) and the page fetches it LAZILY the
// first time a visitor uses locality search — it is never bundled, so the
// directory page itself stays fast.
//
// ZIP record fields (as documented by the gazetteer agent):
//   { zip, city, state, county, countyFips, lat, lng }
//   - city   = Census place holding the largest share of the ZCTA's land
//              (NOT the USPS preferred city name; the two can differ)
//   - county = primary county (largest land share of the ZCTA)
// County record fields: { name, state, fips } (seat/lat/lng trimmed at copy).

let cache = null;
let loading = null;

export function loadGazetteer() {
  if (cache) return Promise.resolve(cache);
  if (!loading) {
    loading = fetch('/data/localities.json')
      .then((r) => {
        if (!r.ok) throw new Error(`gazetteer fetch ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const byZip = new Map();
        const byCity = new Map(); // "city|ST" -> zip records
        const byCounty = new Map(); // "county|ST" -> zip records
        for (const z of data.zips) {
          byZip.set(z.zip, z);
          const ck = `${(z.city || '').toLowerCase()}|${z.state}`;
          if (!byCity.has(ck)) byCity.set(ck, []);
          byCity.get(ck).push(z);
          const kk = `${(z.county || '').toLowerCase()}|${z.state}`;
          if (!byCounty.has(kk)) byCounty.set(kk, []);
          byCounty.get(kk).push(z);
        }
        cache = { ...data, byZip, byCity, byCounty };
        return cache;
      })
      .catch((err) => {
        loading = null;
        throw err;
      });
  }
  return loading;
}

// Resolve a free-text query to locality candidates.
// Accepts: 5-digit ZIP, "City", "City, ST", "County", "County, ST",
// "Pierce County, WA", etc. Returns up to `limit` locality objects:
//   { zip, city, state, county, countyFips, match: 'zip'|'city'|'county' }
// For city/county matches the representative record is the first ZIP in
// that city/county; `zipCount` says how many ZIPs the place/county spans.
export function searchLocalities(gaz, rawQuery, limit = 8) {
  const q = (rawQuery || '').trim();
  if (!q || !gaz) return [];

  if (/^\d{5}$/.test(q)) {
    const hit = gaz.byZip.get(q);
    return hit ? [{ ...hit, match: 'zip', zipCount: 1 }] : [];
  }

  const lower = q.toLowerCase();
  const stateSuffix = lower.match(/,\s*([a-z]{2})$/);
  const stateFilter = stateSuffix ? stateSuffix[1].toUpperCase() : null;
  const term = (stateFilter ? lower.slice(0, stateSuffix.index) : lower).trim();

  const results = [];
  const seen = new Set();

  // City matches (exact first, then prefix)
  for (const [key, zips] of gaz.byCity) {
    const [city, st] = key.split('|');
    if (stateFilter && st !== stateFilter) continue;
    if (city === term || city.startsWith(term)) {
      const rep = zips[0];
      const id = `city|${key}`;
      if (!seen.has(id)) {
        seen.add(id);
        results.push({ ...rep, match: 'city', zipCount: zips.length, exact: city === term });
      }
    }
  }
  // County matches (with or without the "County"/"Parish"/etc. suffix typed)
  const countyTerm = term.replace(/\s+(county|parish|borough|census area|municipality|municipio)$/, '');
  for (const [key, zips] of gaz.byCounty) {
    const [county, st] = key.split('|');
    if (stateFilter && st !== stateFilter) continue;
    const base = county.toLowerCase().replace(/\s+(county|parish|borough|census area|municipality|municipio)$/, '');
    if (base === countyTerm || base.startsWith(countyTerm)) {
      const rep = zips[0];
      const id = `county|${key}`;
      if (!seen.has(id)) {
        seen.add(id);
        results.push({ ...rep, match: 'county', zipCount: zips.length, exact: base === countyTerm });
      }
    }
  }

  return results
    .sort((a, b) => (b.exact - a.exact) || (a.state.localeCompare(b.state)) || (a.city || '').localeCompare(b.city || ''))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// County organization listings live in src/data/orgs.js (lazy-loaded assets
// under public/data/, publication gate + EXCLUDED_EINS flip switch there).
// The Pierce County, WA pilot (countyFips 53053) is wired; counties without
// an org asset render no org section. publishableOrgs is re-exported here
// for compatibility with the original seam.
// ---------------------------------------------------------------------------
export { publishableOrgs } from './orgs.js';
