import HomeClient from './HomeClient'
import { SITE_URL, BUSINESS, STATES_SERVED, SERVICE_CITIES, FAQS } from '../lib/seo'

export const metadata = {
  title: 'Small-Business IT Support in DC, MD & VA | Kocre IT Services',
  description:
    'Kocre IT Services is a remote-first MSP delivering helpdesk, cloud & SaaS administration, and user support to small businesses across the DC–Maryland–Virginia (DMV) area and nationwide — with real onboarding, clear scope, and human-supervised AI.',
  alternates: { canonical: '/' },
  openGraph: {
    url: SITE_URL,
    title: 'Small-Business IT Support in DC, MD & VA | Kocre IT Services',
    description:
      'Remote-first managed IT support for small businesses across the DMV and nationwide — helpdesk, cloud admin, and user support through a structured portal.',
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
    'Remote-first IT helpdesk, cloud/SaaS administration, and structured user support for small businesses across the DC–Maryland–Virginia area and nationwide, delivered through a client portal with real onboarding and human-supervised AI.',
  serviceType: 'Managed IT support',
  telephone: BUSINESS.telephone,
  email: BUSINESS.email,
  priceRange: BUSINESS.priceRange,
  sameAs: BUSINESS.sameAs,
  founder: { '@type': 'Person', name: 'Komlan Kouhiko' },
  areaServed: [
    { '@type': 'Country', name: 'United States' },
    ...STATES_SERVED.map((s) => ({ '@type': 'AdministrativeArea', name: s })),
    ...SERVICE_CITIES.map((c) => ({ '@type': 'City', name: c })),
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: BUSINESS.telephone,
    email: BUSINESS.email,
    contactType: 'customer support',
    areaServed: 'US',
    availableLanguage: 'English',
  },
  makesOffer: [
    { '@type': 'Offer', name: 'Starter', price: '499', priceCurrency: 'USD', description: 'Up to 10 standard support tickets per month, business-hours remote helpdesk.' },
    { '@type': 'Offer', name: 'Growth', price: '999', priceCurrency: 'USD', description: 'Up to 30 standard tickets per month, helpdesk plus cloud & SaaS administration.' },
    { '@type': 'Offer', name: 'Scale', price: '1999', priceCurrency: 'USD', description: 'Custom support volume and priority remote support for larger teams.' },
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
