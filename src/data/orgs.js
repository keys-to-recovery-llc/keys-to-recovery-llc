import { useEffect, useState } from 'react';

// County organization listings — org-level data layer.
//
// Listings are per-organization records (name, verified website, plain-language
// services, who they serve, phone, canonical taxonomy tags) built from public
// rosters + each org's own site, starting with the Pierce County, WA pilot; Grays Harbor County, WA added 2026-10-22 as pilot #2.
// Shipped as lazy-loaded assets under public/data/ (never bundled); a county's
// asset loads only when a visitor opens that county's locality view.
//
// PUBLICATION GATE (owner directive; protocol directory-data/VETTING.md):
// an org listing renders ONLY when its record carries
// vetting.result === "CLEAR". Records with EXCLUDE-FRAUD, EXCLUDE-REVOKED,
// or HOLD-REVIEW — or with no vetting block at all — NEVER render, and no
// accusation/exclusion text ever appears in the UI (excluded orgs simply do
// not appear). publishableOrgs() enforces the gate on every record, on top of
// the merge-time filter that only ships status="ready" records.

// ---------------------------------------------------------------------------
// FLIP SWITCH — owner ruling pending (supervisor note, 2026-10-22).
// EINs in this set are withheld from the directory even when their record is
// status="ready" AND vetting.result === "CLEAR". EMPTY by default.
//
// Greater Lakes Mental Healthcare (Lakewood, WA — EIN 916064184) is the one
// ready Pierce County record whose vetting sources carry a MultiCare
// affiliation disclosure: its parent, MultiCare Health System, agreed to pay
// $3,728,000 to resolve federal/state allegations over medically unnecessary
// spinal surgeries at MultiCare Deaconess Hospital (Spokane); Greater Lakes
// itself is not named in the settlement and the conduct is unrelated to its
// behavioral-health operations, so the record stands vetting-CLEAR. If the
// owner rules strict on affiliations, the supervisor adds '916064184' to
// this set — one line here, no data change needed. Do not add it otherwise.
// ---------------------------------------------------------------------------
export const EXCLUDED_EINS = new Set([
  '911741654', // SHARE & CARE HOUSE — removed 2026-10-23 on Bart's direct order (first-hand knowledge: program took its funding and spent it on itself; owner does not want it on the site)
  '260561140', // HOMEWARD BOUND IN PUYALLUP — same outfit as Share & Care House per Bart's first-hand confirmation, removed 2026-10-23
]);

// countyFips -> lazy asset URL. Counties without an asset have no org layer
// yet and the locality view renders no org section (gateways carry them).
const COUNTY_ORG_ASSETS = {
  53053: '/data/orgs-pierce.json', // Pierce County, WA
  53027: '/data/orgs-grays-harbor.json', // Grays Harbor County, WA
  53063: '/data/orgs-spokane.json', // Spokane County, WA
  53067: '/data/orgs-thurston.json', // Thurston County, WA
  53061: '/data/orgs-snohomish.json', // Snohomish County, WA
  41005: '/data/orgs-clackamas.json', // Clackamas County, OR
  41051: '/data/orgs-multnomah.json', // Multnomah County, OR
  41067: '/data/orgs-washington-or.json', // Washington County, OR
  '04013': '/data/orgs-maricopa.json', // Maricopa County, AZ
  '04019': '/data/orgs-pima.json', // Pima County, AZ
  '06073': '/data/orgs-san-diego.json', // San Diego County, CA
  17031: '/data/orgs-il-cook.json', // Cook County, IL
  17043: '/data/orgs-il-dupage.json', // DuPage County, IL
  39035: '/data/orgs-oh-cuyahoga.json', // Cuyahoga County, OH
  39061: '/data/orgs-oh-hamilton.json', // Hamilton County, OH
  26125: '/data/orgs-mi-oakland.json', // Oakland County, MI
  26099: '/data/orgs-mi-macomb.json', // Macomb County, MI
  47157: '/data/orgs-tn-shelby.json', // Shelby County, TN
  47093: '/data/orgs-tn-knox.json', // Knox County, TN
  13067: '/data/orgs-cobb.json', // Cobb County, GA
  13121: '/data/orgs-fulton.json', // Fulton County, GA
  13135: '/data/orgs-gwinnett.json', // Gwinnett County, GA
};

const orgPromises = new Map();

export function normalizeEin(ein) {
  return String(ein || '').replace(/\D/g, '');
}

export function publishableOrgs(orgs) {
  if (!Array.isArray(orgs)) return [];
  return orgs.filter(
    (o) =>
      o &&
      o.vetting &&
      o.vetting.result === 'CLEAR' &&
      !EXCLUDED_EINS.has(normalizeEin(o.ein)),
  );
}

export function loadCountyOrgs(countyFips) {
  const url = countyFips ? COUNTY_ORG_ASSETS[countyFips] : null;
  if (!url) return Promise.resolve([]);
  if (!orgPromises.has(countyFips)) {
    orgPromises.set(
      countyFips,
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`orgs fetch ${r.status}`);
          return r.json();
        })
        .then((data) => publishableOrgs(data.orgs || []))
        .catch((err) => {
          orgPromises.delete(countyFips);
          throw err;
        }),
    );
  }
  return orgPromises.get(countyFips);
}

// React hook for the locality view: { orgs, loading }. Orgs are already
// gate-filtered; a county with no org asset resolves to an empty list.
export function useCountyOrgs(countyFips) {
  const hasAsset = Boolean(countyFips && COUNTY_ORG_ASSETS[countyFips]);
  const [result, setResult] = useState({ orgs: [], loading: hasAsset });
  useEffect(() => {
    let live = true;
    if (!hasAsset) {
      setResult({ orgs: [], loading: false });
      return undefined;
    }
    setResult({ orgs: [], loading: true });
    loadCountyOrgs(countyFips)
      .then((orgs) => { if (live) setResult({ orgs, loading: false }); })
      .catch(() => { if (live) setResult({ orgs: [], loading: false }); });
    return () => { live = false; };
  }, [countyFips, hasAsset]);
  return result;
}
