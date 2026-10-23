// Facility layer — INTEGRATION SEAM ONLY (no data imported yet).
//
// A facility layer is in production on the data side: every licensed detox &
// treatment center in SAMHSA's national facility roster, one JSON per state
// at directory-data/facilities/<ST>.json, with computed counts in
// facilities-stats.json. The supervisor hands the data over after provenance
// + QC; when it arrives it plugs in here, e.g.:
//
//   const modules = import.meta.glob('./facilities/*.json', { eager: true });
//   export const facilitiesByState = { WA: modules[...].facilities, ... };
//
// Expected record shape (per the data layer's description; adapt the two
// accessor helpers below if the landed field names differ in detail):
//   { name, address, city, county, state, zip, phone, url,
//     levels: ['detox' | 'residential' | 'outpatient', ...],
//     services: [...],            // incl. MAT flags
//     mat: true | false,          // medication-assisted treatment offered
//     payment: ['Medicaid', ...],
//     populations: [...] }
//
// Until handover this map is empty: the locality view's FacilitiesSection
// renders nothing, exactly like the county-org slot. Nothing blocks on it.

export const facilitiesByState = {};

export const FACILITY_LEVELS = [
  { key: 'detox', label: 'Detox' },
  { key: 'residential', label: 'Residential' },
  { key: 'outpatient', label: 'Outpatient' },
];

// Filter pills for the facilities section: the three levels of care plus
// the two service/payment filters named by the owner.
export const FACILITY_FILTERS = [
  ...FACILITY_LEVELS,
  { key: 'mat', label: 'MAT' },
  { key: 'medicaid', label: 'Medicaid' },
];

// Facilities for a locality: the state's roster, narrowed to the locality's
// county when the records carry county names (a ZIP-exact narrowing can be
// added at import time if the handed-over data supports it).
export function facilitiesForLocality(locality) {
  if (!locality) return [];
  const roster = facilitiesByState[locality.state] || [];
  if (!locality.county) return roster;
  const county = locality.county.toLowerCase();
  const inCounty = roster.filter(
    (f) => (f.county || '').toLowerCase() === county,
  );
  return inCounty.length > 0 ? inCounty : roster;
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
// offering several levels appears under each of them.
export function groupFacilitiesByLevel(facilities) {
  return FACILITY_LEVELS.map((level) => ({
    ...level,
    facilities: (facilities || []).filter((f) => (f.levels || []).includes(level.key)),
  })).filter((g) => g.facilities.length > 0);
}
