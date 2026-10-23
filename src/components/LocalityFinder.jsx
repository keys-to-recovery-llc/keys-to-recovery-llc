// LocalityFinder — the front door to the resource database, shared by
// the Directory page and the Resources page.
//
// Forefront (owner directive, 2026-10-22): a plain-language search box.
// The visitor types what they need plus where they are — city, state,
// and/or ZIP in the same sentence ("detox in Tacoma, WA 98402", "food
// bank near Puyallup", "AA meetings in Pierce County") — and the finder
// resolves the need and the place against this site's own verified
// database (Census gazetteer localities, vetted county organizations,
// the SAMHSA licensed-facility roster, state gateways, national
// locators) and pulls the matching resources. All matching runs locally
// in the visitor's browser over that verified data: nothing typed here
// is sent anywhere, and nothing is listed that the directory itself
// doesn't carry as verified.
//
// Below the search box, the structured State → County → City selections
// cascade as an alternative path to the same results. Either way the
// answer renders through the shared LocalityPanel, so every surface
// shows exactly the same information for a place.
import React, { useState, useMemo } from 'react';
import { Search, MapPin, Sparkles, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { loadGazetteer, searchLocalities } from '@/data/gazetteer';
import { crisisResources } from '@/data/directory';
import { LocalityPanel, ExtLink, ALL_STATES_AND_TERRITORIES } from '@/components/directory-sections';

const selectClass =
  'w-full bg-white/5 border border-white/10 text-white rounded-lg h-11 px-3 focus:border-[#d4a574] outline-none disabled:opacity-40';

// Plain-language need rules. Each rule maps everyday words to the
// directory's canonical taxonomy tags and/or facility-roster filters.
// Tags must match src/data/directory.js TAXONOMY exactly; facility keys
// must match FACILITY_FILTERS in src/data/facilities.js.
const NEED_RULES = [
  { label: 'Crisis help', crisis: true, tags: ['Crisis & Helplines'], patterns: [/\bsuicid/, /\bcrisis\b/, /\boverdose/, /\bnaloxone\b/, /\bnarcan\b/, /\brelaps/] },
  { label: 'Detox', tags: ['Treatment & Detox'], facility: ['detox'], patterns: [/\bdetox\b/, /\bwithdrawal\b/] },
  { label: 'Treatment', tags: ['Treatment & Detox'], facility: [], patterns: [/\btreatment\b/, /\brehab\b/, /\baddiction\b/, /\bsubstance\b/, /\bdrug\b/, /\balcohol treatment\b/] },
  { label: 'Residential treatment', tags: ['Treatment & Detox'], facility: ['residential'], patterns: [/\bresidential\b/, /\binpatient\b/] },
  { label: 'Outpatient treatment', tags: ['Treatment & Detox'], facility: ['outpatient'], patterns: [/\boutpatient\b/, /\biop\b/] },
  { label: 'Medication-assisted treatment (MAT)', tags: ['Treatment & Detox'], facility: ['mat'], patterns: [/\bmat\b/, /\bsuboxone\b/, /\bmethadone\b/, /\bbuprenorphine\b/, /\bnaltrexone\b/, /\bvivitrol\b/] },
  { label: 'Medicaid providers', tags: [], facility: ['medicaid'], patterns: [/\bmedicaid\b/, /\bapple health\b/] },
  { label: 'Recovery housing / sober living', tags: ['Recovery Housing / Sober Living'], patterns: [/\bsober living\b/, /\brecovery housing\b/, /\bhalfway house/, /\boxford house/, /\bhousing\b/, /\bsober home/] },
  { label: 'AA meetings', tags: ['AA Meetings'], patterns: [/\baa\b/, /\balcoholics anonymous\b/] },
  { label: 'NA meetings', tags: ['NA Meetings'], patterns: [/\bna meetings?\b/, /\bnarcotics anonymous\b/] },
  { label: 'Peer support & other meetings', tags: ['Other Recovery Meetings & Peer Support'], patterns: [/\bpeer support\b/, /\bsmart recovery\b/, /\bcelebrate recovery\b/, /\bmeetings?\b/] },
  { label: 'Showers & hygiene', tags: ['Showers & Hygiene'], patterns: [/\bshowers?\b/, /\bhygiene\b/, /\blaundry\b/] },
  { label: 'Food banks & meals', tags: ['Food Banks & Meals'], patterns: [/\bfood\b/, /\bmeals?\b/, /\bgroceries\b/, /\bpantry\b/, /\bhungry\b/] },
  { label: 'Churches & faith-based support', tags: ['Churches & Faith-Based Support'], patterns: [/\bchurch/, /\bfaith\b/, /\bministry\b/, /\bpastor\b/] },
  { label: 'Emergency shelter', tags: ['Emergency Shelter'], patterns: [/\bshelter\b/, /\bhomeless\b/, /\bbed tonight\b/, /\bnowhere to sleep\b/] },
  { label: 'Rental assistance', tags: ['Rental Assistance'], patterns: [/\brent\b/, /\brental\b/, /\beviction\b/, /\bdeposit\b/] },
  { label: 'Utility bill assistance', tags: ['Utility Bill Assistance'], patterns: [/\butilit/, /\belectric\b/, /\bpower bill\b/, /\bheating\b/, /\bwater bill\b/] },
  { label: 'Gas vouchers', tags: ['Gas Vouchers'], patterns: [/\bgas voucher/, /\bfuel voucher/, /\bgas money\b/] },
  { label: 'Bus tickets & transportation', tags: ['Bus Tickets & Transportation Help'], patterns: [/\bbus\b/, /\btransportation\b/, /\bride\b/, /\btransit\b/] },
  { label: 'Employment help', tags: ['Employment Help'], patterns: [/\bjob/, /\bemployment\b/, /\bwork\b/, /\bcareer\b/] },
  { label: 'Reentry support', tags: ['Reentry Support (post-incarceration)'], patterns: [/\breentry\b/, /\bjail\b/, /\bprison\b/, /\bincarcerat/, /\bprobation\b/, /\bparole\b/, /\bfelony\b/] },
  { label: 'Family support', tags: ['Family Support'], patterns: [/\bfamily\b/, /\bchildren\b/, /\bkids\b/, /\bparent/] },
  { label: 'Veterans services', tags: ['Veterans Services'], patterns: [/\bveteran/, /\bva benefits\b/, /\bmilitary\b/] },
  { label: 'Benefits & ID help', tags: ['Benefits & ID Help'], patterns: [/\bbenefits\b/, /\bid card\b/, /\bdriver'?s license\b/, /\bsocial security\b/, /\bsnap\b/, /\bebt\b/] },
  { label: 'Clothing & household goods', tags: ['Clothing & Household Goods'], patterns: [/\bclothing\b/, /\bclothes\b/, /\bfurniture\b/, /\bhousehold\b/] },
  { label: 'Legal aid', tags: ['Legal Aid'], patterns: [/\blegal\b/, /\blawyer\b/, /\battorney\b/, /\bcourt\b/] },
];

function parseNeeds(text) {
  const t = ` ${text.toLowerCase()} `;
  const matched = NEED_RULES.filter((r) => r.patterns.some((p) => p.test(t)));
  return {
    labels: matched.map((r) => r.label),
    tags: [...new Set(matched.flatMap((r) => r.tags || []))],
    facilityFilters: [...new Set(matched.flatMap((r) => r.facility || []))],
    crisis: matched.some((r) => r.crisis),
  };
}

// Resolve the place inside a free-text request. Returns one of:
//   { locality }          — one confident match
//   { candidates: [...] } — the same place name in several states
//   { stateOnly: abbr }   — only a state was named
//   {}                    — no place recognized
function extractPlace(gaz, text) {
  const zipMatch = text.match(/\b\d{5}\b/);
  if (zipMatch && gaz.byZip.has(zipMatch[0])) {
    return { locality: { ...gaz.byZip.get(zipMatch[0]), match: 'zip', zipCount: 1 } };
  }
  const t = ` ${text.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ')} `;
  // State hint, two safe routes only: an UPPERCASE two-letter token in the
  // original text ("Tacoma, WA"), or a full state name. Never match a
  // lowercase abbreviation — "in" is a preposition before it is Indiana,
  // "or" a conjunction before it is Oregon (caught in pre-launch tests:
  // "AA meetings in Pierce County" resolved to Indiana).
  let stateHint = null;
  const abbrTokens = text.match(/\b[A-Z]{2}\b/g) || [];
  for (const tok of abbrTokens) {
    if (ALL_STATES_AND_TERRITORIES.some((s) => s.abbr === tok)) {
      stateHint = tok;
      break;
    }
  }
  if (!stateHint) {
    // A lowercase abbreviation counts only where an address puts it:
    // after a comma ("Tacoma, wa …") or at the very end ("…pierce county wa").
    const m =
      text.match(/,\s*([A-Za-z]{2})\b/) || text.toLowerCase().match(/[\s,]([a-z]{2})\s*$/);
    if (m && ALL_STATES_AND_TERRITORIES.some((s) => s.abbr === m[1].toUpperCase())) {
      stateHint = m[1].toUpperCase();
    }
  }
  if (!stateHint) {
    for (const s of ALL_STATES_AND_TERRITORIES) {
      if (t.includes(` ${s.name.toLowerCase()} `)) {
        stateHint = s.abbr;
        break;
      }
    }
  }
  // City matches (longest name wins; collect every state it appears in)
  let bestCity = null;
  for (const [key, zips] of gaz.byCity) {
    const [city, st] = key.split('|');
    if (stateHint && st !== stateHint) continue;
    if (city.length >= 3 && t.includes(` ${city} `)) {
      if (!bestCity || city.length > bestCity.city.length) {
        bestCity = { city, states: new Map([[st, zips]]) };
      } else if (city === bestCity.city) {
        bestCity.states.set(st, zips);
      }
    }
  }
  // County matches, grouped by base name across states (proper-case
  // county name comes from the ZIP records — the map keys are lowercase)
  let bestCounty = null;
  for (const [key, zips] of gaz.byCounty) {
    const [county, st] = key.split('|');
    if (stateHint && st !== stateHint) continue;
    const base = county.replace(/\s+(county|parish|borough|census area|municipality|municipio)$/, '');
    if (base.length >= 3 && t.includes(` ${base} `)) {
      const entry = {
        countyName: zips[0]?.county || county,
        countyFips: zips[0]?.countyFips || null,
        zips,
      };
      if (!bestCounty || base.length > bestCounty.base.length) {
        bestCounty = { base, states: new Map([[st, entry]]) };
      } else if (base === bestCounty.base) {
        bestCounty.states.set(st, entry);
      }
    }
  }
  const countyLocalityOf = (st, entry) => ({
    zip: entry.zips[0]?.zip || null,
    city: entry.zips[0]?.city || null,
    state: st,
    county: entry.countyName,
    countyFips: entry.countyFips,
    match: 'county',
    zipCount: entry.zips.length,
  });
  // "Pierce County" typed out in full means the county, even when a city
  // shares the name (Pierce is a city in NE/CO/ID and a county in WA/WI/…)
  const explicitCounty = bestCounty
    ? new RegExp(` ${bestCounty.base} (county|parish|borough|census area) `).test(t)
    : false;
  if (bestCounty && (explicitCounty || !bestCity || bestCounty.base.length > bestCity.city.length)) {
    if (bestCounty.states.size > 1 && !stateHint) {
      return {
        candidates: [...bestCounty.states.entries()].map(([st, entry]) => countyLocalityOf(st, entry)),
      };
    }
    const [st, entry] = [...bestCounty.states.entries()][0];
    return { locality: countyLocalityOf(st, entry) };
  }
  if (bestCity) {
    if (bestCity.states.size > 1 && !stateHint) {
      return {
        candidates: [...bestCity.states.entries()].map(([st, zips]) => ({
          ...zips[0], match: 'city', zipCount: zips.length,
        })),
      };
    }
    const [st, zips] = [...bestCity.states.entries()][0];
    return { locality: { ...zips[0], match: 'city', zipCount: zips.length } };
  }
  if (bestCounty) {
    const [st, entry] = [...bestCounty.states.entries()][0];
    return { locality: countyLocalityOf(st, entry) };
  }
  // Fall back to the structured text search for anything the scan missed
  const viaSearch = searchLocalities(gaz, text.replace(/\b\d{5}\b/g, '').trim(), 8);
  if (viaSearch.length === 1) return { locality: viaSearch[0] };
  if (viaSearch.length > 1) return { candidates: viaSearch };
  if (stateHint) return { stateOnly: stateHint };
  return {};
}

export default function LocalityFinder() {
  const [gaz, setGaz] = useState(null);
  const [gazError, setGazError] = useState('');

  // Agent search
  const [ask, setAsk] = useState('');
  const [asking, setAsking] = useState(false);
  const [interpretation, setInterpretation] = useState(null); // { labels, placeText }
  const [focus, setFocus] = useState(null); // { tags, facilityFilters }
  const [showCrisis, setShowCrisis] = useState(false);
  const [candidates, setCandidates] = useState(null);
  const [placeNote, setPlaceNote] = useState('');

  // Cascading selections
  const [selState, setSelState] = useState('');
  const [selCountyFips, setSelCountyFips] = useState('');
  const [selCity, setSelCity] = useState('');

  const [locality, setLocality] = useState(null);

  const ensureGaz = async () => {
    if (gaz) return gaz;
    const g = await loadGazetteer();
    setGaz(g);
    return g;
  };

  const counties = useMemo(() => {
    if (!gaz || !selState) return [];
    return gaz.counties
      .filter((c) => c.state === selState)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [gaz, selState]);

  const countyZips = useMemo(() => {
    if (!gaz || !selCountyFips) return [];
    return gaz.zips.filter((z) => z.countyFips === selCountyFips);
  }, [gaz, selCountyFips]);

  const cities = useMemo(() => {
    const byCity = new Map();
    for (const z of countyZips) {
      if (!z.city) continue;
      if (!byCity.has(z.city)) byCity.set(z.city, []);
      byCity.get(z.city).push(z);
    }
    return [...byCity.entries()]
      .map(([city, zips]) => ({ city, zips }))
      .sort((a, b) => a.city.localeCompare(b.city));
  }, [countyZips]);

  const countyLocality = (county, zips) => ({
    zip: zips[0]?.zip || null,
    city: zips[0]?.city || null,
    state: county.state,
    county: county.name,
    countyFips: county.fips,
    match: 'county',
    zipCount: zips.length,
  });

  const placeText = (loc) =>
    `${loc.city ? `${loc.city}, ` : ''}${loc.county ? `${loc.county}, ` : ''}${loc.state}${loc.zip ? ` ${loc.zip}` : ''}`;

  const runAsk = async (e) => {
    if (e) e.preventDefault();
    const text = ask.trim();
    if (!text) return;
    setAsking(true);
    setGazError('');
    setPlaceNote('');
    setCandidates(null);
    try {
      const g = await ensureGaz();
      const needs = parseNeeds(text);
      const place = extractPlace(g, text);
      setFocus(
        needs.tags.length > 0 || needs.facilityFilters.length > 0
          ? { tags: needs.tags, facilityFilters: needs.facilityFilters }
          : null,
      );
      setShowCrisis(needs.crisis);
      if (place.locality) {
        setLocality(place.locality);
        setInterpretation({
          labels: needs.labels,
          place: placeText(place.locality),
        });
      } else if (place.candidates) {
        setLocality(null);
        setCandidates(place.candidates);
        setInterpretation({ labels: needs.labels, place: 'a few places with that name' });
      } else if (place.stateOnly) {
        const st = ALL_STATES_AND_TERRITORIES.find((s) => s.abbr === place.stateOnly);
        setLocality(null);
        setInterpretation({ labels: needs.labels, place: st ? st.name : place.stateOnly });
        setPlaceNote(
          `You named ${st ? st.name : place.stateOnly} — pick the county and city below (or add them to your search) and we'll pull what's there.`,
        );
      } else {
        setLocality(null);
        setInterpretation({ labels: needs.labels, place: null });
        setPlaceNote(
          "We couldn't place that location in the directory. Try a ZIP code, or use the state, county, and city picker below.",
        );
      }
    } catch {
      setGazError('Local search data could not be loaded. Please try again — the national and state directories work without it.');
    } finally {
      setAsking(false);
    }
  };

  const onStateChange = async (abbr) => {
    setSelState(abbr);
    setSelCountyFips('');
    setSelCity('');
    setLocality(null);
    setFocus(null);
    setInterpretation(null);
    setCandidates(null);
    setGazError('');
    if (!abbr) return;
    try {
      await ensureGaz();
    } catch {
      setGazError('Local search data could not be loaded. Please try again — the national and state directories work without it.');
    }
  };

  const onCountyChange = (fips) => {
    setSelCountyFips(fips);
    setSelCity('');
    setFocus(null);
    setInterpretation(null);
    if (!fips || !gaz) {
      setLocality(null);
      return;
    }
    const county = counties.find((c) => c.fips === fips);
    if (!county) return;
    const zips = gaz.zips.filter((z) => z.countyFips === fips);
    setLocality(countyLocality(county, zips));
  };

  const onCityChange = (city) => {
    setSelCity(city);
    const county = counties.find((c) => c.fips === selCountyFips);
    if (!county) return;
    if (!city) {
      setLocality(countyLocality(county, countyZips));
      return;
    }
    const entry = cities.find((c) => c.city === city);
    if (!entry) return;
    setLocality({ ...entry.zips[0], match: 'city', zipCount: entry.zips.length });
  };

  const reset = () => {
    setLocality(null);
    setCandidates(null);
    setInterpretation(null);
    setFocus(null);
    setShowCrisis(false);
    setPlaceNote('');
    setSelState('');
    setSelCountyFips('');
    setSelCity('');
  };

  return (
    <section className="px-6 py-12 border-b border-[#d4a574]/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <MapPin className="h-6 w-6 text-[#d4a574]" />
          <h2 className="text-2xl font-semibold text-white">Find help near you</h2>
        </div>
        <p className="text-white/50 mb-6 max-w-3xl">
          Type what you need and where you are — the finder pulls matching resources
          from our verified database of state gateways, local organizations, and
          licensed treatment facilities.
        </p>

        {/* Plain-language search — the forefront */}
        <form onSubmit={runAsk} className="max-w-3xl">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#d4a574]/70" />
              <Input
                value={ask}
                onChange={(e) => setAsk(e.target.value)}
                placeholder="What do you need, and where? e.g. detox in Tacoma, WA 98402"
                aria-label="Describe what you need and where"
                className="pl-10 bg-white/5 border-[#d4a574]/30 text-white placeholder:text-white/30 h-12 focus:border-[#d4a574]"
              />
            </div>
            <button
              type="submit"
              className="bg-[#d4a574] hover:bg-[#c49464] text-black font-semibold rounded-lg px-6 h-12 transition-colors"
            >
              {asking ? 'Searching…' : 'Find resources'}
            </button>
          </div>
          <p className="text-white/30 text-xs mt-2">
            Try: &ldquo;food bank near Puyallup&rdquo; · &ldquo;AA meetings in Pierce County&rdquo; · &ldquo;sober living in Spokane 99207&rdquo;
          </p>
        </form>

        {gazError && <p className="text-red-300 text-sm mt-4">{gazError}</p>}

        {interpretation && (
          <div className="mt-6 max-w-3xl">
            <p className="text-white/60 text-sm">
              {interpretation.labels.length > 0 ? (
                <>Looking for: <span className="text-white font-medium">{interpretation.labels.join(' · ')}</span></>
              ) : (
                <>Showing everything we have</>
              )}
              {interpretation.place && (
                <> — near <span className="text-white font-medium">{interpretation.place}</span></>
              )}
            </p>
          </div>
        )}

        {placeNote && <p className="text-white/50 text-sm mt-3 max-w-3xl">{placeNote}</p>}

        {showCrisis && (
          <div className="mt-6 border border-red-500/30 bg-red-950/30 rounded-2xl p-5 max-w-5xl">
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="h-5 w-5 text-red-400" />
              <p className="text-white font-semibold">If this is a crisis, these lines answer now — free and confidential</p>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {crisisResources.map((c) => (
                <Card key={c.name} className="border border-red-500/30 bg-black/60">
                  <CardContent className="p-4">
                    <h3 className="text-white font-semibold leading-snug mb-1">{c.name}</h3>
                    <p className="text-red-300 font-semibold text-sm mb-1">{c.phoneLabel}</p>
                    <ExtLink href={c.url}>Visit site</ExtLink>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {candidates && !locality && (
          <div className="mt-6 space-y-2 max-w-2xl">
            <p className="text-white/40 text-sm">Several places match — choose yours:</p>
            {candidates.map((r) => (
              <button
                key={`${r.match}-${r.city}-${r.county}-${r.state}`}
                onClick={() => { setLocality(r); setCandidates(null); setInterpretation((prev) => ({ ...(prev || { labels: [] }), place: placeText(r) })); }}
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

        {locality && <LocalityPanel locality={locality} onReset={reset} focus={focus} />}

        {/* Structured selections */}
        <div className="mt-12">
          <p className="text-white/40 text-sm mb-3">Or pick your place:</p>
          <div className="grid sm:grid-cols-3 gap-3 max-w-3xl">
            <div>
              <label htmlFor="lf-state" className="block text-white/40 text-xs uppercase tracking-widest mb-1.5">State</label>
              <select
                id="lf-state"
                value={selState}
                onChange={(e) => onStateChange(e.target.value)}
                className={selectClass}
                aria-label="Select a state"
              >
                <option value="" className="bg-black">Select a state…</option>
                {ALL_STATES_AND_TERRITORIES.map((s) => (
                  <option key={s.abbr} value={s.abbr} className="bg-black">
                    {s.name} ({s.abbr})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lf-county" className="block text-white/40 text-xs uppercase tracking-widest mb-1.5">County</label>
              <select
                id="lf-county"
                value={selCountyFips}
                onChange={(e) => onCountyChange(e.target.value)}
                className={selectClass}
                disabled={!selState || !gaz}
                aria-label="Select a county"
              >
                <option value="" className="bg-black">
                  {!selState ? 'Pick a state first' : !gaz ? 'Loading counties…' : 'Select a county…'}
                </option>
                {counties.map((c) => (
                  <option key={c.fips} value={c.fips} className="bg-black">{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lf-city" className="block text-white/40 text-xs uppercase tracking-widest mb-1.5">City</label>
              <select
                id="lf-city"
                value={selCity}
                onChange={(e) => onCityChange(e.target.value)}
                className={selectClass}
                disabled={!selCountyFips}
                aria-label="Select a city"
              >
                <option value="" className="bg-black">
                  {!selCountyFips ? 'Pick a county first' : 'All of the county'}
                </option>
                {cities.map((c) => (
                  <option key={c.city} value={c.city} className="bg-black">{c.city}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
