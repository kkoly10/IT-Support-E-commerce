import { notFound } from 'next/navigation'
import { SITE_URL, BUSINESS, SERVICES, REGIONS, FAQS, OG_BASE, STATES_SERVED, COUNTRIES_SERVED } from '../../../lib/seo'

const FAQ_MAP = Object.fromEntries(FAQS)

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const service = SERVICES.find((s) => s.slug === slug)
  if (!service) return {}
  return {
    title: service.metaTitle,
    description: service.metaDescription,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      ...OG_BASE,
      url: `${SITE_URL}/services/${service.slug}`,
      title: service.metaTitle,
      description: service.metaDescription,
      images: [{ url: '/og.png', width: 1200, height: 630, alt: `Kocre IT Services — ${service.name}` }],
    },
  }
}

export default async function ServicePage({ params }) {
  const { slug } = await params
  const service = SERVICES.find((s) => s.slug === slug)
  if (!service) notFound()

  const canonical = `${SITE_URL}/services/${service.slug}`
  const faqs = (service.faqKeys || []).map((k) => [k, FAQ_MAP[k]]).filter(([, a]) => a)

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Services', item: `${SITE_URL}/services` },
      { '@type': 'ListItem', position: 3, name: service.name, item: canonical },
    ],
  }

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: service.name,
    name: `${service.name} for small businesses`,
    description: service.metaDescription,
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
      ...STATES_SERVED.map((s) => ({ '@type': 'AdministrativeArea', name: s })),
      ...COUNTRIES_SERVED.map((c) => ({ '@type': 'Country', name: c })),
    ],
  }

  const faqLd = faqs.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      }
    : null

  const link = { color: 'var(--teal)', textDecoration: 'none', fontWeight: 600 }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: 'Inter Tight, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

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
          <a href="/services" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>Services</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--ink-light)' }}>{service.name}</span>
        </nav>

        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
          Service
        </div>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 18px' }}>
          {service.name} for small businesses
        </h1>
        <p style={{ fontSize: '1.15rem', lineHeight: 1.6, color: 'var(--ink-light)', maxWidth: 720, margin: '0 0 16px' }}>{service.intro}</p>
        <p style={{ fontSize: '1.02rem', lineHeight: 1.65, color: 'var(--ink-muted)', maxWidth: 720, margin: '0 0 36px' }}>{service.note}</p>

        {/* What's included */}
        <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: '1.6rem', fontWeight: 600, color: 'var(--ink)', margin: '0 0 20px' }}>What’s included</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 44 }}>
          {service.included.map(([t, d]) => (
            <div key={t} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px' }}>
              <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>{t}</div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-muted)' }}>{d}</div>
            </div>
          ))}
        </div>

        {/* Remote / fit note */}
        <div style={{ background: 'var(--teal-light)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px 26px', marginBottom: 44 }}>
          <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.6, color: 'var(--ink-light)' }}>
            Kocre IT is <strong>remote-first and Windows-first</strong>, built for small businesses with 1–20 users and no in-house IT team. Support is delivered during business hours through a structured portal with human-supervised AI — fair-use, not unlimited.
          </p>
        </div>

        {/* FAQ */}
        {faqs.length > 0 && (
          <>
            <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: '1.6rem', fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px' }}>Common questions</h2>
            <div style={{ display: 'grid', gap: 14, marginBottom: 44 }}>
              {faqs.map(([q, a]) => (
                <div key={q} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 22px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>{q}</div>
                  <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-muted)' }}>{a}</div>
                </div>
              ))}
            </div>
          </>
        )}

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

        {/* Other services */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Other services</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            {SERVICES.filter((s) => s.slug !== service.slug).map((s) => (
              <a key={s.slug} href={`/services/${s.slug}`} style={link}>{s.name}</a>
            ))}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Areas we serve</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {REGIONS.map((r) => (
              <a key={r.slug} href={`/service-areas/${r.slug}`} style={link}>{r.short}</a>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
