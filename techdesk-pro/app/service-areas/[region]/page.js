import { notFound } from 'next/navigation'
import { SITE_URL, BUSINESS, REGIONS } from '../../../lib/seo'

const STATE_BY_SLUG = {
  'northern-virginia': 'Virginia',
  fredericksburg: 'Virginia',
  'washington-dc': 'District of Columbia',
  maryland: 'Maryland',
  richmond: 'Virginia',
}

const SERVICES = [
  ['Remote helpdesk', 'Day-to-day user issues handled through a structured ticketing portal during business hours.'],
  ['Cloud & SaaS administration', 'Microsoft 365 and Google Workspace administration — accounts, mailboxes, sharing, and settings.'],
  ['Onboarding & offboarding', 'New-hire setup and clean departures, tracked in writing so nothing slips through the cracks.'],
  ['Access & security hygiene', 'Account access, MFA, and routine security housekeeping kept tidy and auditable.'],
]

export function generateStaticParams() {
  return REGIONS.map((r) => ({ region: r.slug }))
}

export async function generateMetadata({ params }) {
  const { region: slug } = await params
  const region = REGIONS.find((r) => r.slug === slug)
  if (!region) return {}
  const title = `IT Support for Small Businesses in ${region.name} | Kocre IT Services`
  return {
    title,
    description: region.intro,
    alternates: { canonical: `/service-areas/${region.slug}` },
    openGraph: {
      url: `${SITE_URL}/service-areas/${region.slug}`,
      title,
      description: region.intro,
    },
  }
}

export default async function RegionPage({ params }) {
  const { region: slug } = await params
  const region = REGIONS.find((r) => r.slug === slug)
  if (!region) notFound()

  const canonical = `${SITE_URL}/service-areas/${region.slug}`
  const state = STATE_BY_SLUG[region.slug]

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: region.name, item: canonical },
    ],
  }

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Managed IT support',
    name: `Managed IT support in ${region.name}`,
    url: canonical,
    provider: {
      '@type': 'ProfessionalService',
      name: BUSINESS.name,
      telephone: BUSINESS.telephone,
      email: BUSINESS.email,
      url: SITE_URL,
      sameAs: BUSINESS.sameAs,
    },
    areaServed: [
      ...(state ? [{ '@type': 'AdministrativeArea', name: state }] : []),
      ...region.cities.map((c) => ({ '@type': 'City', name: c })),
    ],
  }

  const link = { color: 'var(--teal)', textDecoration: 'none', fontWeight: 600 }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: 'Inter Tight, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />

      {/* Top bar */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '18px 22px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <a href="/" style={{ fontWeight: 700, color: 'var(--ink)', textDecoration: 'none', fontSize: 16 }}>Kocre IT</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <a href={`tel:${BUSINESS.telephone}`} style={{ color: 'var(--ink-light)', textDecoration: 'none', fontSize: 14 }}>{BUSINESS.telephoneDisplay}</a>
            <a href="/free-assessment" style={{ background: 'var(--teal)', color: '#fff', padding: '9px 16px', borderRadius: 999, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Start free assessment</a>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '64px 22px 80px' }}>
        {/* Breadcrumb */}
        <nav style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 24 }}>
          <a href="/" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>Home</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>Service areas</span>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--ink-light)' }}>{region.name}</span>
        </nav>

        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
          Service area
        </div>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 18px' }}>
          IT support for small businesses in {region.name}
        </h1>
        <p style={{ fontSize: '1.15rem', lineHeight: 1.6, color: 'var(--ink-light)', maxWidth: 720, margin: '0 0 16px' }}>{region.intro}</p>
        <p style={{ fontSize: '1.02rem', lineHeight: 1.65, color: 'var(--ink-muted)', maxWidth: 720, margin: '0 0 36px' }}>{region.note}</p>

        {/* Services */}
        <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: '1.6rem', fontWeight: 600, color: 'var(--ink)', margin: '0 0 20px' }}>What we handle</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 44 }}>
          {SERVICES.map(([t, d]) => (
            <div key={t} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px' }}>
              <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>{t}</div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-muted)' }}>{d}</div>
            </div>
          ))}
        </div>

        {/* Cities */}
        <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: '1.6rem', fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px' }}>Areas we serve near {region.short}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 44 }}>
          {region.cities.map((c) => (
            <span key={c} style={{ background: 'var(--bg-warm)', border: '1px solid var(--border)', borderRadius: 999, padding: '6px 14px', fontSize: 13.5, color: 'var(--ink-light)' }}>{c}</span>
          ))}
        </div>

        {/* Remote note + national */}
        <div style={{ background: 'var(--teal-light)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px 26px', marginBottom: 44 }}>
          <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.6, color: 'var(--ink-light)' }}>
            Kocre IT is <strong>remote-only by design</strong> — there’s no on-site visit and no travel fee. That means we support {region.short} businesses with the same fast, structured service we provide to small businesses anywhere in the U.S.
          </p>
        </div>

        {/* CTA */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32 }}>
          <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)', margin: '0 0 12px' }}>Get a free assessment</h2>
          <p style={{ fontSize: '1rem', color: 'var(--ink-muted)', maxWidth: 620, margin: '0 0 20px' }}>
            A short, no-pressure look at your team, tools, and recurring IT pain points — ending with an honest recommendation.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <a href="/free-assessment" style={{ background: 'var(--teal)', color: '#fff', padding: '13px 24px', borderRadius: 999, textDecoration: 'none', fontWeight: 600 }}>Start free assessment</a>
            <a href={`tel:${BUSINESS.telephone}`} style={link}>or call {BUSINESS.telephoneDisplay}</a>
          </div>
        </div>

        {/* Other regions */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Other areas we serve</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {REGIONS.filter((r) => r.slug !== region.slug).map((r) => (
              <a key={r.slug} href={`/service-areas/${r.slug}`} style={link}>{r.short}</a>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
