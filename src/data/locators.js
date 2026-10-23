// Deep-link builders for national locators.
//
// A prefilled URL is produced ONLY where the pattern was verified during the
// build run by fetching a live example and confirming location-specific
// content in the response (full record in docs/directory-mapping.md):
//
//   VERIFIED  Oxford House Vacancy Finder — ?q=<city> returned vacancies for
//             that city and not for a contrasting city (Tacoma vs Miami
//             contrast test, 2026-10-22); ?state=<ST> likewise verified.
//   VERIFIED  VA SUD Program Locator — ?STATE=<ST> returned the named
//             state's program list (WA example fetched, title matched).
//
//   NOT VERIFIED (plain locator link used — never fabricate a pattern):
//   FindTreatment.gov (JS app; fetched shell is identical with/without
//   parameters — its documented JSON API pattern is a data API, not a user
//   link), AA find-aa (geocoder parameter returned the identical generic
//   shell for two different cities), NA meeting search (form/session based),
//   SMART Recovery meetings (?location= / ?search= returned the generic
//   meeting list with no location content), 211.org (/search?query= returns
//   404; homepage search is JS-driven), findhelp (no pattern fetched).
//
// locality = { zip, city, state, county } from the gazetteer.

export function locatorUrl(entry, locality) {
  if (!locality || !entry.locator) return entry.url;
  switch (entry.locator) {
    case 'oxford': {
      const q = locality.city || locality.zip;
      return q
        ? `https://oxfordvacancies.com/?q=${encodeURIComponent(q)}`
        : entry.url;
    }
    case 'va': {
      return locality.state
        ? `https://www.va.gov/directory/GUIDE/state_SUD.cfm?STATE=${encodeURIComponent(locality.state)}`
        : entry.url;
    }
    default:
      return entry.url;
  }
}

// Whether a prefilled (location-specific) URL will be produced — lets the UI
// label links honestly ("Search Oxford House vacancies in Tacoma" vs a
// generic "Open the locator and enter your ZIP").
export function isPrefilled(entry, locality) {
  return Boolean(locality && entry.locator && (entry.locator === 'oxford' || entry.locator === 'va'));
}
