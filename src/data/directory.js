// Nationwide Recovery Resource Directory — national data (crisis + national locators).
// State gateway data lives in src/data/states/*.json (one verified JSON per state,
// landed by the regional research agents; imported via import.meta.glob in
// src/data/states.js). Gazetteer data (ZIP/city/county) is served from
// /data/localities.json (public/) and loaded lazily by src/data/gazetteer.js —
// it is ~4 MB and must not be bundled.
//
// Verification doctrine: every URL below was fetched during the build run and
// returned HTTP 200 (or a clean redirect) with content matching its label.
// Full record: docs/directory-mapping.md. No per-facility listings — gateways
// and maintained national locators only, so nothing here goes stale silently.

export const crisisResources = [
  {
    name: '988 Suicide & Crisis Lifeline',
    url: 'https://988lifeline.org/',
    phone: '988',
    phoneLabel: 'Call or text 988',
    description:
      'Free, confidential support 24/7 for anyone in emotional distress or a suicidal crisis. Call or text 988 anywhere in the U.S.',
  },
  {
    name: 'SAMHSA National Helpline',
    url: 'https://www.samhsa.gov/find-help/helplines/national-helpline',
    phone: '1-800-662-4357',
    phoneLabel: '1-800-662-HELP (4357)',
    description:
      'Free, confidential treatment referrals and information, 24/7, in English and Spanish — for substance use and mental health disorders.',
  },
  {
    name: 'Crisis Text Line',
    url: 'https://www.crisistextline.org/',
    phone: null,
    phoneLabel: 'Text HOME to 741741',
    description:
      'Text with a live, trained counselor about any crisis — anxiety, depression, suicidal thoughts — free and confidential, 24/7.',
  },
  {
    name: 'Never Use Alone',
    url: 'https://neverusealone.com/',
    phone: null,
    phoneLabel: 'Visit neverusealone.com for the call line',
    description:
      'A free peer support line: call before using alone and a volunteer stays on the phone with you and can send emergency help if you stop responding.',
  },
];

// Canonical service taxonomy (owner-set, directory-data/TAXONOMY.md,
// 2026-10-22). Category filters and the county/locality org grouping use
// EXACTLY these labels. Tags on entries below are applied only where the
// organization's own site states the service.
export const TAXONOMY = [
  'Treatment & Detox',
  'Recovery Housing / Sober Living',
  'AA Meetings',
  'NA Meetings',
  'Other Recovery Meetings & Peer Support',
  'Crisis & Helplines',
  'Showers & Hygiene',
  'Food Banks & Meals',
  'Churches & Faith-Based Support',
  'Emergency Shelter',
  'Rental Assistance',
  'Utility Bill Assistance',
  'Gas Vouchers',
  'Bus Tickets & Transportation Help',
  'Employment Help',
  'Reentry Support (post-incarceration)',
  'Family Support',
  'Veterans Services',
  'Benefits & ID Help',
  'Clothing & Household Goods',
  'Legal Aid',
];

// Grouped national directory. Headings below are organizational groupings;
// the FILTERS use the taxonomy tags on each entry (`tags`). Meeting finders
// are labeled with the taxonomy's AA Meetings / NA Meetings categories via
// their tags. `locator` keys map to the deep-link builders in
// src/data/locators.js — a builder only produces a prefilled URL where a
// pattern was verified by fetching an example (see docs/directory-mapping.md);
// everywhere else the plain locator URL below is used.
export const nationalCategories = [
  {
    category: 'Find Treatment',
    entries: [
      {
        name: 'FindTreatment.gov',
        tags: ["Treatment & Detox"],
        url: 'https://findtreatment.gov/',
        locator: 'findtreatment',
        description:
          "SAMHSA's confidential, anonymous locator for substance-use and mental-health treatment facilities across the U.S. — search by ZIP, city, or address.",
      },
      {
        name: 'Treatment ATLAS (Shatterproof)',
        tags: ["Treatment & Detox"],
        url: 'https://treatmentatlas.org/',
        description:
          'Search addiction treatment facilities and compare them against national quality standards, with patient feedback.',
      },
      {
        name: 'SAMHSA Single State Agencies Directory',
        tags: ["Treatment & Detox"],
        url: 'https://www.samhsa.gov/grants/block-grants/subg/ssa-directory',
        description:
          "SAMHSA's canonical list of each state's substance-use agency — the official gateway behind the state cards below.",
      },
    ],
  },
  {
    category: 'Recovery Housing',
    entries: [
      {
        name: 'NARR — Find a State Affiliate',
        tags: ["Recovery Housing / Sober Living"],
        url: 'https://narronline.org/affiliates/',
        description:
          'The National Alliance for Recovery Residences lists its state affiliates here — the organizations that certify recovery homes to the NARR standard.',
      },
      {
        name: 'Oxford House Vacancy Finder',
        tags: ["Recovery Housing / Sober Living"],
        url: 'https://oxfordvacancies.com/',
        locator: 'oxford',
        description:
          'Live vacancy listings for Oxford Houses — democratically run, self-supporting recovery homes. Search by city, county, or state.',
      },
      {
        name: 'Oxford House',
        tags: ["Recovery Housing / Sober Living"],
        url: 'https://www.oxfordhouse.org/',
        description:
          'About Oxford House: how the model works, how to join a house, and how to start one in your community.',
      },
    ],
  },
  {
    category: 'Meetings',
    entries: [
      {
        name: 'Alcoholics Anonymous — Find A.A.',
        tags: ["AA Meetings"],
        url: 'https://www.aa.org/find-aa',
        locator: 'aa',
        description:
          "A.A.'s official meeting finder — search local meetings by location, or get the Meeting Guide app.",
      },
      {
        name: 'Narcotics Anonymous — Meeting Search',
        tags: ["NA Meetings"],
        url: 'https://www.na.org/meetingsearch/',
        locator: 'na',
        description:
          "NA's official worldwide meeting search — in-person and virtual meetings for people recovering from drug addiction.",
      },
      {
        name: 'SMART Recovery — Meeting Search',
        tags: ["Other Recovery Meetings & Peer Support"],
        url: 'https://meetings.smartrecovery.org/meetings/',
        locator: 'smart',
        description:
          'Science-based, self-empowering recovery meetings — search in-person and online meetings by location.',
      },
      {
        name: 'Celebrate Recovery',
        tags: ["Other Recovery Meetings & Peer Support", "Churches & Faith-Based Support"],
        url: 'https://www.celebraterecovery.com/',
        description:
          'Christ-centered 12-step recovery for hurts, habits, and hang-ups — find a local group through their site.',
      },
      {
        name: 'Al-Anon Family Groups',
        tags: ["Family Support"],
        url: 'https://al-anon.org/meetings/',
        description:
          'Support for families and friends of people with a drinking problem — find Al-Anon and Alateen meetings.',
      },
      {
        name: 'Nar-Anon Family Groups',
        tags: ["Family Support"],
        url: 'https://www.nar-anon.org/',
        description:
          'A 12-step program for families and friends of people with drug addiction — find a meeting near you.',
      },
    ],
  },
  {
    category: 'Peer & Community',
    entries: [
      {
        name: 'Faces & Voices of Recovery',
        tags: ["Other Recovery Meetings & Peer Support"],
        url: 'https://facesandvoicesofrecovery.org/',
        description:
          'The national recovery advocacy organization — connects people to local recovery community organizations (RCOs) and peer support across the country.',
      },
    ],
  },
  {
    category: 'Family',
    entries: [
      {
        name: 'Partnership to End Addiction',
        tags: ["Family Support"],
        url: 'https://drugfree.org/',
        description:
          'Free, confidential help for parents and families — helpline, text support, and guidance on prevention, treatment, and recovery.',
      },
    ],
  },
  {
    category: 'Reentry',
    entries: [
      {
        name: 'National Reentry Resource Center',
        tags: ["Reentry Support (post-incarceration)"],
        url: 'https://nationalreentryresourcecenter.org/',
        description:
          'Federal resource center for people returning home after incarceration — reentry services, grants, and state-by-state information.',
      },
      {
        name: 'CareerOneStop — Justice-Impacted Job Seekers',
        tags: ["Employment Help", "Reentry Support (post-incarceration)"],
        url: 'https://reentry.careeronestop.org/JusticeImpacted/get-started-guide.aspx',
        description:
          "The U.S. Department of Labor's get-started guide: careers, training, and how to talk about a conviction in interviews.",
      },
    ],
  },
  {
    category: 'Benefits & Local Help',
    entries: [
      {
        name: '211',
        tags: ["Benefits & ID Help"],
        url: 'https://www.211.org/',
        locator: 'two11',
        description:
          'Dial 2-1-1 or search online for free, confidential local help — food, housing, utility assistance, health care, and more. Available 24/7 in most areas.',
      },
      {
        name: 'findhelp',
        tags: ["Benefits & ID Help"],
        url: 'https://www.findhelp.org/',
        description:
          'Search free and reduced-cost programs by ZIP code — food, housing, health care, financial help, and legal services.',
      },
    ],
  },
  {
    category: 'Veterans',
    entries: [
      {
        name: 'VA Substance Use Disorder Programs',
        tags: ["Veterans Services", "Treatment & Detox"],
        url: 'https://www.va.gov/health-care/health-needs-conditions/substance-use-problems/',
        locator: 'va',
        description:
          'Substance-use treatment for veterans through the VA — programs, medications, and therapy. The VA SUD Program Locator lists programs by state (in a locality view below, this link opens your state directly).',
      },
      {
        name: 'Veterans Crisis Line',
        tags: ["Veterans Services", "Crisis & Helplines"],
        url: 'https://www.veteranscrisisline.net/',
        phone: '988',
        phoneLabel: 'Call 988, then press 1',
        description:
          'For veterans in crisis and those who support them — call 988 and press 1, text 838255, or chat online. Free and confidential, 24/7.',
      },
    ],
  },
  {
    category: 'Harm Reduction',
    entries: [
      {
        name: 'NEXT Distro',
        tags: [],
        url: 'https://nextdistro.org/',
        description:
          'Free mail-based naloxone (Narcan) and harm-reduction supplies for people who use drugs, in states where the program operates.',
      },
      {
        name: 'National Harm Reduction Coalition',
        tags: [],
        url: 'https://harmreduction.org/',
        description:
          'National resource center for harm reduction — naloxone access, syringe service programs, and safer-use information.',
      },
    ],
  },
];

export const nationalEntries = nationalCategories.flatMap((c) =>
  c.entries.map((e) => ({ ...e, category: c.category })),
);

// The 50 states + DC — the directory's browse scope. Territories present in
// the gazetteer/states data (AS, GU, MP, PR, VI) are reachable through
// locality search and appear in the state grid when a verified gateway file
// exists for them; they are flagged via `territory: true` in ALL_LOCALITIES.
export const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
  ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
  ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
  ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'],
  ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
].map(([abbr, name]) => ({ abbr, name }));

export const TERRITORIES = [
  ['AS', 'American Samoa'], ['GU', 'Guam'], ['MP', 'Northern Mariana Islands'],
  ['PR', 'Puerto Rico'], ['VI', 'U.S. Virgin Islands'],
].map(([abbr, name]) => ({ abbr, name, territory: true }));
