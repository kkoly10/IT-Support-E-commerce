'use client'
import { useEffect, useState } from 'react'

const SERVICE_BLOCKS = [
  {
    num: '01',
    title: 'Store Support & Maintenance',
    desc: 'Ongoing help for businesses that already sell online and need reliable monthly support for store operations, fixes, updates, and routine upkeep.',
    features: [
      'Product and content updates',
      'App configuration help',
      'Checkout and payment troubleshooting',
      'Minor store fixes',
      'Operational support',
    ],
    price: 'From $450/mo',
    priceNote: 'standalone support',
  },
  {
    num: '02',
    title: 'Platform Integrations',
    desc: 'Connect your store to the tools your business depends on, including email marketing, accounting, fulfillment, payment, reporting, and workflow tools.',
    features: [
      'App and platform integrations',
      'Payment gateway setup',
      'Inventory workflow support',
      'Operational tool connections',
      'Integration troubleshooting',
    ],
    price: 'From $750',
    priceNote: 'project-based',
  },
  {
    num: '03',
    title: 'Store Setup, Cleanup & Migration',
    desc: 'Launch a new store, improve an existing one, or move from one platform to another with a cleaner operational setup and better day-to-day usability.',
    features: [
      'Store setup support',
      'Store cleanup and improvement',
      'Platform migration help',
      'Operational configuration',
      'Launch readiness support',
    ],
    price: 'From $1,500',
    priceNote: 'project-based',
  },
]

const PRICING_OPTIONS = [
  {
    name: 'Add-On for IT Clients',
    desc: 'For businesses already using TechDesk Pro for core support',
    price: 'From $250/mo',
    features: [
      'Best for light store support',
      'Operational add-on to an existing support plan',
      'Good fit for simple updates and minor support requests',
      'More advanced needs scoped separately',
    ],
  },
  {
    name: 'Standalone Store Support',
    desc: 'For businesses that want e-commerce help without monthly IT support',
    price: 'From $450/mo',
    features: [
      'Store support and maintenance',
      'Routine troubleshooting',
      'App and configuration help',
      'Operational support for one active store',
    ],
    featured: true,
  },
  {
    name: 'One-Time Projects',
    desc: 'For setup, migration, integrations, or larger store improvements',
    price: 'From $750',
    features: [
      'Store setup and cleanup work',
      'Integrations and workflow builds',
      'Migration and launch support',
      'Quoted based on scope and complexity',
    ],
  },
]

const PLATFORM_TAGS = [
  'Shopify',
  'Wix',
  'WooCommerce',
  'Stripe',
  'QuickBooks',
  'Zapier',
  'Klaviyo',
  'Meta Pixel',
  'ShipStation',
]

const WHO_ITS_FOR = [
  {
    title: 'Online businesses that need help beyond the storefront',
    desc: 'Not just design — operational support, fixes, workflows, and system connections.',
  },
  {
    title: 'Teams managing too much manually',
    desc: 'A good fit for stores struggling with repetitive admin work, broken handoffs, and disconnected tools.',
  },
  {
    title: 'Businesses that need support without hiring full-time help',
    desc: 'Ideal for owners and lean teams that need practical execution without building a full internal ops team.',
  },
]

const FAQS = [
  {
    q: 'Do I need to be an IT support client to use your e-commerce services?',
    a: 'No. E-commerce support can be provided as a standalone service or as an add-on to a monthly TechDesk Pro support plan.',
  },
  {
    q: 'What platforms do you support?',
    a: 'We focus on practical support around platforms such as Shopify, Wix, WooCommerce, and related operational tools used for payments, reporting, fulfillment, and workflow support.',
  },
  {
    q: 'Do you build full custom stores?',
    a: 'This service line is focused on setup help, integrations, operational support, maintenance, and scoped store improvement work. Larger custom builds are quoted separately if taken on.',
  },
  {
    q: 'Is this monthly support or project work?',
    a: 'It can be either. Routine e-commerce support can be structured as a retainer, while setup, migration, and integration work is typically scoped as a project.',
  },
  {
    q: 'Do you handle marketing or ad management?',
    a: 'No. This service is positioned around store operations, integrations, platform support, and workflow improvement — not full-service marketing or ad buying.',
  },
]

export default function EcommercePage() {
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
          <a href="/" className="logo" style={{ textDecoration: 'none' }}>
            <div className="logo-mark">T</div>
            TechDesk Pro
          </a>

          <ul className="nav-links">
            {['Services', 'Pricing', 'FAQ', 'Contact'].map((link) => (
              <li key={link} style={{ listStyle: 'none' }}>
                <a onClick={() => scrollTo(link.toLowerCase())}>{link}</a>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            <a
              href="/"
              style={{
                fontSize: '0.88rem',
                color: 'var(--ink-light)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Back to Main Site
            </a>
            <button className="nav-cta" onClick={() => scrollTo('contact')}>
              E-Commerce Assessment
            </button>
          </div>

          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open navigation menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          {['Services', 'Pricing', 'FAQ', 'Contact'].map((link) => (
            <a key={link} onClick={() => scrollTo(link.toLowerCase())}>
              {link}
            </a>
          ))}
          <a href="/" style={{ color: 'var(--teal)', fontWeight: 600 }}>
            Back to Main Site
          </a>
          <button
            className="nav-cta"
            style={{ textAlign: 'center', marginTop: 8 }}
            onClick={() => scrollTo('contact')}
          >
            E-Commerce Assessment
          </button>
        </div>
      </nav>

      {/* ——— HERO ——— */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-tag">Specialized Service · E-Commerce Operations</div>

            <h1>
              E-commerce support and integrations for <em>growing online businesses</em>.
            </h1>

            <p className="hero-desc">
              We help businesses launch, fix, connect, and support the systems behind online
              selling — from store setup help and integrations to monthly store operations support.
            </p>

            <div className="hero-btns">
              <button className="btn-primary" onClick={() => scrollTo('contact')}>
                Book E-Commerce Assessment →
              </button>
              <button className="btn-secondary" onClick={() => scrollTo('services')}>
                See E-Commerce Services
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="section-tag" style={{ marginBottom: 16 }}>
              Best Fit
            </div>

            <div
              style={{
                display: 'grid',
                gap: 14,
              }}
            >
              {WHO_ITS_FOR.map((item, i) => (
                <div key={i} className="stat" style={{ textAlign: 'left' }}>
                  <div
                    style={{
                      fontFamily: "'Source Serif 4', serif",
                      fontSize: '1.02rem',
                      fontWeight: 600,
                      color: 'var(--ink)',
                      marginBottom: 6,
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.83rem',
                      color: 'var(--ink-muted)',
                      lineHeight: 1.65,
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>

            <div className="tools-row">
              <div className="tools-label">Platforms & Tools</div>
              <div className="tools-list">
                {PLATFORM_TAGS.map((tag) => (
                  <span key={tag} className="tool-tag">
                    {tag}
                  </span>
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
            <h2 className="section-title">Operational support for the systems behind online selling.</h2>
            <p className="section-desc">
              This service line is built for businesses that need help with store support,
              operational fixes, integrations, and launch-related work — without hiring a full
              in-house e-commerce operations team.
            </p>
          </div>

          <div className="services-grid">
            {SERVICE_BLOCKS.map((s, i) => (
              <div key={i} className="service-card">
                <div className="service-num">{s.num}</div>

                <div>
                  <div className="service-title">{s.title}</div>
                  <p className="service-desc">{s.desc}</p>
                  <div className="service-features">
                    {s.features.map((f, j) => (
                      <span key={j} className="service-feat">
                        {f}
                      </span>
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

      {/* ——— HOW PRICING WORKS ——— */}
      <section className="section section-alt">
        <div className="section-inner" style={{ textAlign: 'center' }}>
          <div className="section-tag">How Pricing Works</div>
          <h2 className="section-title">Choose the structure that fits the kind of help you need.</h2>
          <p className="section-desc" style={{ margin: '12px auto 0' }}>
            E-commerce support can be added to a monthly TechDesk Pro support plan, purchased as a
            standalone retainer, or scoped as one-time project work.
          </p>

          <div className="pricing-grid" style={{ marginTop: 48 }}>
            {PRICING_OPTIONS.map((option, i) => (
              <div key={i} className={`plan ${option.featured ? 'featured' : ''}`}>
                {option.featured && <div className="plan-badge">Most Flexible</div>}

                <div className="plan-name">{option.name}</div>
                <div className="plan-desc">{option.desc}</div>

                <div
                  style={{
                    fontFamily: "'Source Serif 4', serif",
                    fontSize: '2.6rem',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    lineHeight: 1.05,
                    marginBottom: 28,
                    paddingBottom: 24,
                    borderBottom: '1px solid var(--border-light)',
                  }}
                >
                  {option.price}
                </div>

                <ul className="plan-features">
                  {option.features.map((f, j) => (
                    <li key={j}>{f}</li>
                  ))}
                </ul>

                <button
                  className={`plan-btn ${option.featured ? 'plan-btn-primary' : 'plan-btn-outline'}`}
                  onClick={() => scrollTo('contact')}
                >
                  Discuss This Option
                </button>
              </div>
            ))}
          </div>

          <p className="pricing-note">
            Final pricing depends on store complexity, volume of work, platform stack, and whether
            support is one-time, recurring, or part of a broader TechDesk Pro plan.
          </p>
        </div>
      </section>

      {/* ——— WHO THIS IS FOR ——— */}
      <section className="section">
        <div className="section-inner">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <div className="section-tag">Who It’s For</div>
            <h2 className="section-title">Built for businesses that need practical e-commerce help.</h2>
            <p className="section-desc" style={{ margin: '12px auto 0' }}>
              This offering works best for teams that already sell online, are preparing to sell
              online, or need operational help keeping their store systems running smoothly.
            </p>
          </div>

          <div className="steps">
            {[
              {
                n: '01',
                t: 'Store Owners',
                d: 'You need support beyond basic storefront edits and want help with the systems behind day-to-day store operations.',
              },
              {
                n: '02',
                t: 'Growing Teams',
                d: 'You are adding tools, apps, and workflows and want a cleaner way to manage them without doing everything manually.',
              },
              {
                n: '03',
                t: 'Operationally Stuck Stores',
                d: 'Your store works, but things are messy behind the scenes — payments, inventory flows, reporting, or platform setup.',
              },
              {
                n: '04',
                t: 'Businesses Needing Scoped Help',
                d: 'You need a project for setup, cleanup, integration, or migration rather than a full long-term agency relationship.',
              },
            ].map((item, i) => (
              <div key={i} className="step">
                <div className="step-num">{item.n}</div>
                <div className="step-title">{item.t}</div>
                <div className="step-desc">{item.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— FAQ ——— */}
      <section id="faq" className="section section-alt">
        <div className="section-inner">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <div className="section-tag">FAQ</div>
            <h2 className="section-title">Common questions.</h2>
          </div>

          <div className="faq-list">
            {FAQS.map((faq, i) => (
              <div key={i} className="faq-item">
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
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
          <h2>Need help with your store systems?</h2>
          <p>
            Start with an e-commerce assessment. We’ll look at your current setup, platform stack,
            and operational pain points, then recommend the most sensible next step.
          </p>

          <div className="cta-btns">
            <a href="mailto:hello@techdeskpro.com?subject=E-Commerce%20Assessment" className="cta-btn-white">
              Request E-Commerce Assessment →
            </a>
            <a href="/" className="cta-btn-ghost">
              Back to Main Services
            </a>
          </div>

          <div className="cta-info">
            <span>Remote-first support</span>
            <span>hello@techdeskpro.com</span>
            <span>Project and retainer options available</span>
          </div>
        </div>
      </section>

      {/* ——— FOOTER ——— */}
      <footer className="footer">
        <div className="footer-inner">
          <a href="/" className="logo" style={{ fontSize: '1rem', textDecoration: 'none' }}>
            <div
              className="logo-mark"
              style={{ width: 28, height: 28, fontSize: '0.75rem', borderRadius: 7 }}
            >
              T
            </div>
            TechDesk Pro
          </a>

          <div className="footer-links">
            <a href="/">Main IT Services</a>
            <a href="/automation">Automation Services</a>
            <a href="/support-transparency">Support &amp; AI Transparency</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/login" style={{ color: 'var(--teal)' }}>
              Client Portal
            </a>
          </div>

          <div className="footer-copy">© 2026 TechDesk Pro. E-commerce support & integrations.</div>
        </div>
      </footer>
    </main>
  )
}