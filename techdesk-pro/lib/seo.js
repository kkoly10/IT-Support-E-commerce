import { SERVICE_CATALOG, formatUsd } from './service-catalog'

// Centralized SEO / business constants — used by metadata, JSON-LD, sitemap, robots, and service-area pages.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

export const BUSINESS = {
  name: 'Kocre IT Services',
  legalName: 'Kocre IT Services',
  telephone: '+1-540-573-8366',
  telephoneDisplay: '(540) 573-8366',
  email: 'hello@kocreit.com',
  priceRange: `One-time help ${formatUsd(SERVICE_CATALOG.one_time.sessionPrice)}; monthly support from ${formatUsd(SERVICE_CATALOG.remote.firstUser)}`,
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

// Service landing pages. Each becomes /services/<slug>. Content is written to
// match Kocre IT's real, stated scope (remote-first, Windows-first managed
// devices, basic security hygiene — not 24/7 SOC/compliance, fair-use not
// unlimited). `keyword` is the primary search intent the page targets.
export const SERVICES = [
  {
    slug: 'managed-it-services',
    name: 'Managed IT Services',
    keyword: 'managed IT services for small business',
    metaTitle: 'Managed IT Services for Small Businesses | Kocre IT Services',
    metaDescription:
      'Remote-first managed IT services for small businesses with 1–10 users — helpdesk, Microsoft 365 and Google Workspace administration, and managed Windows devices on a flat monthly plan.',
    intro:
      'Flat-rate, remote-first managed IT for small businesses that don’t have an internal IT team — day-to-day helpdesk, cloud administration, and managed Windows devices, all tracked through a structured support portal.',
    note:
      'Most teams we work with have 1–10 people, run on Microsoft 365 or Google Workspace, and have been getting by with “whoever is least bad at computers.” Managed IT replaces that with a predictable monthly plan: a real ticketing portal, written scope, structured onboarding, and accountable response during business hours — without the cost of a full-time hire.',
    included: [
      ['Remote helpdesk', 'User issues — passwords, email, software, accounts — handled through a ticketing portal during business hours.'],
      ['Microsoft 365 & Google Workspace admin', 'User setup, MFA, shared mailboxes, groups, permissions, and clean offboarding.'],
      ['Managed Windows devices', 'Approved business computers connected for remote troubleshooting, inventory, update visibility, and health checks.'],
      ['Onboarding & accountability', 'Contacts, access, and documentation tracked in writing so nothing slips through the cracks.'],
    ],
    faqKeys: ['What type of businesses are a good fit?', 'Do you offer unlimited support?', 'Do you provide on-site support?'],
  },
  {
    slug: 'remote-it-helpdesk',
    name: 'Remote IT Helpdesk',
    keyword: 'remote IT helpdesk support for small business',
    metaTitle: 'Remote IT Helpdesk Support for Small Businesses | Kocre IT Services',
    metaDescription:
      'Business-hours remote IT helpdesk for small businesses — password resets, email and account issues, software troubleshooting, and Microsoft 365 / Google Workspace help through a structured ticketing portal.',
    intro:
      'A real helpdesk for small teams without one — submit a request and get structured, accountable help with the everyday IT issues that interrupt your workday.',
    note:
      'Your team shouldn’t lose an afternoon to a locked account or a broken mailbox. Our remote helpdesk handles routine issues — typically resolvable within about 30 minutes — through a ticketing portal with clear status updates, AI-assisted triage, and human supervision on every response.',
    included: [
      ['Accounts & passwords', 'Resets, lockouts, MFA help, and permission changes for approved users.'],
      ['Email & collaboration', 'Outlook/Gmail issues, shared mailboxes, calendar, and common Microsoft 365 / Google Workspace tasks.'],
      ['Software & device help', 'Troubleshooting for approved business apps and managed Windows devices.'],
      ['Tracked, not lost', 'Every request is a ticket with history, status, and a first-response target during business hours.'],
    ],
    faqKeys: ['What is a standard support request?', 'What is a supported user?', 'Do you offer unlimited support?'],
  },
  {
    slug: 'microsoft-365-support',
    name: 'Microsoft 365 Support',
    keyword: 'Microsoft 365 support and administration for small business',
    metaTitle: 'Microsoft 365 Support & Administration for Small Businesses | Kocre IT',
    metaDescription:
      'Microsoft 365 support and administration for small businesses — user setup, MFA, shared mailboxes, groups, permissions, and offboarding, handled remotely during business hours.',
    intro:
      'Day-to-day Microsoft 365 administration and user support for small businesses — so your email, accounts, and shared tools just work.',
    note:
      'Microsoft 365 is the backbone of most small businesses we support, and its admin center is not where a busy owner wants to spend their day. We handle the routine 365 work — onboarding new users, MFA, shared mailboxes, distribution groups, basic permissions, and clean offboarding — and keep access tidy as people join and leave.',
    included: [
      ['User lifecycle', 'New-user setup, license assignment, MFA enrollment, and offboarding that actually removes access.'],
      ['Mailboxes & groups', 'Shared mailboxes, distribution and security groups, aliases, and calendar sharing.'],
      ['Permissions & sharing', 'SharePoint/OneDrive sharing basics and routine permission changes for approved users.'],
      ['Security hygiene', 'MFA review, admin-account review, and access cleanup as part of routine housekeeping.'],
    ],
    faqKeys: ['Do you support Microsoft 365 and Google Workspace?', 'Do you provide cybersecurity?', 'What is not considered standard support?'],
  },
  {
    slug: 'google-workspace-support',
    name: 'Google Workspace Support',
    keyword: 'Google Workspace support and administration for small business',
    metaTitle: 'Google Workspace Support & Administration for Small Businesses | Kocre IT',
    metaDescription:
      'Google Workspace support and administration for small businesses — user setup, 2-step verification, shared drives, groups, and offboarding, handled remotely during business hours.',
    intro:
      'Routine Google Workspace administration and user support for small businesses on Gmail, Drive, and the rest of the suite.',
    note:
      'For teams running on Google Workspace, we take the admin console off your plate — adding and removing users, enforcing 2-step verification, managing groups and shared drives, and keeping sharing and access clean. The same structured ticketing and business-hours response as the rest of our support.',
    included: [
      ['User lifecycle', 'New-user setup, 2-step verification, and offboarding that revokes access cleanly.'],
      ['Groups & shared drives', 'Google Groups, shared drive structure, and routine membership changes.'],
      ['Mail & sharing', 'Gmail routing basics, aliases, delegation, and Drive sharing housekeeping.'],
      ['Security hygiene', '2SV review, admin review, and access cleanup as part of routine housekeeping.'],
    ],
    faqKeys: ['Do you support Microsoft 365 and Google Workspace?', 'Do you provide cybersecurity?', 'Do you support Macs?'],
  },
  {
    slug: 'employee-onboarding-offboarding',
    name: 'Employee IT Onboarding & Offboarding',
    keyword: 'employee IT onboarding and offboarding for small business',
    metaTitle: 'Employee IT Onboarding & Offboarding for Small Businesses | Kocre IT',
    metaDescription:
      'Structured IT onboarding and offboarding for small businesses — new-hire account setup and clean departures across Microsoft 365 or Google Workspace, tracked in writing.',
    intro:
      'Repeatable new-hire setup and clean departures — so access is ready on day one and fully revoked the day someone leaves.',
    note:
      'Onboarding and offboarding are where small businesses quietly lose security and time. We make both a checklist, not a scramble: accounts, email, MFA, group membership, and device handoff for new hires; and a documented, auditable shutoff of accounts, sessions, and access when someone leaves — across Microsoft 365 or Google Workspace.',
    included: [
      ['New-hire setup', 'Accounts, email, MFA, group membership, and managed-device handoff, ready before day one.'],
      ['Clean offboarding', 'Accounts disabled, sessions revoked, and access removed on a documented timeline.'],
      ['Written & auditable', 'Every onboarding/offboarding tracked in the portal so nothing is missed.'],
      ['Access hygiene', 'Periodic review so old accounts and stale access don’t pile up.'],
    ],
    faqKeys: ['What is a supported user?', 'Can I cancel?', 'What type of businesses are a good fit?'],
  },
]

// Homepage FAQ — rendered visibly AND emitted as FAQPage schema (must match).
export const FAQS = [
  ['Is creating an account free?', 'Yes. You can explore services, save your choice, and ask setup questions without a payment. Creating an account or requesting a service does not purchase or activate support. You approve the scope and price before work begins.'],
  ['Which path fits one person?', `Choose one-time help for an eligible issue (${formatUsd(SERVICE_CATALOG.one_time.sessionPrice)} for up to ${SERVICE_CATALOG.one_time.sessionMinutes} minutes), Remote Desk for ongoing help (${formatUsd(SERVICE_CATALOG.remote.firstUser)}/month plus ${formatUsd(SERVICE_CATALOG.remote.setup)} setup), or Managed Desk for agreed preventive Windows care (${formatUsd(SERVICE_CATALOG.managed.firstUser)}/month plus ${formatUsd(SERVICE_CATALOG.managed.setup)} setup). We confirm fit and availability before work begins.`],
  ['What type of businesses are a good fit?', 'Our small-team path is for 1–10 people using Microsoft 365 or Google Workspace. Managed device care is Windows-first. Complex environments and larger teams use a custom quote. Personal customers can also request one-time remote help.'],
  ['How are 3–10-person totals handled?', 'The calculator shows an illustrative total for 3–10 people. We confirm scope, coverage and the final price in a written quote before work begins. Larger teams and complex requirements are custom-priced.'],
  ['What is a supported user?', 'A supported user is a person included in the agreed support roster. They do not need a portal login to be covered. Aliases and shared mailboxes are not extra people; additional computers, tenants, licenses and project work are scoped separately.'],
  ['What is a managed device?', 'An approved Windows computer enrolled for the preventive responsibilities in your agreement. Inventory, update handling and the agreed protection checks must be verified before device care is marked ready. Installing an agent or making a payment alone does not establish readiness.'],
  ['What is the support agent?', 'It is a tool used on approved computers for the remote access and management activities you authorize. Its installation, permissions and service scope are explained during setup. One-time help does not automatically require a permanent management agent.'],
  ['What is a standard support request?', 'A routine remote issue or administration task within your agreed environment, such as email troubleshooting, password help, or account changes. A routine issue is not automatically reclassified as a project because it takes more than 30 minutes.'],
  ['What is not considered standard support?', 'A domain rebrand, migration, new laptop build, bulk data transfer, substantial restoration, hardware repair, or additional coverage is separately scoped. Routine employee account and mailbox changes within the supported environment belong to recurring administration. Vendor licenses are separate, and overlapping setup work is not charged twice.'],
  ['Do you offer unlimited support?', 'No. Recurring support follows the agreed scope and fair-use terms. If demand remains unusually high, we review its cause and agree any future service or price change. We do not add surprise retroactive usage charges.'],
  ['What hours do you cover?', 'Staffed support windows and the human-response objective are agreed before activation. Submitting a request or receiving an automated receipt does not guarantee immediate troubleshooting, emergency coverage or resolution.'],
  ['Do you provide on-site support?', 'Kocre IT delivers remote services. We confirm whether an issue can be handled remotely before accepting the work. A non-booting computer, failed hardware, cabling or other physical work may need local assistance and a separate scope.'],
  ['Do you support Macs?', 'Mac and Linux support is reviewed before acceptance. Managed Desk is Windows-first; we confirm the supported devices and responsibilities in your scope.'],
  ['Do you support Microsoft 365 and Google Workspace?', 'Yes, within the agreed environment and approved access: user setup, license assignment, MFA, shared mailboxes, groups, routine permissions and offboarding. Rebrands and migrations are separately scoped. Vendor subscriptions are not included in the support price.'],
  ['Do you provide cybersecurity?', 'Basic security hygiene can be included in an agreed service. Specialist incident response, compliance guarantees, backup services and 24/7 security monitoring require explicit scope and are not automatically included.'],
  ['Can I cancel?', 'Monthly service follows the notice and effective-date terms in your accepted agreement. We agree the removal of support access and any agent offboarding. Contact Kocre IT for cancellation or a plan change; automated portal cancellation is not yet available.'],
  ['What happens after signup?', 'Your free workspace saves your service choice. We confirm fit, scope, coverage and price, then you approve the work and complete only the relevant setup. Existing contacts, agreements, access review and onboarding records stay together in the portal. Each service becomes available when its required setup has been verified.'],
]
