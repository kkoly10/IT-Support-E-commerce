// Centralized SEO / business constants — used by metadata, JSON-LD, sitemap, robots, and service-area pages.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

export const BUSINESS = {
  name: 'Kocre IT Services',
  legalName: 'Kocre IT Services',
  telephone: '+1-540-515-8324',
  telephoneDisplay: '(540) 515-8324',
  email: 'hello@kocreit.com',
  priceRange: '$499–$1,999/mo',
  // Remote/service-area business — no public street address.
  sameAs: [
    'https://www.facebook.com/share/18dexYxLNh/',
    'https://www.instagram.com/kocreitservices',
  ],
}

// States/districts served (for schema areaServed) + national reach.
export const STATES_SERVED = ['Virginia', 'Maryland', 'District of Columbia']

// Countries served remotely (English-speaking markets).
export const COUNTRIES_SERVED = ['United States', 'Canada', 'United Kingdom', 'Ireland']

// Shared Open Graph defaults. Next REPLACES (does not merge) openGraph when a
// page sets its own, so every page that overrides og must spread this in to
// keep siteName/type/locale/alternates/image.
export const OG_BASE = {
  siteName: 'Kocre IT Services',
  type: 'website',
  locale: 'en_US',
  alternateLocale: ['en_CA', 'en_GB', 'en_IE'],
  images: [
    { url: '/og.png', width: 1200, height: 630, alt: 'Kocre IT Services — remote-first IT support for small businesses' },
  ],
}

// Curated region landing pages (DMV). Each becomes /service-areas/<slug>.
export const REGIONS = [
  {
    slug: 'northern-virginia',
    name: 'Northern Virginia',
    short: 'Northern Virginia',
    intro:
      'Remote IT support and managed cloud administration for small businesses across Northern Virginia — from Arlington and Alexandria out to Loudoun and Prince William.',
    note:
      'Northern Virginia runs on Microsoft 365, Google Workspace, and a long tail of SaaS tools — and most small teams here have no dedicated IT person. We cover the day-to-day remotely, so a contractor in Arlington or a twelve-person firm in Tysons gets the same structured support a much larger company would.',
    cities: [
      'Arlington', 'Alexandria', 'Fairfax', 'Tysons', 'Vienna', 'McLean',
      'Reston', 'Herndon', 'Springfield', 'Burke', 'Annandale', 'Centreville',
      'Chantilly', 'Woodbridge', 'Manassas', 'Dale City', 'Lake Ridge',
      'Lorton', 'Dumfries', 'Leesburg', 'Ashburn', 'Sterling',
    ],
  },
  {
    slug: 'fredericksburg',
    name: 'Fredericksburg & Stafford',
    short: 'Fredericksburg & Stafford',
    intro:
      'Local, remote-first IT support for small businesses in the Fredericksburg and Stafford area — our home base along the I-95 corridor.',
    note:
      'As a Stafford-based team, the Fredericksburg corridor is home. We know the small businesses growing along I-95 between Quantico and Spotsylvania, and we keep their helpdesk, user accounts, and cloud tools running smoothly — without anyone needing to drive on-site.',
    cities: [
      'Stafford', 'Fredericksburg', 'Spotsylvania', 'King George', 'Falmouth',
      'Aquia Harbour', 'Garrisonville', 'Massaponax', 'Triangle', 'Quantico',
    ],
  },
  {
    slug: 'washington-dc',
    name: 'Washington, DC',
    short: 'Washington, DC',
    intro:
      'Remote IT helpdesk and cloud administration for small businesses and nonprofits across Washington, DC.',
    note:
      'DC small businesses and nonprofits juggle tight timelines and frequent staff turnover. Remote-first support with written scope and structured onboarding keeps accounts, access, and offboarding clean and auditable — without the cost of an in-house IT hire.',
    cities: [
      'Washington', 'Capitol Hill', 'Georgetown', 'Navy Yard', 'NoMa',
      'Foggy Bottom', 'Dupont Circle',
    ],
  },
  {
    slug: 'maryland',
    name: 'Maryland (DC Suburbs)',
    short: 'Maryland',
    intro:
      'Managed IT support for small businesses across the Maryland side of the DMV — Montgomery, Prince George’s, and surrounding counties.',
    note:
      'From Bethesda to Bowie, Maryland’s DC-suburb businesses lean heavily on cloud tools. We administer Microsoft 365 and Google Workspace, handle everyday user support, and keep access tidy as people join and leave — all remotely, on a flat monthly plan.',
    cities: [
      'Bethesda', 'Silver Spring', 'Rockville', 'Gaithersburg', 'Germantown',
      'Potomac', 'Chevy Chase', 'Bowie', 'Hyattsville', 'College Park',
      'Laurel', 'Greenbelt', 'Waldorf', 'Annapolis', 'Frederick',
    ],
  },
  {
    slug: 'richmond',
    name: 'Richmond & Central Virginia',
    short: 'Richmond',
    intro:
      'Remote IT support and cloud administration for small businesses in Richmond and the Central Virginia region.',
    note:
      'Richmond’s small-business scene is growing fast, and a lot of those teams have outgrown DIY IT. We give Central Virginia businesses dependable remote support — helpdesk, cloud administration, and real onboarding — without the cost of an in-house hire.',
    cities: [
      'Richmond', 'Henrico', 'Chesterfield', 'Glen Allen', 'Short Pump',
      'Midlothian', 'Mechanicsville', 'Ashland', 'Hanover', 'Colonial Heights',
    ],
  },
]

// Flat, de-duplicated city list (for schema areaServed + footer).
export const SERVICE_CITIES = [...new Set(REGIONS.flatMap((r) => r.cities))]

// Homepage FAQ — rendered visibly AND emitted as FAQPage schema (must match).
export const FAQS = [
  ['Do I need a long-term contract?', 'No. Monthly support paths are month-to-month after onboarding. Cancel any time with 30 days notice. Final billing and service terms are governed by your written agreement.'],
  ['What counts as a support ticket?', 'A discrete user-reported issue or routine admin request handled inside business hours through the portal — one issue, one user, or one related interruption.'],
  ['What is not included as a standard ticket?', 'Implementation projects, planned migrations, major remediation, on-site visits, and out-of-hours coverage. These are scoped separately unless specifically included in writing.'],
  ['What counts as an emergency?', 'A business-critical outage, suspected security incident, or major disruption with material operational impact and no reasonable workaround. Routine one-user issues usually do not qualify.'],
  ['Do you provide on-site support?', 'No. Kocre IT is remote-only by design — that focus keeps the offer clean and pricing flat.'],
]
