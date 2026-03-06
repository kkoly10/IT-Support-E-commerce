// File: app/ecommerce/page.js (new — mkdir -p app/ecommerce)

export const metadata = {
  title: 'E-Commerce Support & Integrations | TechDesk Pro',
  description:
    'Store setup, platform fixes, app integrations, payment support, and ongoing e-commerce operational help for Shopify, Wix, WooCommerce, and Squarespace.',
}

export default function EcommercePage() {
  const addOnPricing = [
    { name: 'Lite', price: '+$250/mo', desc: 'Basic store support and troubleshooting' },
    { name: 'Growth', price: '+$500/mo', desc: 'Ongoing store support, integrations, and optimization' },
    { name: 'Advanced', price: 'Starting at +$900/mo', desc: 'Full e-commerce operations support' },
  ]

  const standalonePricing = [
    { name: 'Starter', price: '$450/mo', desc: 'Basic retainer for store support' },
    { name: 'Growth', price: '$850/mo', desc: 'Ongoing support plus integrations' },
    { name: 'Advanced', price: 'Starting at $1,250/mo', desc: 'Full operations retainer' },
  ]

  const projectPricing = [
    { name: 'Simple', range: '$750 – $1,500', desc: 'Simple setup, fixes, light integrations' },
    { name: 'Standard', range: '$1,500 – $3,000', desc: 'Standard setup, tune-up, or integration project' },
    { name: 'Complex', range: '$3,000 – $6,000+', desc: 'Migration, rebuild, or complex integrations' },
  ]

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', padding: '120px 20px 80px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <a href="/" style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>← Back to homepage</a>

        <div style={{ marginBottom: 40 }}>
          <div style={tagStyle}>Specialized Service</div>
          <h1 style={h1Style}>E-Commerce Support &amp; Integrations</h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--ink-light)', lineHeight: 1.7, maxWidth: 640 }}>
            Store setup help, platform fixes, app integrations, payment support, inventory workflows,
            and ongoing operational support for businesses that sell online.
          </p>
        </div>

        {/* Platforms */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>Supported Platforms</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['Shopify', 'Wix', 'WooCommerce', 'Squarespace'].map(p => (
              <span key={p} style={tagBadge}>{p}</span>
            ))}
          </div>
        </section>

        {/* What we help with */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>What We Help With</h2>
          <ul style={ulStyle}>
            <li>Store setup, configuration, and initial launch</li>
            <li>Product catalog management and inventory workflows</li>
            <li>Payment gateway setup and troubleshooting</li>
            <li>App and integration installation and configuration</li>
            <li>Theme customization and minor design fixes</li>
            <li>Shipping and tax configuration</li>
            <li>Platform migration assistance</li>
            <li>Ongoing store maintenance and operational support</li>
            <li>Performance review and optimization recommendations</li>
          </ul>
        </section>

        {/* Add-on pricing */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>Add-On Pricing (for IT clients)</h2>
          <p style={pStyle}>Already on an IT support plan? Add e-commerce support:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
            {addOnPricing.map((tier, i) => (
              <div key={i} style={cardStyle}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)' }}>{tier.name}</div>
                <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: '1.2rem', fontWeight: 600, color: 'var(--teal)', margin: '8px 0' }}>{tier.price}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{tier.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Standalone pricing */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>Standalone Retainer Pricing</h2>
          <p style={pStyle}>E-commerce support without an IT plan:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
            {standalonePricing.map((tier, i) => (
              <div key={i} style={cardStyle}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)' }}>{tier.name}</div>
                <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: '1.2rem', fontWeight: 600, color: 'var(--teal)', margin: '8px 0' }}>{tier.price}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{tier.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Project pricing */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>One-Time Project Pricing</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 12 }}>
            {projectPricing.map((tier, i) => (
              <div key={i} style={cardStyle}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)' }}>{tier.name}</div>
                <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: '1.2rem', fontWeight: 600, color: 'var(--teal)', margin: '8px 0' }}>{tier.range}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{tier.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Important Note</h2>
          <p style={pStyle}>
            Clients pay directly for third-party tools (Shopify apps, Wix apps, payment processors, etc.).
            TechDesk Pro pricing covers scoping, setup, implementation, and ongoing support.
          </p>
        </section>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <a href="/#contact" style={{ ...ctaBtn }}>Request a Free Assessment →</a>
        </div>
      </div>
    </main>
  )
}

const tagStyle = { fontSize: '0.75rem', fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, fontFamily: 'Outfit, sans-serif' }
const h1Style = { fontFamily: "'Source Serif 4', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 600, color: 'var(--ink)', marginBottom: 12, letterSpacing: '-0.02em' }
const h2Style = { fontFamily: "'Source Serif 4', serif", fontSize: '1.35rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }
const pStyle = { fontSize: '0.96rem', color: 'var(--ink-light)', lineHeight: 1.75, marginBottom: 12 }
const ulStyle = { paddingLeft: 20, color: 'var(--ink-light)', lineHeight: 1.75, fontSize: '0.96rem' }
const sectionStyle = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '28px 24px', marginBottom: 18 }
const cardStyle = { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }
const tagBadge = { padding: '6px 14px', borderRadius: 100, background: 'var(--teal-light)', color: 'var(--teal)', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }
const ctaBtn = { display: 'inline-block', padding: '14px 28px', background: 'var(--teal)', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif' }