import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, AlertTriangle, Filter, Building2, Globe, ShieldAlert,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  crisisResources, nationalCategories, nationalEntries, TAXONOMY, US_STATES, TERRITORIES,
} from '@/data/directory';
import { stateGateways, stateGatewayByAbbr } from '@/data/states';
import { FilterPill, ExtLink, ALL_STATES_AND_TERRITORIES } from '@/components/directory-sections';
import LocalityFinder from '@/components/LocalityFinder';

export default function DirectoryPage() {
  // National directory filters (taxonomy is the canonical filter set)
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('All');

  // State browse
  const [stateSearch, setStateSearch] = useState('');
  const [stateSelect, setStateSelect] = useState('All');

  // Facility roster counts (SAMHSA stats, lazy-loaded for the hero line)
  const [facStats, setFacStats] = useState(null);
  useEffect(() => {
    let live = true;
    fetch('/data/facilities-stats.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => { if (live) setFacStats(s); })
      .catch(() => {});
    return () => { live = false; };
  }, []);

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
              {facStats && (
                <> · {facStats.uniqueFacilities.toLocaleString()} licensed treatment facilities (SAMHSA {facStats.dataYear} survey)</>
              )}
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

      <LocalityFinder />

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
          <div className="flex items-center gap-2 flex-wrap pb-1">
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
            About this directory: it lists crisis lines, national locators, official
            state gateways, and licensed treatment facilities from SAMHSA&apos;s 2024
            facility survey (published in the 2025 National Directories). Facility
            services and licensure are as reported in that survey and may have
            changed — verify when you contact a facility. Every gateway and
            organization link here was checked against the organization&apos;s own
            site when the directory was built. If a link has gone stale, please tell
            us through the Contact page.
          </p>
        </div>
      </section>
    </div>
  );
}
