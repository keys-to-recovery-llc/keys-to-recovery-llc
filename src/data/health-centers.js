import { useEffect, useState } from 'react';

// HEALTH CENTERS LAYER — HRSA Health Center Program service delivery sites
// (federally funded clinics; sliding-scale primary care regardless of
// ability to pay). Per-state lazy assets under public/data/health-centers/,
// built from data.hrsa.gov (federal public domain). Filtered to the
// locality's county by countyFips (records carry it from the build).

const promises = new Map();

export function useHealthCenters(state, countyFips, county) {
  const [result, setResult] = useState({ sites: [], loading: Boolean(state) });
  useEffect(() => {
    let live = true;
    if (!state) { setResult({ sites: [], loading: false }); return undefined; }
    if (!promises.has(state)) {
      promises.set(state, fetch(`/data/health-centers/${state}.json`)
        .then((r) => { if (!r.ok) throw new Error(`hrsa fetch ${r.status}`); return r.json(); })
        .then((d) => d.sites || [])
        .catch(() => []));
    }
    setResult({ sites: [], loading: true });
    promises.get(state).then((all) => {
      if (!live) return;
      let sel = countyFips ? all.filter((s) => String(s.countyFips) === String(countyFips)) : [];
      if (sel.length === 0 && county) {
        const want = String(county).toLowerCase();
        sel = all.filter((s) => s.county && String(s.county).toLowerCase() === want);
      }
      sel.sort((a, b) => String(a.name).localeCompare(String(b.name)));
      setResult({ sites: sel, loading: false });
    });
    return () => { live = false; };
  }, [state, countyFips, county]);
  return result;
}
