// State gateway data — one verified JSON per state, landed by the regional
// research agents at directory-data/states/<ST>.json and copied into
// src/data/states/. The glob import means a newly landed state file is picked
// up automatically on the next build; states without a file render as
// "pending" from the gazetteer state list (see Directory page) rather than
// blocking the directory.
//
// Schema (per state file):
// { state, stateName, agency:{name,url,phone}, narrAffiliate:{name,url}|null,
//   narrNote, two11:{name,url}, peerOrgs:[{name,url}],
//   stateCrisis:{name,url,phone}|null, medicaidSud:{url}|null,
//   countyDirectory:{name,url}|null, verifiedAt, notes }

const modules = import.meta.glob('./states/*.json', { eager: true });

export const stateGateways = Object.values(modules)
  .map((m) => m.default || m)
  .filter((s) => s && s.state)
  .sort((a, b) => a.stateName.localeCompare(b.stateName));

export const stateGatewayByAbbr = Object.fromEntries(
  stateGateways.map((s) => [s.state, s]),
);
