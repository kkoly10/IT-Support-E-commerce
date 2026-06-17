import { SITE_URL, BUSINESS, SERVICES, REGIONS, OG_BASE } from '../../lib/seo'

const title = 'IT Services for Small Businesses | Kocre IT Services'
const description =
  'Remote-first IT services for small businesses — managed IT, remote helpdesk, Microsoft 365 and Google Workspace support, and employee onboarding/offboarding. Business-hours coverage, no in-house IT team required.'

export const metadata = {
  title,
  description,
  alternates: { canonical: '/services' },
  openGraph: {
    ...OG_BASE,
    url: `${SITE_URL}/services`,
    title,
    description,
  },
}

export default function ServicesIndexPage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Services', item: `${SITE_URL}/services` },
    ],
  }

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: SERVICES.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.name,
      url: `${SITE_URL}/services/${s.slug}`,
    })),
  }

  const link = { color: 'var(--teal)', textDecoration: 'none', fontWeight: 600 }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: 'Inter Tight, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />

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
        <nav style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 24 }}>
          <a href="/" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>Home</a>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--ink-light)' }}>Services</span>
        </nav>

        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
          Services
        </div>
        <h1 style={{ fontFamily: "'Newsreader', serif", fontSize: 'clamp(2rem, 4.5vw, 3rem)', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 18px' }}>
          IT services for small businesses
        </h1>
        <p style={{ fontSize: '1.15rem', lineHeight: 1.6, color: 'var(--ink-light)', maxWidth: 720, margin: '0 0 40px' }}>
          Remote-first IT support for small businesses with 1–20 users and no in-house IT team — delivered through a structured portal with business-hours coverage and human-supervised AI.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 44 }}>
          {SERVICES.map((s) => (
            <a
              key={s.slug}
              href={`/services/${s.slug}`}
              style={{ display: 'block', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', textDecoration: 'none' }}
            >
              <div style={{ fontFamily: "'Newsreader', serif", fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>{s.name}</div>
              <div style={{ fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-muted)', marginBottom: 12 }}>{s.intro}</div>
              <span style={{ ...link, fontSize: 14 }}>Learn more →</span>
            </a>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32 }}>
          <h2 style={{ fontFamily: "'Newsreader', serif", fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px' }}>Areas we serve</h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
            {REGIONS.map((r) => (
              <a key={r.slug} href={`/service-areas/${r.slug}`} style={link}>{r.short}</a>
            ))}
          </div>
          <a href="/free-assessment" style={{ background: 'var(--teal)', color: '#fff', padding: '13px 24px', borderRadius: 999, textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>Start free assessment</a>
        </div>
      </div>
    </main>
  )
}
