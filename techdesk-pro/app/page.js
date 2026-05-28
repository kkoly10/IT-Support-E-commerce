import HomeClient from './HomeClient'
import { SITE_URL, BUSINESS, STATES_SERVED, SERVICE_CITIES, COUNTRIES_SERVED, FAQS, OG_BASE } from '../lib/seo'

export const metadata = {
  title: 'Remote IT Support for Small Businesses | Kocre IT',
  description:
    'Kocre IT provides founder-led remote helpdesk, Microsoft 365 and Google Workspace support, employee onboarding/offboarding, and managed Windows device support for small businesses.',
  alternates: { canonical: '/' },
  openGraph: {
    ...OG_BASE,
    url: SITE_URL,
    title: 'Remote IT Support for Small Businesses | Kocre IT',
    description:
      'Founder-led remote helpdesk, Microsoft 365 and Google Workspace support, employee onboarding/offboarding, and managed Windows device support for small businesses.',
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
    'Founder-led remote IT support for small businesses — helpdesk, Microsoft 365 and Google Workspace support, employee onboarding/offboarding, and managed Windows device support. DMV-based, remote-first across the U.S.',
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
    { '@type': 'Offer', name: 'Founding Managed Support', price: '399', priceCurrency: 'USD', description: 'Up to 5 users / 5 Windows devices · 90-day pilot · $199 setup. Helpdesk, M365/Google Workspace basic support, and managed Windows device support.' },
    { '@type': 'Offer', name: 'Remote Desk', price: '49', priceCurrency: 'USD', description: '$49/user/month · $299/month minimum · $199 setup. Helpdesk and cloud account support; managed devices not included.' },
    { '@type': 'Offer', name: 'Managed Desk', price: '89', priceCurrency: 'USD', description: '$89/user/month · $499/month minimum · $499 setup. Helpdesk plus one managed Windows device per user, plus onboarding/offboarding.' },
    { '@type': 'Offer', name: 'Secure Desk', price: '129', priceCurrency: 'USD', description: '$129/user/month · $899/month minimum · $799+ setup. Managed support plus basic security hygiene reviews.' },
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
