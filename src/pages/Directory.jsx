import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search, ExternalLink, Phone, MapPin, AlertTriangle, Filter,
  Building2, Home, Users, Globe, ShieldAlert, Landmark, HeartHandshake,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  crisisResources, nationalCategories, nationalEntries, TAXONOMY, US_STATES, TERRITORIES,
} from '@/data/directory';
import { stateGateways, stateGatewayByAbbr } from '@/data/states';
import { loadGazetteer, searchLocalities } from '@/data/gazetteer';
import { useCountyOrgs } from '@/data/orgs';
import { locatorUrl, isPrefilled } from '@/data/locators';
import { facilitiesForLocality, filterFacilities, groupFacilitiesByLevel, FACILITY_FILTERS } from '@/data/facilities';

const ALL_STATES_AND_TERRITORIES = [...US_STATES, ...TERRITORIES];

function FilterPill({ value, current, onChange }) {
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

function ExtLink({ href, children, className = '' }) {
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
function CountyOrgsSection({ locality }) {
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
        {orgs.length} verified local organizations — every listing checked against
        the organization&apos;s own site.
      </p>
      {groups.map((g) => (
        <div key={g.category} className="mb-4">
          <p className="text-[#d4a574]/80 text-xs uppercase tracking-widest mb-2">{g.category}</p>
          <div className="grid md:grid-cols-2 gap-3">
            {g.orgs.map((o) => (
              <div key={o.ein || o.name} className="border border-white/10 rounded-xl p-4 bg-black/40">
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

// Licensed treatment facilities (SAMHSA roster layer) — INTEGRATION SEAM.
// Data arrives per-state from directory-data/facilities/<ST>.json after the
// supervisor's provenance + QC handover (see src/data/facilities.js); until
// then facilitiesForLocality() returns [] and this section renders nothing.
// When data is present: listed by level of care, filterable by
// Detox / Residential / Outpatient / MAT / Medicaid.
function FacilitiesSection({ locality }) {
  const [activeFilters, setActiveFilters] = useState([]);
  const all = facilitiesForLocality(locality);
  if (!locality || all.length === 0) return null;
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
                <div key={`${g.key}-${f.name}-${f.zip || ''}`} className="border border-white/10 rounded-xl p-4 bg-black/40">
                  <p className="text-white font-medium">{f.name}</p>
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
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function StateGatewaySet({ gateway, stateName }) {
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

export default function DirectoryPage() {
  // National directory filters (taxonomy is the canonical filter set)
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('All');

  // Locality search
  const [locQuery, setLocQuery] = useState('');
  const [locResults, setLocResults] = useState(null); // null = not searched yet
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [locality, setLocality] = useState(null);

  // State browse
  const [stateSearch, setStateSearch] = useState('');
  const [stateSelect, setStateSelect] = useState('All');

  const filteredNational = useMemo(
    () =>
      nationalCategories
        .map((c) => ({
          ...c,
          entries: c.entries.filter((e) => {
            const matchSearch =
              e.name.toLowerCase().includes(search.toLowerCase()) ||
              e.description.toLowerCase().includes(search.toLowerCase());
            const matchTag = tag === 'All' || (e.tags || []).includes(tag);
            return matchSearch && matchTag;
          }),
        }))
        .filter((c) => c.entries.length > 0),
    [search, tag],
  );
  const nationalCount = filteredNational.reduce((n, c) => n + c.entries.length, 0);

  const runLocalitySearch = async (e) => {
    if (e) e.preventDefault();
    const q = locQuery.trim();
    if (!q) return;
    setLocLoading(true);
    setLocError('');
    setLocality(null);
    try {
      const gaz = await loadGazetteer();
      const results = searchLocalities(gaz, q);
      setLocResults(results);
      if (results.length === 1) setLocality(results[0]);
    } catch {
      setLocError('Local search data could not be loaded. Please try again — the national and state directories below work without it.');
      setLocResults([]);
    } finally {
      setLocLoading(false);
    }
  };

  const filteredStates = useMemo(
    () =>
      ALL_STATES_AND_TERRITORIES.filter((s) => {
        const matchSearch =
          s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
          s.abbr.toLowerCase() === stateSearch.toLowerCase();
        const matchSelect = stateSelect === 'All' || s.abbr === stateSelect;
        return matchSearch && matchSelect;
      }),
    [stateSearch, stateSelect],
  );

  const localityGateway = locality ? stateGatewayByAbbr[locality.state] : null;
  const localityStateName =
    ALL_STATES_AND_TERRITORIES.find((s) => s.abbr === locality?.state)?.name || locality?.state;

  return (
    <div className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative py-24 px-6 bg-gradient-to-br from-black via-[#0d0d00] to-black overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-72 h-72 bg-[#d4a574] rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-[#d4a574] font-medium tracking-widest text-sm uppercase">Nationwide Directory</span>
            <h1 className="text-4xl md:text-6xl font-light text-white mt-4 mb-4">
              Recovery Resource <span className="font-semibold text-[#d4a574]">Directory</span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Crisis lines, national treatment and meeting locators, and the official
              recovery gateway for every state — searchable by ZIP code, city, or county.
            </p>
            <p className="text-white/40 text-sm mt-4">
              {crisisResources.length} crisis resources · {nationalEntries.length} national locators ·{' '}
              {stateGateways.length} of {ALL_STATES_AND_TERRITORIES.length} states &amp; territories with verified gateways
            </p>
          </motion.div>
        </div>
      </section>

      {/* Crisis — pinned first, visually distinct */}
      <section className="px-6 py-10 bg-red-950/30 border-y border-red-500/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="h-6 w-6 text-red-400" />
            <h2 className="text-2xl font-semibold text-white">In crisis right now?</h2>
          </div>
          <p className="text-white/60 mb-6 max-w-3xl">
            If someone is in immediate danger, call <span className="text-white font-semibold">911</span>.
            For a mental-health or substance-use crisis, these lines are free, confidential, and answered by people:
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {crisisResources.map((c) => (
              <Card key={c.name} className="border border-red-500/30 bg-black/60">
                <CardContent className="p-5">
                  <h3 className="text-white font-semibold leading-snug mb-2">{c.name}</h3>
                  <p className="text-red-300 font-semibold text-sm mb-2">{c.phoneLabel}</p>
                  <p className="text-white/50 text-sm leading-relaxed mb-3">{c.description}</p>
                  <ExtLink href={c.url}>Visit site</ExtLink>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Locality search */}
      <section className="px-6 py-12 border-b border-[#d4a574]/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="h-6 w-6 text-[#d4a574]" />
            <h2 className="text-2xl font-semibold text-white">Find help near you</h2>
          </div>
          <p className="text-white/50 mb-6 max-w-3xl">
            Enter a ZIP code, a city, or a county — we&apos;ll show that place&apos;s state
            gateways and open the national locators for that area where a locator
            supports it.
          </p>
          <form onSubmit={runLocalitySearch} className="flex gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
              <Input
                value={locQuery}
                onChange={(e) => setLocQuery(e.target.value)}
                placeholder="ZIP code, city, or county — e.g. 98402, Tacoma, Pierce County"
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 focus:border-[#d4a574]"
              />
            </div>
            <button
              type="submit"
              className="bg-[#d4a574] hover:bg-[#c49464] text-black font-semibold rounded-lg px-6 h-11 transition-colors"
            >
              {locLoading ? 'Searching…' : 'Search'}
            </button>
          </form>

          {locError && <p className="text-red-300 text-sm mt-4">{locError}</p>}

          {locResults !== null && locResults.length === 0 && !locError && (
            <p className="text-white/40 mt-4">
              No place matched &ldquo;{locQuery}&rdquo;. Check the spelling, or try a ZIP code.
            </p>
          )}

          {locResults && locResults.length > 1 && !locality && (
            <div className="mt-6 space-y-2 max-w-2xl">
              <p className="text-white/40 text-sm">Several places match — choose yours:</p>
              {locResults.map((r) => (
                <button
                  key={`${r.match}-${r.city}-${r.county}-${r.state}`}
                  onClick={() => setLocality(r)}
                  className="block w-full text-left border border-white/10 hover:border-[#d4a574]/50 rounded-xl px-4 py-3 bg-white/5 transition-colors"
                >
                  <span className="text-white font-medium">
                    {r.match === 'county' ? r.county : r.city}, {r.state}
                  </span>
                  <span className="text-white/40 text-sm">
                    {' '}· {r.match === 'county' ? `${r.zipCount} ZIP codes` : r.county}
                    {r.match === 'zip' ? ` · ZIP ${r.zip}` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}

          {locality && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
              <div className="border border-[#d4a574]/30 rounded-2xl p-6 bg-[#0d0d00]">
                <div className="flex flex-wrap items-baseline justify-between gap-3 mb-1">
                  <h3 className="text-xl font-semibold text-white">
                    {locality.city ? `${locality.city}, ` : ''}{localityStateName}
                  </h3>
                  <button onClick={() => { setLocality(null); setLocResults(null); }} className="text-[#d4a574] text-sm hover:underline">
                    Search a different place
                  </button>
                </div>
                <p className="text-white/50 text-sm mb-6">
                  {locality.county}
                  {locality.zip ? ` · ZIP ${locality.zip}` : ''}
                  {locality.match !== 'zip' && locality.zipCount ? ` · ${locality.zipCount} ZIP codes in this ${locality.match}` : ''}
                </p>

                <h4 className="text-white font-semibold mb-3">{localityStateName} gateways</h4>
                <StateGatewaySet gateway={localityGateway} stateName={localityStateName} />

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

                <CountyOrgsSection locality={locality} />

                <FacilitiesSection locality={locality} />
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Search & taxonomy filters for the national directory */}
      <section className="sticky top-[80px] z-30 bg-black/95 backdrop-blur border-b border-[#d4a574]/10 px-6 py-4">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search national resources..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 focus:border-[#d4a574]"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Filter className="h-4 w-4 text-[#d4a574] flex-shrink-0" />
            <span className="text-white/40 text-xs flex-shrink-0">Service:</span>
            <FilterPill value="All" current={tag} onChange={setTag} />
            {TAXONOMY.map((t) => (
              <FilterPill key={t} value={t} current={tag} onChange={setTag} />
            ))}
          </div>
        </div>
      </section>

      {/* National directory */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-white/40 text-sm mb-6">
            {nationalCount} national resource{nationalCount !== 1 ? 's' : ''}
          </p>
          {nationalCount === 0 ? (
            <div className="text-center py-24">
              <Globe className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40 text-lg">No national resources match your filters.</p>
              <button
                onClick={() => { setSearch(''); setTag('All'); }}
                className="mt-4 text-[#d4a574] text-sm hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filteredNational.map((c) => (
              <div key={c.category} className="mb-10">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#d4a574]" /> {c.category}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {c.entries.map((e, i) => (
                    <motion.div key={e.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <Card className="h-full border border-[#d4a574]/20 bg-[#0d0d00] hover:border-[#d4a574]/50 transition-all duration-300">
                        <CardContent className="p-6 flex flex-col h-full">
                          <h3 className="text-white font-semibold mb-2 leading-snug">{e.name}</h3>
                          <p className="text-white/50 text-sm leading-relaxed flex-1 mb-4">{e.description}</p>
                          {(e.tags || []).length > 0 && (
                            <div className="flex gap-2 flex-wrap mb-4">
                              {e.tags.map((t) => (
                                <span key={t} className="text-xs px-2 py-0.5 rounded-full border bg-[#d4a574]/10 text-[#d4a574] border-[#d4a574]/30">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[#d4a574]/60 text-xs">{c.category}</span>
                            <ExtLink href={e.url} className="flex-shrink-0">Visit</ExtLink>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* State-by-state browse */}
      <section className="py-12 px-6 border-t border-[#d4a574]/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-semibold text-white mb-2">State-by-state gateways</h2>
          <p className="text-white/50 mb-6 max-w-3xl">
            Every state&apos;s official substance-use agency, its NARR recovery-housing
            affiliate where one exists, and its 211. States marked &ldquo;pending&rdquo; are
            still being verified — their agencies are in the SAMHSA directory linked above.
          </p>
          <div className="flex flex-col md:flex-row gap-3 mb-8 max-w-3xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
              <Input
                value={stateSearch}
                onChange={(e) => setStateSearch(e.target.value)}
                placeholder="Search states..."
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11 focus:border-[#d4a574]"
              />
            </div>
            <select
              value={stateSelect}
              onChange={(e) => setStateSelect(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded-lg h-11 px-3 focus:border-[#d4a574] outline-none"
              aria-label="Select a state"
            >
              <option value="All" className="bg-black">All states &amp; territories</option>
              {ALL_STATES_AND_TERRITORIES.map((s) => (
                <option key={s.abbr} value={s.abbr} className="bg-black">
                  {s.name} ({s.abbr})
                </option>
              ))}
            </select>
          </div>

          <p className="text-white/40 text-sm mb-6">
            {filteredStates.length} state{filteredStates.length !== 1 ? 's' : ''} shown ·{' '}
            {stateGateways.length} with verified gateways
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStates.map((s) => {
              const g = stateGatewayByAbbr[s.abbr];
              return (
                <Card key={s.abbr} className="h-full border border-[#d4a574]/20 bg-[#0d0d00]">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold text-lg">{s.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-white/5 text-white/50 border-white/10">{s.abbr}</span>
                    </div>
                    {g ? (
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-[#d4a574]/70 text-xs uppercase tracking-widest mb-1">Agency</p>
                          <ExtLink href={g.agency.url}>{g.agency.name}</ExtLink>
                          {g.agency.phone && <p className="text-white/40 text-xs mt-0.5">{g.agency.phone}</p>}
                        </div>
                        <div>
                          <p className="text-[#d4a574]/70 text-xs uppercase tracking-widest mb-1">Recovery housing</p>
                          {g.narrAffiliate ? (
                            <ExtLink href={g.narrAffiliate.url}>{g.narrAffiliate.name} (NARR affiliate)</ExtLink>
                          ) : (
                            <p className="text-white/50">No NARR affiliate listed</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[#d4a574]/70 text-xs uppercase tracking-widest mb-1">Local help</p>
                          {g.two11 ? (
                            <ExtLink href={g.two11.url}>{g.two11.name}</ExtLink>
                          ) : (
                            <p className="text-white/50">Dial 2-1-1</p>
                          )}
                        </div>
                        <p className="text-white/30 text-xs pt-1">Verified {g.verifiedAt}</p>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <p className="text-white/50 leading-relaxed">
                          Gateway research pending verification.
                        </p>
                        <p className="text-white/40 mt-2 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-[#d4a574]/60 flex-shrink-0 mt-0.5" />
                          Use the national locators above, or this state&apos;s agency in the SAMHSA directory.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Honest scope note */}
      <section className="px-6 pb-16">
        <div className="max-w-7xl mx-auto border border-white/10 rounded-2xl p-6 bg-white/[0.02]">
          <p className="text-white/40 text-sm leading-relaxed">
            About this directory: it lists crisis lines, national locators, and official
            state gateways — not individual facilities, because facility details change
            faster than any directory can re-verify them. Every link here was checked
            against the organization&apos;s own site when the directory was built. If a
            link has gone stale, please tell us through the Contact page.
          </p>
        </div>
      </section>
    </div>
  );
}
