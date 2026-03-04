'use client'
import { useState, useEffect } from 'react'

const SERVICES = [
  {
    num: '01',
    title: 'E-Commerce Setup & Integration',
    desc: 'New Shopify & Wix stores built from scratch, platform migrations, and full tool integration — Klaviyo, QuickBooks, ShipStation, Zapier, Meta Pixel, and more.',
    features: ['Store setup & launch', 'Payment & shipping config', 'App integrations', 'Platform migrations'],
    price: '$500–$3,000',
    priceNote: 'per project',
  },
  {
    num: '02',
    title: 'Ongoing Store Support',
    desc: 'Your dedicated e-commerce team on retainer. We handle product updates, fix broken features, tweak themes, install apps, and send you monthly performance reports.',
    features: ['Product listing updates', 'Bug fixes & theme tweaks', 'App installs & config', 'Monthly reporting'],
    price: '$400–$1,500',
    priceNote: 'per month',
  },
  {
    num: '03',
    title: 'IT Helpdesk Add-on',
    desc: 'Bundle full IT support with any plan. Email issues, account lockouts, software troubleshooting, remote desktop assistance — one flat monthly fee.',
    features: ['Email & account support', 'Software troubleshooting', 'Remote desktop access', 'Same-day response'],
    price: '+$200',
    priceNote: 'added to any plan',
  },
]

const PLANS = [
  {
    name: 'Starter',
    price: '399',
    desc: 'For new store owners',
    features: ['10 support tickets/mo', 'Store updates & fixes', 'Email support', '24hr response time'],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Growth',
    price: '799',
    desc: 'For active stores',
    features: ['30 support tickets/mo', 'Integrations support', 'Priority support', 'Monthly strategy call', '4hr response time'],
    cta: 'Start Growing',
    featured: true,
  },
  {
    name: 'Scale',
    price: '1,499',
    desc: 'For busy operations',
    features: ['Unlimited tickets', 'Full IT + e-commerce bundle', 'Weekly check-in call', '1hr response time', 'Monthly performance report'],
    cta: "Let's Talk",
    featured: false,
  },
]

const FAQS = [
  { q: 'Do I need to sign a long-term contract?', a: 'No. All plans are month-to-month. You can cancel anytime with 30 days notice.' },
  { q: 'What if I only need IT support or just e-commerce help?', a: 'That works too. Our plans cover both, but we can tailor an arrangement to fit exactly what you need.' },
  { q: 'How do you handle urgent issues?', a: 'Growth and Scale clients get priority queues. Scale clients have a dedicated urgent line with 1-hour response.' },
  { q: 'Can you work with platforms other than Shopify and Wix?', a: 'Yes — we also support WooCommerce, Squarespace, and most major e-commerce platforms.' },
  { q: 'What does a free store audit include?', a: "We review your store's performance, UX, integrations, and SEO — then give you 3 actionable improvements. No strings attached." },
]

const TOOLS = ['Shopify', 'Wix', 'Klaviyo', 'QuickBooks', 'ShipStation', 'Zapier', 'Stripe', 'Google Workspace', 'Microsoft 365', 'Meta Pixel']

const STATS = [
  { val: '< 4hr', label: 'Avg Response' },
  { val: '98%', label: 'Satisfaction' },
  { val: '50+', label: 'Platforms' },
  { val: '$0', label: 'Setup Fee' },
]

const STEPS = [
  { n: '01', t: 'Book a Call', d: 'Free 30-min discovery call. We learn your business and tech setup.' },
  { n: '02', t: 'Custom Plan', d: 'We recommend the right plan based on your actual needs.' },
  { n: '03', t: 'Onboarding', d: 'Support portal set up and tool access granted within 24 hours.' },
  { n: '04', t: 'We Handle It', d: 'Submit tickets anytime. We respond fast and keep you updated.' },
]

const BARS = [
  { label: 'Response Speed', val: 95 },
  { label: 'Issue Resolution', val: 98 },
  { label: 'Client Satisfaction', val: 100 },
  { label: 'Uptime Guarantee', val: 99 },
]

const ABOUT_FEATURES = [
  { icon: '📍', text: 'Stafford, VA based' },
  { icon: '🤖', text: 'AI-powered workflows' },
  { icon: '🛒', text: 'Shopify & Wix expert' },
  { icon: '📋', text: 'No long-term contracts' },
]

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main>
      {/* ——— NAV ——— */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="logo">
            <div className="logo-mark">T</div>
            TechDesk Pro
          </div>
          <ul className="nav-links">
            {['Services', 'Pricing', 'About', 'FAQ'].map((link) => (
              <li key={link} style={{ listStyle: 'none' }}>
                <a onClick={() => scrollTo(link.toLowerCase())}>{link}</a>
              </li>
            ))}
          </ul>
          <div className="nav-actions">
            <a href="/login" style={{ fontSize: '0.88rem', color: 'var(--ink-light)', textDecoration: 'none', fontWeight: 500 }}>Client Portal</a>
            <button className="nav-cta" onClick={() => scrollTo('contact')}>Book a Call</button>
          </div>
          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span /><span /><span />
          </button>
        </div>
        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          {['Services', 'Pricing', 'About', 'FAQ'].map((link) => (
            <a key={link} onClick={() => scrollTo(link.toLowerCase())}>{link}</a>
          ))}
          <a href="/login" style={{ color: 'var(--teal)', fontWeight: 600 }}>Client Portal</a>
          <button
            className="nav-cta"
            style={{ textAlign: 'center', marginTop: 8 }}
            onClick={() => scrollTo('contact')}
          >
            Book a Call
          </button>
        </div>
      </nav>

      {/* ——— HERO ——— */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-tag">Available Nationwide · Based in Stafford, VA</div>
            <h1>
              Your IT Team &amp; <em>E‑Commerce Engine</em> — Without the Overhead.
            </h1>
            <p className="hero-desc">
              AI-powered IT support and Shopify/Wix solutions for small businesses.
              No hiring headaches. No agency markups. Just fast, reliable help when you need it.
            </p>
            <div className="hero-btns">
              <button className="btn-primary" onClick={() => scrollTo('contact')}>
                Book a Free Call →
              </button>
              <button className="btn-secondary" onClick={() => scrollTo('services')}>
                See Services
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="stats-grid">
              {STATS.map((s, i) => (
                <div key={i} className="stat">
                  <div className="stat-val">{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="tools-row">
              <div className="tools-label">Platforms We Support</div>
              <div className="tools-list">
                {TOOLS.map((t) => (
                  <span key={t} className="tool-tag">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— SERVICES ——— */}
      <section id="services" className="section">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-tag">Services</div>
            <h2 className="section-title">One partner for all your tech operations.</h2>
            <p className="section-desc">
              From launching your store to fixing IT headaches — we handle the tech so you can focus on growth.
            </p>
          </div>
          <div className="services-grid">
            {SERVICES.map((s, i) => (
              <div key={i} className="service-card">
                <div className="service-num">{s.num}</div>
                <div>
                  <div className="service-title">{s.title}</div>
                  <p className="service-desc">{s.desc}</p>
                  <div className="service-features">
                    {s.features.map((f, j) => (
                      <span key={j} className="service-feat">{f}</span>
                    ))}
                  </div>
                </div>
                <div className="service-price">
                  <div className="service-price-val">{s.price}</div>
                  <div className="service-price-note">{s.priceNote}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— HOW IT WORKS ——— */}
      <section className="section section-alt">
        <div className="section-inner" style={{ textAlign: 'center' }}>
          <div className="section-tag">How It Works</div>
          <h2 className="section-title">Up and running in 24 hours.</h2>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div key={i} className="step">
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.t}</div>
                <div className="step-desc">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— PRICING ——— */}
      <section id="pricing" className="section">
        <div className="section-inner">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <div className="section-tag">Pricing</div>
            <h2 className="section-title">Simple, transparent pricing.</h2>
            <p className="section-desc" style={{ margin: '12px auto 0' }}>
              No hidden fees. No long contracts. Cancel anytime.
            </p>
          </div>
          <div className="pricing-grid">
            {PLANS.map((plan, i) => (
              <div key={i} className={`plan ${plan.featured ? 'featured' : ''}`}>
                {plan.featured && <div className="plan-badge">Most Popular</div>}
                <div className="plan-name">{plan.name}</div>
                <div className="plan-desc">{plan.desc}</div>
                <div className="plan-price">
                  <span className="plan-dollar">$</span>
                  <span className="plan-amount">{plan.price}</span>
                  <span className="plan-period">/mo</span>
                </div>
                <ul className="plan-features">
                  {plan.features.map((f, j) => (
                    <li key={j}>{f}</li>
                  ))}
                </ul>
                <button
                  className={`plan-btn ${plan.featured ? 'plan-btn-primary' : 'plan-btn-outline'}`}
                  onClick={() => scrollTo('contact')}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
          <p className="pricing-note">
            Project work (new stores, migrations, integrations) is quoted separately.
          </p>
        </div>
      </section>

      {/* ——— ABOUT ——— */}
      <section id="about" className="section section-alt">
        <div className="section-inner">
          <div className="about-grid">
            <div className="about-text">
              <div className="section-tag">About</div>
              <h2 className="section-title" style={{ marginBottom: 16 }}>
                Built for businesses that can&apos;t afford downtime.
              </h2>
              <p>
                TechDesk Pro was founded in Stafford, VA with one mission: give small businesses
                enterprise-grade tech support without the enterprise price tag.
              </p>
              <p className="muted">
                We combine hands-on expertise with cutting-edge AI tools to resolve issues faster,
                build smarter integrations, and keep your operations running smoothly.
              </p>
              <div className="about-features">
                {ABOUT_FEATURES.map((f, i) => (
                  <div key={i} className="about-feat">
                    <div className="about-feat-icon">{f.icon}</div>
                    <span>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="about-card">
              <div className="about-card-label">Performance</div>
              {BARS.map((b, i) => (
                <div key={i} className="bar-group">
                  <div className="bar-label">
                    <span className="bar-label-text">{b.label}</span>
                    <span className="bar-label-val">{b.val}%</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${b.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ——— FAQ ——— */}
      <section id="faq" className="section">
        <div className="section-inner">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <div className="section-tag">FAQ</div>
            <h2 className="section-title">Common questions.</h2>
          </div>
          <div className="faq-list">
            {FAQS.map((faq, i) => (
              <div key={i} className="faq-item">
                <button
                  className="faq-q"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <span className={`faq-arrow ${openFaq === i ? 'open' : ''}`}>+</span>
                </button>
                {openFaq === i && <div className="faq-a">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— CONTACT CTA ——— */}
      <section id="contact" className="cta-section">
        <div className="cta-card">
          <h2>Ready to fix your tech problems for good?</h2>
          <p>
            Book a free 30-minute discovery call. No pressure, no pitch — just an honest
            conversation about what you need.
          </p>
          <div className="cta-btns">
            <a
              href="https://calendly.com"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn-white"
            >
              Book Free Call →
            </a>
            <a href="mailto:hello@yourdomain.com" className="cta-btn-ghost">
              Send an Email
            </a>
          </div>
          <div className="cta-info">
            <span>📍 Stafford, VA</span>
            <span>✉️ hello@yourdomain.com</span>
            <span>Mon–Fri, 9am–6pm ET</span>
          </div>
        </div>
      </section>

      {/* ——— FOOTER ——— */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="logo" style={{ fontSize: '1rem' }}>
            <div className="logo-mark" style={{ width: 28, height: 28, fontSize: '0.75rem', borderRadius: 7 }}>
              T
            </div>
            TechDesk Pro
          </div>
          <div className="footer-links">
            {['Services', 'Pricing', 'About', 'Contact'].map((link) => (
              <a key={link} onClick={() => scrollTo(link.toLowerCase())}>{link}</a>
            ))}
            <a href="/login" style={{ color: 'var(--teal)' }}>Client Portal</a>
          </div>
          <div className="footer-copy">© 2025 TechDesk Pro. Stafford, VA.</div>
        </div>
      </footer>
    </main>
  )
}