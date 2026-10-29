import { SERVICE_CATALOG } from '../lib/service-catalog'
import HomeClient from './HomeClient'
import { SITE_URL, BUSINESS, STATES_SERVED, SERVICE_CITIES, COUNTRIES_SERVED, FAQS, OG_BASE } from '../lib/seo'

export const metadata = {
  title: 'Remote IT Support for Small Businesses | Kocre IT',
  description:
    'Kocre IT provides remote helpdesk, Microsoft 365 support, managed Windows computers, endpoint security, backup and recovery, and cloud infrastructure services for small businesses.',
  alternates: { canonical: '/' },
  openGraph: {
    ...OG_BASE,
    url: SITE_URL,
    title: 'Remote IT Support for Small Businesses | Kocre IT',
    description:
      'Remote helpdesk, Microsoft 365 support, managed computers, endpoint security, backup and recovery, and cloud infrastructure services for small businesses.',
  },
}

const SERVICE_LD = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': `${SITE_URL}/#business`,
  name: BUSINESS.name,
  legalName: BUSINESS.legalName,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/png/mark-512.png`,
  image: `${SITE_URL}/og.png`,
  description:
    'Remote-first managed IT for small businesses — helpdesk, Microsoft 365 and Google Workspace administration, managed Windows computers, endpoint security, backup and recovery, and cloud infrastructure. DMV-based, remote-first across the U.S.',
  serviceType: 'Managed IT support',
  telephone: BUSINESS.telephone,
  email: BUSINESS.email,
  priceRange: BUSINESS.priceRange,
  sameAs: BUSINESS.sameAs,
  founder: { '@type': 'Person', name: 'Komlan Kouhiko' },
  areaServed: [
    ...COUNTRIES_SERVED.map((c) => ({ '@type': 'Country', name: c })),
    ...STATES_SERVED.map((s) => ({ '@type': 'AdministrativeArea', name: s })),
    ...SERVICE_CITIES.map((c) => ({ '@type': 'City', name: c })),
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: BUSINESS.telephone,
    email: BUSINESS.email,
    contactType: 'customer support',
    areaServed: ['US', 'CA', 'GB', 'IE'],
    availableLanguage: 'English',
  },
  makesOffer: [
    { '@type': 'Offer', name: SERVICE_CATALOG.one_time.name, price: String(SERVICE_CATALOG.one_time.sessionPrice), priceCurrency: 'USD', description: 'Scheduled remote help, up to 60 minutes for an eligible issue. Additional work requires approval.' },
    { '@type': 'Offer', name: SERVICE_CATALOG.remote.name, price: String(SERVICE_CATALOG.remote.firstUser), priceCurrency: 'USD', description: `Monthly support including the first person; $${SERVICE_CATALOG.remote.additionalUser} per additional person; $${SERVICE_CATALOG.remote.setup} setup. Pilot pricing for 1–2 people; 3–10 people require a written quote. Licenses and projects separate.` },
    { '@type': 'Offer', name: SERVICE_CATALOG.managed.name, price: String(SERVICE_CATALOG.managed.firstUser), priceCurrency: 'USD', description: `Monthly support including the first person; ${SERVICE_CATALOG.managed.additionalUser} per additional person; ${SERVICE_CATALOG.managed.setup} setup. Includes proactive care for one approved Windows computer per person. Pilot pricing for 1–2 people; 3–10 people require a written quote.` },
    { '@type': 'Offer', name: SERVICE_CATALOG.secure.name, price: String(SERVICE_CATALOG.secure.firstUser), priceCurrency: 'USD', description: `Managed Desk plus managed endpoint security and agreed recovery oversight. ${SERVICE_CATALOG.secure.additionalUser} per additional person; ${SERVICE_CATALOG.secure.setup} setup. Third-party licenses, storage and provider usage are separate unless quoted.` },
    { '@type': 'Offer', name: 'Cloud Care', price: '99', priceCurrency: 'USD', description: 'Managed administration for an eligible small cloud workload, from $99/month plus cloud-provider usage. Deployment, migration and larger infrastructure are quoted separately.' },
    { '@type': 'Offer', name: SERVICE_CATALOG.custom.name, description: 'Written scope and pricing for complex environments, larger teams, cloud infrastructure and additional coverage.' },
  ],
}

const FAQ_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(([q, a]) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SERVICE_LD) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }} />
      <HomeClient />
    </>
  )
}
