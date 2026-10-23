import { useEffect, useState } from 'react';

// MEETINGS LAYERS — real meeting schedules, lazy-loaded.
//
// NA: per-state assets (public/data/meetings-na/<ST>.json) built from the
// BMLT open meeting network — Narcotics Anonymous service bodies publish
// their schedules there expressly for public meeting-finding. Filtered to
// the locality's county here; temporarily-closed meetings are excluded.
// AA: per-county assets (public/data/meetings-aa/<countyFips>.json) built
// from local A.A. service entities' public Meeting Guide (TSML) feeds.
// Coverage is partial by nature (only entities that publish a feed) — the
// section renders AA only where a feed exists, and says so.

const DAY_ORDER = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
const AA_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function fmtTime(t) {
  if (!t) return '';
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return t;
  let h = parseInt(m[1], 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ampm}`;
}

function countyKeys(county) {
  if (!county) return [];
  const base = String(county).trim();
  const keys = [base.toLowerCase()];
  if (!/county$/i.test(base)) keys.push(`${base} County`.toLowerCase());
  else keys.push(base.replace(/ county$/i, '').toLowerCase());
  return keys;
}

const naPromises = new Map();
export function useNaMeetings(state, county) {
  const [result, setResult] = useState({ meetings: [], loading: Boolean(state) });
  useEffect(() => {
    let live = true;
    if (!state) { setResult({ meetings: [], loading: false }); return undefined; }
    if (!naPromises.has(state)) {
      naPromises.set(state, fetch(`/data/meetings-na/${state}.json`)
        .then((r) => { if (!r.ok) throw new Error(`na fetch ${r.status}`); return r.json(); })
        .then((d) => d.meetings || [])
        .catch(() => []));
    }
    setResult({ meetings: [], loading: true });
    naPromises.get(state).then((all) => {
      if (!live) return;
      const keys = countyKeys(county);
      const sel = all.filter(
        (m) => !m.temporarily_closed && m.county && keys.includes(String(m.county).toLowerCase()),
      );
      sel.sort((a, b) =>
        (DAY_ORDER[a.weekday] ?? 7) - (DAY_ORDER[b.weekday] ?? 7) ||
        String(a.start_time).localeCompare(String(b.start_time)));
      setResult({ meetings: sel, loading: false });
    });
    return () => { live = false; };
  }, [state, county]);
  return result;
}

export function useAaMeetings(countyFips) {
  const [result, setResult] = useState({ meetings: [], loading: Boolean(countyFips) });
  useEffect(() => {
    let live = true;
    if (!countyFips) { setResult({ meetings: [], loading: false }); return undefined; }
    setResult({ meetings: [], loading: true });
    fetch(`/data/meetings-aa/${countyFips}.json`)
      .then((r) => { if (!r.ok) throw new Error(`aa fetch ${r.status}`); return r.json(); })
      .then((d) => {
        if (!live) return;
        const sel = (d.meetings || []).slice().sort((a, b) =>
          (a.day ?? 7) - (b.day ?? 7) || String(a.time || '').localeCompare(String(b.time || '')));
        setResult({ meetings: sel, loading: false });
      })
      .catch(() => { if (live) setResult({ meetings: [], loading: false }); });
    return () => { live = false; };
  }, [countyFips]);
  return result;
}

export { AA_DAYS };
