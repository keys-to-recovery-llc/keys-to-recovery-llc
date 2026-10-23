import { useEffect, useState } from 'react';

// Facility layer — SAMHSA national facility roster, lazy-loaded per state.
//
// Data: public/data/facilities/<ST>.json — slim UI chunks produced by
// scripts/slim-facilities.mjs from directory-data/facilities/<ST>.json
// (SAMHSA 2025 National Directories of Drug and Alcohol Use / Mental Health
// Treatment Facilities, built from the 2024 N-SUMHSS; provenance in
// directory-data/facilities/source/PROVENANCE.md). A state's chunk is
// fetched only when a visitor opens a locality in that state — the raw
// roster (WA alone was 3.6 MB) never ships. American Samoa has no
// facilities in the 2025 directories, so it has no chunk (fetch resolves
// to an empty roster and the section renders nothing).
//
// Slim record shape (as shipped):
//   { name, name2, address, city, zip, county, phone, intakePhones,
//     type[], detox, mat{methadone,buprenorphine,naltrexone,otpCertified,any},
//     services[], payment[], paymentAssistance, populations[], languages[],
//     licenseSummary[], dataYear, source }
// adaptFacility() adds what the UI consumes: `state`, `levels`
// (detox/residential/outpatient/hospital) and boolean `mat` (detail kept
// on `matDetail`).

export const FACILITY_LEVELS = [
  { key: 'detox', label: 'Detox' },
  { key: 'residential', label: 'Residential' },
  { key: 'outpatient', label: 'Outpatient' },
  // Hospital-inpatient-only facilities (428 nationally) group under their
  // own honest label rather than being folded into "Residential".
  { key: 'hospital', label: 'Hospital inpatient' },
];

// Filter pills for the facilities section: the levels of care named by the
// owner (Detox / Residential / Outpatient) plus MAT and Medicaid, and the
// hospital-inpatient level above.
export const FACILITY_FILTERS = [
  ...FACILITY_LEVELS,
  { key: 'mat', label: 'MAT' },
  { key: 'medicaid', label: 'Medicaid' },
];

export function adaptFacility(raw, state) {
  const types = new Set(raw.type || []);
  const levels = [];
  if (raw.detox || types.has('detox')) levels.push('detox');
  if (types.has('residential')) levels.push('residential');
  if (types.has('outpatient') || types.has('partial hospitalization/day treatment')) levels.push('outpatient');
  if (types.has('hospital inpatient')) levels.push('hospital');
  return {
    ...raw,
    state: state || raw.state || null,
    levels,
    mat: Boolean(raw.mat && raw.mat.any),
    matDetail: raw.mat || null,
  };
}

const chunkPromises = new Map();

export function loadFacilitiesForState(state) {
  if (!state) return Promise.resolve([]);
  if (!chunkPromises.has(state)) {
    chunkPromises.set(
      state,
      fetch(`/data/facilities/${state}.json`)
        .then((r) => {
          if (!r.ok) throw new Error(`facilities fetch ${r.status}`);
          return r.json();
        })
        .then((rows) => (Array.isArray(rows) ? rows.map((r) => adaptFacility(r, state)) : []))
        .catch((err) => {
          chunkPromises.delete(state);
          throw err;
        }),
    );
  }
  return chunkPromises.get(state);
}

// Narrow a state roster to the locality's county when the records carry
// county names; fall back to the whole state roster when the county has
// no listed facilities (better a statewide list than an empty one).
export function narrowToCounty(roster, locality) {
  if (!locality || !locality.county) return roster || [];
  const county = locality.county.toLowerCase();
  const inCounty = (roster || []).filter((f) => (f.county || '').toLowerCase() === county);
  return inCounty.length > 0 ? inCounty : roster;
}

// React hook for the locality view: { facilities, loading } — the state's
// roster narrowed to the locality's county, adapted for the UI.
export function useFacilitiesForLocality(locality) {
  const state = locality?.state || null;
  const county = locality?.county || null;
  const [result, setResult] = useState({ facilities: [], loading: Boolean(state) });
  useEffect(() => {
    let live = true;
    if (!state) {
      setResult({ facilities: [], loading: false });
      return undefined;
    }
    setResult({ facilities: [], loading: true });
    loadFacilitiesForState(state)
      .then((roster) => { if (live) setResult({ facilities: narrowToCounty(roster, { county }), loading: false }); })
      .catch(() => { if (live) setResult({ facilities: [], loading: false }); });
    return () => { live = false; };
  }, [state, county]);
  return result;
}

// A facility passes when: it satisfies every active service/payment filter
// (MAT, Medicaid), and — if any level filter is active — it offers at least
// one of the selected levels of care.
export function filterFacilities(facilities, activeFilters) {
  const active = new Set(activeFilters || []);
  const levelKeys = FACILITY_LEVELS.map((l) => l.key).filter((k) => active.has(k));
  return (facilities || []).filter((f) => {
    if (levelKeys.length > 0 && !levelKeys.some((k) => (f.levels || []).includes(k))) return false;
    if (active.has('mat') && !f.mat) return false;
    if (active.has('medicaid') && !(f.payment || []).some((p) => /medicaid/i.test(p))) return false;
    return true;
  });
}

// Group a (filtered) facility list by level of care for display; a facility
// offering several levels appears under each of them. Facilities whose
// survey rows carried no service-setting codes at all (34 nationally) get
// an honest catch-all group instead of silently vanishing from the list.
export function groupFacilitiesByLevel(facilities) {
  const groups = FACILITY_LEVELS.map((level) => ({
    ...level,
    facilities: (facilities || []).filter((f) => (f.levels || []).includes(level.key)),
  })).filter((g) => g.facilities.length > 0);
  const unleveled = (facilities || []).filter((f) => (f.levels || []).length === 0);
  if (unleveled.length > 0) {
    groups.push({ key: 'unreported', label: 'Level of care not reported', facilities: unleveled });
  }
  return groups;
}
