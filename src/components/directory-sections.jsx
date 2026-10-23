// Shared directory building blocks: the locality result panel and its
// sections (state gateways, county organizations, licensed facilities),
// plus the small link/pill primitives both the Directory page and the
// Resources page finder use. Extracted from pages/Directory.jsx so the
// same verified rendering serves both pages — one implementation, no
// drift. Publication gates live in the data layer (src/data/orgs.js
// enforces vetting.result === "CLEAR" before any org reaches this file).
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Phone, Filter, Home, Users, Landmark, HeartHandshake } from 'lucide-react';
import { TAXONOMY, nationalEntries, US_STATES, TERRITORIES } from '@/data/directory';
import { stateGatewayByAbbr } from '@/data/states';
import { useCountyOrgs } from '@/data/orgs';
import { useCountyRegistry } from '@/data/registry';
import { useNaMeetings, useAaMeetings, fmtTime, AA_DAYS } from '@/data/meetings';
import { useHealthCenters } from '@/data/health-centers';
import { locatorUrl, isPrefilled } from '@/data/locators';
import { useFacilitiesForLocality, filterFacilities, groupFacilitiesByLevel, FACILITY_FILTERS } from '@/data/facilities';

export const ALL_STATES_AND_TERRITORIES = [...US_STATES, ...TERRITORIES];

export function FilterPill({ value, current, onChange }) {
  return (
    <button
      onClick={() => onChange(value)}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
        current === value
          ? 'bg-[#d4a574] text-black'
          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
      }`}
    >
      {value}
    </button>
  );
}

export function ExtLink({ href, children, className = '' }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Opens external site"
      className={`inline-flex items-center gap-1 text-[#d4a574] text-sm font-medium hover:underline ${className}`}
    >
      {children} <ExternalLink className="h-3.5 w-3.5" />
      <span className="sr-only">(opens external site)</span>
    </a>
  );
}

// County organization listings (org-level data layer).
// Renders ONLY orgs returned by useCountyOrgs(), which enforces the owner's
// publication gate: a listing appears only when its record carries
// vetting.result === "CLEAR" and its EIN is not in the EXCLUDED_EINS flip
// switch (see src/data/orgs.js + directory-data/VETTING.md). Orgs are
// lazy-loaded per county; grouped by the canonical taxonomy categories,
// with a final catch-all group so a cleared org is never silently dropped
// for lacking a tag. Counties without cleared orgs render nothing at all.
export function CountyOrgsSection({ locality, onlyTags }) {
  const { orgs, loading } = useCountyOrgs(locality?.countyFips);
  if (!locality) return null;
  if (loading) {
    return (
      <div className="mt-6">
        <h4 className="text-white font-semibold mb-3">Local organizations in {locality.county}</h4>
        <p className="text-white/40 text-sm">Loading local organizations…</p>
      </div>
    );
  }
  if (orgs.length === 0) return null;
  const focusTags = (onlyTags || []).filter((t) => TAXONOMY.includes(t));
  if (focusTags.length > 0) {
    const matched = orgs.filter((o) => (o.tags || []).some((t) => focusTags.includes(t)));
    if (matched.length === 0) {
      return (
        <div className="mt-6">
          <h4 className="text-white font-semibold mb-1">Local organizations in {locality.county}</h4>
          <p className="text-white/40 text-sm">
            No verified local organizations here match that need yet — the full
            directory below lists everything else available nationally.
          </p>
        </div>
      );
    }
    return <CountyOrgsList locality={locality} orgs={matched} focusTags={focusTags} />;
  }
  return <CountyOrgsList locality={locality} orgs={orgs} />;
}

function CountyOrgsList({ locality, orgs, focusTags }) {
  const byCategory = TAXONOMY.map((cat) => ({
    category: cat,
    orgs: orgs.filter((o) => (o.tags || []).includes(cat)),
  })).filter((g) => g.orgs.length > 0);
  const untagged = orgs.filter((o) => !(o.tags || []).some((t) => TAXONOMY.includes(t)));
  const groups = untagged.length > 0
    ? [...byCategory, { category: 'More local organizations', orgs: untagged }]
    : byCategory;
  return (
    <div className="mt-6">
      <h4 className="text-white font-semibold mb-1">
        Local organizations in {locality.county}
      </h4>
      <p className="text-white/40 text-sm mb-3">
        {orgs.length} verified local organization{orgs.length !== 1 ? 's' : ''}
        {focusTags ? <> matching your search</> : <> — every listing checked against
        the organization&apos;s own site</>}.
      </p>
      {groups.map((g) => (
        <div key={g.category} className="mb-4">
          <p className="text-[#d4a574]/80 text-xs uppercase tracking-widest mb-2">{g.category}</p>
          <div className="grid md:grid-cols-2 gap-3">
            {g.orgs.map((o) => (
              <div key={`${o.ein || 'noein'}-${o.name}`} className="border border-white/10 rounded-xl p-4 bg-black/40">
                <p className="text-white font-medium">{o.name}</p>
                {o.city && (
                  <p className="text-white/40 text-sm mt-0.5">{o.city}{o.zip ? `, ${o.zip}` : ''}</p>
                )}
                {(o.services || []).length > 0 && (
                  <p className="text-white/50 text-sm mt-1">
                    {Array.isArray(o.services) ? o.services.join(' · ') : o.services}
                  </p>
                )}
                {o.serves && <p className="text-white/40 text-xs mt-1">Serves: {o.serves}</p>}
                <div className="flex gap-4 mt-2 flex-wrap">
                  {o.url && <ExtLink href={o.url}>Website</ExtLink>}
                  {o.meetingListUrl && <ExtLink href={o.meetingListUrl}>Meeting list</ExtLink>}
                  {o.phone && (
                    <a href={`tel:${o.phone}`} className="inline-flex items-center gap-1 text-[#d4a574] text-sm font-medium hover:underline">
                      <Phone className="h-3.5 w-3.5" /> {o.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Licensed treatment facilities (SAMHSA roster layer).
// Data: SAMHSA's 2025 National Directories (2024 N-SUMHSS survey), slimmed
// per state and lazy-loaded by useFacilitiesForLocality() — see
// src/data/facilities.js and directory-data/facilities/source/PROVENANCE.md.
// Listed by level of care, filterable by Detox / Residential / Outpatient /
// Hospital inpatient / MAT / Medicaid. States with no directory facilities
// (e.g. American Samoa) render nothing.
export function FacilitiesSection({ locality, initialFilters }) {
  const [activeFilters, setActiveFilters] = useState(initialFilters || []);
  const { facilities: all, loading } = useFacilitiesForLocality(locality);
  if (!locality) return null;
  if (loading) {
    return (
      <div className="mt-8">
        <h4 className="text-white font-semibold mb-3">
          Licensed treatment facilities near {locality.city || locality.county}
        </h4>
        <p className="text-white/40 text-sm">Loading licensed facilities…</p>
      </div>
    );
  }
  if (all.length === 0) return null;
  const toggle = (key) =>
    setActiveFilters((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  const filtered = filterFacilities(all, activeFilters);
  const groups = groupFacilitiesByLevel(filtered);
  return (
    <div className="mt-8">
      <h4 className="text-white font-semibold mb-3">
        Licensed treatment facilities near {locality.city || locality.county}
      </h4>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide mb-4">
        <Filter className="h-4 w-4 text-[#d4a574] flex-shrink-0" />
        {FACILITY_FILTERS.map((f) => (
          <FilterPill
            key={f.key}
            value={f.label}
            current={activeFilters.includes(f.key) ? f.label : ''}
            onChange={() => toggle(f.key)}
          />
        ))}
        <span className="text-white/40 text-xs flex-shrink-0">
          {filtered.length} of {all.length} facilities
        </span>
      </div>
      {groups.length === 0 ? (
        <p className="text-white/40 text-sm">No facilities match those filters here.</p>
      ) : (
        groups.map((g) => (
          <div key={g.key} className="mb-4">
            <p className="text-[#d4a574]/80 text-xs uppercase tracking-widest mb-2">{g.label}</p>
            <div className="grid md:grid-cols-2 gap-3">
              {g.facilities.map((f) => (
                <div key={`${g.key}-${f.name}-${f.zip || ''}-${f.phone || ''}`} className="border border-white/10 rounded-xl p-4 bg-black/40">
                  <p className="text-white font-medium">{f.name}</p>
                  {f.name2 && f.name2 !== f.name && (
                    <p className="text-white/60 text-sm">{f.name2}</p>
                  )}
                  {f.closureNote && (
                    <p className="text-red-300 text-xs font-semibold mt-1 border border-red-400/30 bg-red-400/10 rounded-lg px-2 py-1">
                      {f.closureNote}
                    </p>
                  )}
                  {f.address && <p className="text-white/40 text-sm mt-1">{f.address}</p>}
                  {(f.city || f.zip) && (
                    <p className="text-white/40 text-sm mt-1">
                      {[f.city, f.state, f.zip].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {(f.services || []).length > 0 && (
                    <p className="text-white/50 text-sm mt-1">{f.services.join(' · ')}</p>
                  )}
                  <div className="flex gap-2 flex-wrap mt-2">
                    {f.mat && (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-[#d4a574]/10 text-[#d4a574] border-[#d4a574]/30">MAT</span>
                    )}
                    {(f.payment || []).map((p) => (
                      <span key={p} className="text-xs px-2 py-0.5 rounded-full border bg-white/5 text-white/50 border-white/10">{p}</span>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-2">
                    {f.url && <ExtLink href={f.url}>Website</ExtLink>}
                    {f.phone && (
                      <a href={`tel:${f.phone}`} className="inline-flex items-center gap-1 text-[#d4a574] text-sm font-medium hover:underline">
                        <Phone className="h-3.5 w-3.5" /> {f.phone}
                      </a>
                    )}
                  </div>
                  {(f.intakePhones || []).length > 0 && (
                    <p className="text-white/40 text-xs mt-2">Intake: {f.intakePhones.join(' · ')}</p>
                  )}
                  {(f.licenseSummary || []).length > 0 && (
                    <p className="text-white/30 text-xs mt-1">Licensed / accredited: {f.licenseSummary.join(' · ')}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
      <p className="text-white/30 text-xs leading-relaxed mt-2">
        Facility data: SAMHSA&apos;s 2024 National Substance Use and Mental Health
        Services Survey (N-SUMHSS), published in the 2025 National Directories of
        treatment facilities. Listed facilities were licensed, certified, or
        otherwise approved by their state agency as of that survey — a dated
        snapshot, not a live license check — and services may have changed, so
        please verify details when you contact a facility. The published
        directories do not include facility websites; where a facility&apos;s
        own website has been verified (currently Washington), a Website link
        appears on its card — everywhere else, phone is the fastest way to
        reach them.
      </p>
    </div>
  );
}

export function StateGatewaySet({ gateway, stateName }) {
  if (!gateway) {
    return (
      <div className="border border-white/10 rounded-xl p-4 bg-black/40">
        <p className="text-white/60 text-sm">
          Verified state gateway research for {stateName} is still being collected.
          Start with the national locators above, or find this state&apos;s agency in the{' '}
          <a
            href="https://www.samhsa.gov/grants/block-grants/subg/ssa-directory"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d4a574] hover:underline"
          >
            SAMHSA Single State Agencies directory
          </a>
          .
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="border border-[#d4a574]/20 rounded-xl p-4 bg-black/40">
        <p className="text-[#d4a574]/70 text-xs uppercase tracking-widest mb-1 flex items-center gap-1">
          <Landmark className="h-3.5 w-3.5" /> State agency
        </p>
        <ExtLink href={gateway.agency.url}>{gateway.agency.name}</ExtLink>
        {gateway.agency.phone && <p className="text-white/50 text-sm mt-1">Phone: {gateway.agency.phone}</p>}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="border border-white/10 rounded-xl p-4 bg-black/40">
          <p className="text-[#d4a574]/70 text-xs uppercase tracking-widest mb-1 flex items-center gap-1">
            <Home className="h-3.5 w-3.5" /> Recovery housing (NARR)
          </p>
          {gateway.narrAffiliate ? (
            <ExtLink href={gateway.narrAffiliate.url}>{gateway.narrAffiliate.name}</ExtLink>
          ) : (
            <p className="text-white/60 text-sm">No NARR affiliate listed for this state.</p>
          )}
          {gateway.narrNote && <p className="text-white/40 text-xs mt-2 leading-relaxed">{gateway.narrNote}</p>}
        </div>
        <div className="border border-white/10 rounded-xl p-4 bg-black/40">
          <p className="text-[#d4a574]/70 text-xs uppercase tracking-widest mb-1 flex items-center gap-1">
            <HeartHandshake className="h-3.5 w-3.5" /> Local help — 211
          </p>
          {gateway.two11 ? (
            <ExtLink href={gateway.two11.url}>{gateway.two11.name}</ExtLink>
          ) : (
            <p className="text-white/60 text-sm">Dial 2-1-1 from any phone.</p>
          )}
          {gateway.stateCrisis && (
            <p className="text-white/50 text-sm mt-3">
              State crisis line:{' '}
              <a href={gateway.stateCrisis.url} target="_blank" rel="noopener noreferrer" className="text-[#d4a574] hover:underline">
                {gateway.stateCrisis.name}
              </a>
              {gateway.stateCrisis.phone ? ` — ${gateway.stateCrisis.phone}` : ''}
            </p>
          )}
        </div>
      </div>
      {(gateway.peerOrgs?.length > 0 || gateway.countyDirectory || gateway.medicaidSud) && (
        <div className="border border-white/10 rounded-xl p-4 bg-black/40">
          <p className="text-[#d4a574]/70 text-xs uppercase tracking-widest mb-2 flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> More state gateways
          </p>
          <ul className="space-y-1.5">
            {(gateway.peerOrgs || []).map((p) => (
              <li key={p.url}><ExtLink href={p.url}>{p.name}</ExtLink></li>
            ))}
            {gateway.countyDirectory && (
              <li><ExtLink href={gateway.countyDirectory.url}>{gateway.countyDirectory.name}</ExtLink></li>
            )}
            {gateway.medicaidSud && (
              <li><ExtLink href={gateway.medicaidSud.url}>Medicaid substance-use coverage in {gateway.stateName}</ExtLink></li>
            )}
          </ul>
        </div>
      )}
      <p className="text-white/30 text-xs">State gateways verified {gateway.verifiedAt}.</p>
    </div>
  );
}


// RECOVERY MEETINGS — real schedules for the locality's county.
// NA: BMLT open meeting network (nationwide). AA: local A.A. service
// entities' public Meeting Guide feeds (partial coverage — rendered only
// where a feed exists, and labeled as feed data). Schedules change; the
// confirm-before-you-go note always renders with the lists.
const MEETING_CAP = 15;
export function MeetingsSection({ locality }) {
  const na = useNaMeetings(locality?.state, locality?.county);
  const aa = useAaMeetings(locality?.countyFips);
  if (!locality) return null;
  if (na.loading || aa.loading) {
    return (
      <div className="mt-8">
        <h4 className="text-white font-semibold mb-3">Recovery meetings in {locality.county}</h4>
        <p className="text-white/40 text-sm">Loading meeting schedules…</p>
      </div>
    );
  }
  if (na.meetings.length === 0 && aa.meetings.length === 0) return null;
  return (
    <div className="mt-8">
      <h4 className="text-white font-semibold mb-1">Recovery meetings in {locality.county}</h4>
      <p className="text-white/50 text-sm mb-4">
        Schedules change — confirm the day and time with the meeting&apos;s service body before you go.
      </p>
      {na.meetings.length > 0 && (
        <div className="mb-6">
          <p className="text-[#d4a574] text-sm font-semibold mb-2">
            Narcotics Anonymous — {na.meetings.length.toLocaleString()} meetings in this county
          </p>
          <div className="space-y-2">
            {na.meetings.slice(0, MEETING_CAP).map((m, i) => (
              <div key={`na-${i}`} className="border border-white/10 rounded-xl p-3 bg-black/40 text-sm">
                <span className="text-white font-medium">{m.weekday} {fmtTime(m.start_time)}</span>
                <span className="text-white/80"> — {m.name}</span>
                <span className="block text-white/40 text-xs mt-0.5">
                  {m.attendance === 'virtual' || (!m.in_person && m.attendance !== 'in-person')
                    ? 'Online meeting'
                    : [m.location_name, m.street, m.city].filter(Boolean).join(', ') || 'In person'}
                  {m.service_body ? ` · ${m.service_body}` : ''}
                </span>
              </div>
            ))}
          </div>
          {na.meetings.length > MEETING_CAP && (
            <p className="text-white/40 text-xs mt-2">
              Showing {MEETING_CAP} of {na.meetings.length.toLocaleString()} — the full, always-current NA
              schedule for this area is in the NA meeting search linked in the national locators above.
            </p>
          )}
        </div>
      )}
      {aa.meetings.length > 0 && (
        <div>
          <p className="text-[#d4a574] text-sm font-semibold mb-2">
            Alcoholics Anonymous — {aa.meetings.length.toLocaleString()} meetings in this county
          </p>
          <div className="space-y-2">
            {aa.meetings.slice(0, MEETING_CAP).map((m, i) => (
              <div key={`aa-${i}`} className="border border-white/10 rounded-xl p-3 bg-black/40 text-sm">
                <span className="text-white font-medium">
                  {AA_DAYS[m.day] || ''} {m.time_formatted || fmtTime(m.time)}
                </span>
                <span className="text-white/80"> — {m.name}</span>
                <span className="block text-white/40 text-xs mt-0.5">
                  {m.conference_url && !m.formatted_address
                    ? 'Online meeting'
                    : [m.location, m.formatted_address].filter(Boolean).join(' — ') || 'See the local A.A. meeting list'}
                </span>
              </div>
            ))}
          </div>
          {aa.meetings.length > MEETING_CAP && (
            <p className="text-white/40 text-xs mt-2">
              Showing {MEETING_CAP} of {aa.meetings.length.toLocaleString()} — from the local A.A. service
              entity&apos;s public Meeting Guide feed.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// HEALTH CENTERS — HRSA federally funded clinic sites in the county
// (sliding-scale primary care). Federal public-domain data; the source
// line always renders with the list.
const HEALTH_CAP = 15;
export function HealthCentersSection({ locality }) {
  const { sites, loading } = useHealthCenters(locality?.state, locality?.countyFips, locality?.county);
  if (!locality || loading) return null;
  if (!sites || sites.length === 0) return null;
  return (
    <div className="mt-8">
      <h4 className="text-white font-semibold mb-1">
        Health centers in {locality.county} — {sites.length.toLocaleString()}
      </h4>
      <p className="text-white/50 text-sm mb-4">
        Federally funded health centers provide primary care on a sliding scale based on income, regardless
        of ability to pay. Data: HRSA (U.S. Health Resources &amp; Services Administration), retrieved
        2026-10-22.
      </p>
      <div className="grid md:grid-cols-2 gap-3">
        {sites.slice(0, HEALTH_CAP).map((s, i) => (
          <div key={`hc-${i}`} className="border border-white/10 rounded-xl p-4 bg-black/40">
            <p className="text-white font-medium leading-snug mb-1">{s.name}</p>
            <p className="text-white/40 text-xs mb-1">
              {[s.address, s.city, s.zip].filter(Boolean).join(', ')}
            </p>
            {s.phone && (
              <p className="text-white/60 text-sm inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {s.phone}
              </p>
            )}
            {s.locationType && s.locationType !== 'Permanent' && (
              <span className="ml-2 text-[11px] uppercase tracking-wider text-white/40 border border-white/15 rounded-full px-2 py-0.5">
                {s.locationType}
              </span>
            )}
          </div>
        ))}
      </div>
      {sites.length > HEALTH_CAP && (
        <p className="text-white/40 text-xs mt-3">
          Showing {HEALTH_CAP} of {sites.length.toLocaleString()} health center sites in this county.
        </p>
      )}
    </div>
  );
}

// IRS REGISTRY TIER — every registered nonprofit in the county, straight
// from IRS federal records (src/data/registry.js). Deliberately rendered as
// a lesser tier than the verified listings: no service claims, no vetting
// badges, the registry disclaimer always attached, list capped with the
// total shown. Gives every county in the country a real starting point
// while the verified layer is built county by county.
const REGISTRY_CAP = 100;
export function RegistrySection({ locality }) {
  const { data, loading } = useCountyRegistry(locality?.state, locality?.county);
  if (!locality) return null;
  if (loading) {
    return (
      <div className="mt-8">
        <h4 className="text-white font-semibold mb-3">Registered organizations in {locality.county}</h4>
        <p className="text-white/40 text-sm">Loading the federal registry for this county…</p>
      </div>
    );
  }
  if (!data || !data.orgs || data.orgs.length === 0) return null;
  const orgs = data.orgs;
  const shown = orgs.slice(0, REGISTRY_CAP);
  const catCounts = new Map();
  for (const o of orgs) {
    const c = o.category || 'Unknown / Not Classified';
    catCounts.set(c, (catCounts.get(c) || 0) + 1);
  }
  const topCats = [...catCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
        <h4 className="text-white font-semibold">Registered organizations in {locality.county}</h4>
        <span className="text-[11px] uppercase tracking-wider text-white/40 border border-white/15 rounded-full px-2 py-0.5">
          IRS registry — not individually verified
        </span>
      </div>
      <p className="text-white/50 text-sm mb-3">
        {orgs.length.toLocaleString()} registered organizations in this county.{' '}
        {data.presentation ||
          'Name, city and category from IRS federal records. This tier has not been individually verified — registration is a public record, not an endorsement, and services are not confirmed at this tier.'}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {topCats.map(([c, n]) => (
          <span key={c} className="text-xs text-white/50 bg-white/5 border border-white/10 rounded-full px-2.5 py-1">
            {c} · {n.toLocaleString()}
          </span>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
        {shown.map((o, i) => (
          <div key={`${o.ein}-${i}`} className="text-sm border-b border-white/5 pb-1.5">
            <span className="text-white/80">{o.name}</span>
            <span className="text-white/40">
              {' '}— {[o.city, o.zip].filter(Boolean).join(' ')} · {o.category}
            </span>
          </div>
        ))}
      </div>
      {orgs.length > REGISTRY_CAP && (
        <p className="text-white/40 text-xs mt-3">
          Showing the first {REGISTRY_CAP} of {orgs.length.toLocaleString()}, alphabetically. The verified
          listings in this directory — checked against each organization&apos;s own site and screened — are
          the ones to contact first.
        </p>
      )}
    </div>
  );
}

// The resolved-locality panel: state gateways, national locators opened
// for the area, the county organization layer, and licensed facilities.
// `locality` is the gazetteer-shaped object produced by searchLocalities()
// or by the State/County/City selections in LocalityFinder.
export function LocalityPanel({ locality, onReset, focus }) {
  if (!locality) return null;
  const gateway = stateGatewayByAbbr[locality.state] || null;
  const stateName =
    ALL_STATES_AND_TERRITORIES.find((s) => s.abbr === locality.state)?.name || locality.state;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
      <div className="border border-[#d4a574]/30 rounded-2xl p-6 bg-[#0d0d00]">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-1">
          <h3 className="text-xl font-semibold text-white">
            {locality.match === 'county'
              ? `${locality.county}, ${stateName}`
              : `${locality.city ? `${locality.city}, ` : ''}${stateName}`}
          </h3>
          {onReset && (
            <button onClick={onReset} className="text-[#d4a574] text-sm hover:underline">
              Search a different place
            </button>
          )}
        </div>
        <p className="text-white/50 text-sm mb-6">
          {locality.county}
          {locality.match !== 'county' && locality.zip ? ` · ZIP ${locality.zip}` : ''}
          {locality.match !== 'zip' && locality.zipCount ? ` · ${locality.zipCount} ZIP codes in this ${locality.match}` : ''}
        </p>

        <h4 className="text-white font-semibold mb-3">{stateName} gateways</h4>
        <StateGatewaySet gateway={gateway} stateName={stateName} />

        <h4 className="text-white font-semibold mt-8 mb-3">National locators for this area</h4>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {nationalEntries
            .filter((e) => e.locator)
            .map((e) => {
              const href = locatorUrl(e, locality);
              const prefilled = isPrefilled(e, locality);
              return (
                <div key={e.name} className="border border-white/10 rounded-xl p-4 bg-black/40">
                  <p className="text-white font-medium leading-snug mb-1">{e.name}</p>
                  <p className="text-white/40 text-xs mb-2">
                    {prefilled
                      ? `Opens results for ${locality.city || locality.county || locality.zip}.`
                      : 'Opens the locator — enter your ZIP code there.'}
                  </p>
                  <ExtLink href={href}>Open locator</ExtLink>
                </div>
              );
            })}
        </div>

        <CountyOrgsSection locality={locality} onlyTags={focus?.tags} />

        <MeetingsSection locality={locality} />

        <RegistrySection locality={locality} />

        <FacilitiesSection
          key={focus ? `focus-${(focus.facilityFilters || []).join(',')}` : 'all'}
          locality={locality}
          initialFilters={focus?.facilityFilters}
        />

        <HealthCentersSection locality={locality} />
      </div>
    </motion.div>
  );
}
