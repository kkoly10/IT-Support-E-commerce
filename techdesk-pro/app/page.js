'use client'
import { useState, useEffect } from 'react'

const CORE_SERVICES = [
  {
    num: '01',
    title: 'IT Helpdesk & User Support',
    desc: 'Remote-first support for the day-to-day issues that slow teams down — login problems, email issues, software troubleshooting, device guidance, and routine user support.',
    features: [
      'Email & account support',
      'Software troubleshooting',
      'Remote desktop help',
      'Device guidance',
      'Routine user support',
    ],
    price: 'Included',
    priceNote: 'in monthly plans',
  },
  {
    num: '02',
    title: 'Cloud & SaaS Administration',
    desc: 'Support for the platforms your business already depends on — Google Workspace, Microsoft 365, Slack, Zoom, shared drives, permissions, and routine admin tasks.',
    features: [
      'Google Workspace & M365',
      'User provisioning',
      'Permission management',
      'Routine admin help',
      'Cloud environment guidance',
    ],
    price: 'Included',
    priceNote: 'in Growth+',
  },
  {
    num: '03',
    title: 'Ongoing Remote Technical Support',
    desc: 'Structured support for small teams that need consistent help without hiring a full internal IT person. We help keep accounts, users, and day-to-day systems moving.',
    features: [
      'Remote-only service delivery',
      'Team onboarding/offboarding support',
      'Support request handling',
      'Business-hours response model',
      'Escalation guidance when needed',
    ],
    price: 'Included',
    priceNote: 'in active support plans',
  },
]

const PLANS = [
  {
    name: 'Starter',
    price: '499',
    desc: 'Best for 1–5 users',
    features: [
      'Up to 10 standard support tickets per month',
      'Business-hours remote IT helpdesk support',
      'Email, login, and account troubleshooting',
      'Remote software and device guidance',
      'Client portal access',
      'First response within 1 business day',
    ],
    cta: 'Book Free Assessment',
    featured: false,
  },
  {
    name: 'Growth',
    price: '999',
    desc: 'Best for 5–15 users',
    features: [
      'Up to 30 standard support tickets per month',
      'Business-hours remote IT helpdesk support',
      'Cloud & SaaS administration',
      'User onboarding and offboarding support',
      'Routine admin help for supported platforms',
      'Monthly review call',
      'First response within 4 business hours',
    ],
    cta: 'Start with Growth',
    featured: true,
  },
  {
    name: 'Scale',
    priceLabel: 'Starting at',
    price: '1,999',
    desc: 'Best for 15+ users or more complex environments',
    features: [
      'Custom support volume based on team size and environment',
      'Priority business-hours remote support',
      'Broader cloud and systems administration',
      'Structured coordination across business tools',
      'Optional security-focused support',
      'Strategic check-ins',
      'First response within 2 business hours',
    ],
    cta: 'Talk About Scale',
    featured: false,
  },
]

const FAQS = [
  {
    q: 'Do I need a long-term contract?',
    a: 'No. Monthly support plans are designed to be straightforward and flexible. Final billing, notice periods, and service terms are governed by your written agreement.',
  },
  {
    q: 'What counts as a support ticket?',
    a: 'A standard support ticket is one routine request for help involving one issue, one user, or one related service interruption requiring review, triage, and action.',
  },
  {
    q: 'What is not included as a standard ticket?',
    a: 'Large projects, migrations, major remediation, planned after-hours work, onsite work, and custom build work are scoped separately unless specifically included in a written agreement.',
  },
  {
    q: 'What counts as an emergency?',
    a: 'An emergency is a business-critical outage, suspected security incident, or major service disruption with material operational impact and no reasonable workaround. Routine one-user issues usually do not qualify as emergencies.',
  },
  {
    q: 'How does AI fit into the service?',
    a: 'We use AI-assisted tools to speed up triage, organize requests, and help surface answers faster. Human oversight remains part of service delivery.',
  },
  {
    q: 'Do you provide on-site support?',
    a: 'TechDesk Pro is currently a remote-only service. On-site support is not part of the standard offering at this stage.',
  },
]

const TOOLS = [
  'Google Workspace',
  'Microsoft 365',
  'Slack',
  'Zoom',
  'QuickBooks',
  'Dropbox',
  'Notion',
  'Adobe',
]

const HERO_POINTS = [
  { title: 'Business-hours support', desc: 'Monday–Friday, 9:00 AM–6:00 PM ET' },
  { title: 'Remote-only model', desc: 'Built for U.S. small businesses that need practical technical support without an internal IT team' },
  { title: 'Clear scope boundaries', desc: 'Standard support and larger project work are defined separately' },
  { title: 'Human-supervised AI', desc: 'AI helps speed up workflows, but human oversight remains part of delivery' },
]

const BEST_FIT = [
  '1–25 user teams',
  'Remote-first businesses',
  'Google Workspace or Microsoft 365 environments',
  'Businesses that need reliable day-to-day support',
]

const STEPS = [
  {
    n: '01',
    t: 'Request a Free Assessment',
    d: 'Tell us about your business, tools, and support needs so we can understand the environment you are working with.',
  },
  {
    n: '02',
    t: 'Get a Clear Recommendation',
    d: 'We recommend the right support path based on team size, support volume, and complexity.',
  },
  {
    n: '03',
    t: 'Onboard Your Team',
    d: 'We align on access, support scope, communication flow, and the platforms that will be supported.',
  },
  {
    n: '04',
    t: 'Use Support as Needed',
    d: 'Submit routine support requests through the portal and keep your day-to-day operations moving.',
  },
]

const ASSESSMENT_FLOW = [
  {
    n: '01',
    t: 'We review your current setup',
    d: 'We look at your tools, support needs, team size, and recurring technical friction points.',
  },
  {
    n: '02',
    t: 'We recommend the right support path',
    d: 'You get a sensible recommendation instead of being pushed into the biggest plan.',
  },
  {
    n: '03',
    t: 'You decide whether to move forward',
    d: 'No-pressure next step. Move ahead only if the scope and approach make sense for your business.',
  },
]

const ABOUT_FEATURES = [
  { icon: '📍', text: 'Founder-led, based in Virginia' },
  { icon: '💻', text: 'Remote-only support model' },
  { icon: '🤖', text: 'AI-assisted, human-supervised workflows' },
  { icon: '📋', text: 'Clear support boundaries and scoped work' },
]

const ABOUT_BARS = [
  { label: 'Clarity of scope', val: 100 },
  { label: 'Remote-only delivery', val: 100 },
  { label: 'Human oversight', val: 100 },
  { label: 'Pilot-stage honesty', val: 100 },
]

const FOUNDER_PROOF = [
  {
    title: 'Founder-led support model',
    desc: 'Built by a founder actively developing the public site, client portal, admin workflows, and AI-assisted support systems behind the service.',
  },
  {
    title: 'Platform-minded operations',
    desc: 'The business is designed around actual workflows — tickets, portal access, documents, and operational visibility — not just marketing copy.',
  },
  {
    title: 'Practical over performative',
    desc: 'Where client performance history is still being built, the site prioritizes clear service boundaries and realistic expectations over inflated claims.',
  },
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
            <a
              href="/login"
              style={{
                fontSize: '0.88rem',
                color: 'var(--ink-light)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Client Portal
            </a>
            <button className="nav-cta" onClick={() => scrollTo('contact')}>
              Free Assessment
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
          {['Services', 'Pricing', 'About', 'FAQ'].map((link) => (
            <a key={link} onClick={() => scrollTo(link.toLowerCase())}>
              {link}
            </a>
          ))}
          <a href="/login" style={{ color: 'var(--teal)', fontWeight: 600 }}>
            Client Portal
          </a>
          <button
            className="nav-cta"
            style={{ textAlign: 'center', marginTop: 8 }}
            onClick={() => scrollTo('contact')}
          >
            Free Assessment
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-tag">Remote-Only IT Support · U.S. Small Businesses</div>

            <h1>
              Remote-first IT support and <em>cloud administration</em> for small businesses.
            </h1>

            <p className="hero-desc">
              TechDesk Pro helps small businesses handle day-to-day technical support, user issues,
              and cloud administration without hiring a full internal IT team — with AI-assisted
              workflows, human oversight, and clear service boundaries.
            </p>

            <div className="hero-btns">
              <button className="btn-primary" onClick={() => scrollTo('contact')}>
                Request Free Assessment →
              </button>
              <button className="btn-secondary" onClick={() => scrollTo('services')}>
                See Services
              </button>
            </div>

            <div
              style={{
                marginTop: 20,
                fontSize: '0.88rem',
                color: 'var(--ink-muted)',
                lineHeight: 1.7,
                maxWidth: 560,
              }}
            >
              Need help with support scope details instead?{' '}
              <a
                href="/support-transparency"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--teal)', fontWeight: 600, textDecoration: 'none' }}
              >
                View Support Scope
              </a>
              .
            </div>
          </div>

          <div className="hero-visual">
            <div className="section-tag" style={{ marginBottom: 16 }}>
              How TechDesk Pro Works
            </div>

            <div className="stats-grid">
              {HERO_POINTS.map((item, i) => (
                <div key={i} className="stat" style={{ textAlign: 'left' }}>
                  <div
                    style={{
                      fontFamily: "'Source Serif 4', serif",
                      fontSize: '1.05rem',
                      fontWeight: 600,
                      color: 'var(--ink)',
                      marginBottom: 6,
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--ink-muted)',
                      lineHeight: 1.6,
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>

            <div className="tools-row">
              <div className="tools-label">Supported Platforms</div>
              <div className="tools-list">
                {TOOLS.map((tool) => (
                  <span key={tool} className="tool-tag">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="section-inner">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: 32 }}>
            <div className="section-tag">Best Fit</div>
            <h2 className="section-title">Built for businesses that need practical support without full-time internal IT.</h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            {BEST_FIT.map((item, i) => (
              <div
                key={i}
                className="stat"
                style={{
                  padding: 22,
                  textAlign: 'center',
                  borderRadius: 16,
                }}
              >
                <div
                  style={{
                    fontFamily: "'Source Serif 4', serif",
                    fontSize: '1.02rem',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    lineHeight: 1.45,
                  }}
                >
                  {item}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="section">
        <div className="section-inner">
          <div className="section-header">
            <div className="section-tag">Core Services</div>
            <h2 className="section-title">Remote support for the systems your business depends on.</h2>
            <p className="section-desc">
              TechDesk Pro is focused on remote IT support, cloud administration, and routine
              technical help for small businesses that need dependable support without building a
              full in-house IT team.
            </p>
          </div>

          <div className="services-grid">
            {CORE_SERVICES.map((s, i) => (
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

      <section className="section section-alt">
        <div className="section-inner" style={{ textAlign: 'center' }}>
          <div className="section-tag">How It Works</div>
          <h2 className="section-title">A simple support path from assessment to ongoing help.</h2>
          <p className="section-desc" style={{ margin: '12px auto 0' }}>
            We keep the process straightforward: assess the environment, recommend the right support
            path, onboard carefully, and define where standard support ends and larger scoped work begins.
          </p>

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

      <section className="section">
        <div className="section-inner">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <div className="section-tag">What Happens Next</div>
            <h2 className="section-title">A free assessment is a conversation, not a trap.</h2>
            <p className="section-desc" style={{ margin: '12px auto 0' }}>
              The goal is to understand your setup, recommend the most sensible support path, and let you
              decide whether moving forward makes sense.
            </p>
          </div>

          <div className="steps">
            {ASSESSMENT_FLOW.map((item, i) => (
              <div key={i} className="step">
                <div className="step-num">{item.n}</div>
                <div className="step-title">{item.t}</div>
                <div className="step-desc">{item.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="section-inner">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <div className="section-tag">Need Build Work Instead?</div>
            <h2 className="section-title">Support scope stays focused on remote IT and cloud/SaaS operations.</h2>
            <p className="section-desc" style={{ margin: '12px auto 0' }}>
              TechDesk Pro focuses on remote IT support requests, cloud/SaaS admin work, and lifecycle-aware client support operations.
            </p>
          </div>

          <div className="pricing-grid" style={{ maxWidth: 720, margin: '0 auto' }}>
            <div className="plan featured">
              <div className="plan-badge">Related Service</div>
              <div className="plan-name">Support Scope Policy</div>
              <div className="plan-desc">
                Support operations guidance for businesses that
                need implementation work instead of remote IT support.
              </div>
              <ul className="plan-features">
                <li>Website design & builds</li>
                <li>Major migrations and implementations</li>
                <li>Structured project work outside routine support</li>
                <li>Project-based implementation work</li>
              </ul>
              <a
                href="/support-transparency"
                target="_blank"
                rel="noopener noreferrer"
                className="plan-btn plan-btn-primary"
              >
                View Support Scope
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="section">
        <div className="section-inner">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <div className="section-tag">Pricing</div>
            <h2 className="section-title">Simple monthly remote support for growing businesses.</h2>
            <p className="section-desc" style={{ margin: '12px auto 0' }}>
              Choose the plan that fits your team size and support needs. Standard remote support is billed
              monthly. Larger projects, migrations, and major remediation are scoped separately.
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

                {plan.priceLabel ? (
                  <div
                    style={{
                      marginTop: -18,
                      marginBottom: 24,
                      fontSize: '0.82rem',
                      color: 'var(--ink-muted)',
                      fontWeight: 500,
                    }}
                  >
                    {plan.priceLabel}
                  </div>
                ) : null}

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
            Not sure which plan fits? Start with a free assessment and we’ll recommend the most sensible support path.
          </p>
          <p className="pricing-note" style={{ marginTop: 8 }}>
            Major implementation projects are not part of TechDesk Pro&apos;s standard support scope.
          </p>
        </div>
      </section>

      <section className="section section-alt">
        <div className="section-inner">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <div className="section-tag">Why This Approach</div>
            <h2 className="section-title">Founder-led, platform-minded, and built around real support operations.</h2>
            <p className="section-desc" style={{ margin: '12px auto 0' }}>
              TechDesk Pro is being built as an actual support platform — not just a sales page —
              with client access, admin workflows, documents, and AI-assisted support systems behind it.
            </p>
          </div>

          <div className="pricing-grid" style={{ alignItems: 'stretch' }}>
            {FOUNDER_PROOF.map((item, i) => (
              <div key={i} className="plan">
                <div className="plan-name" style={{ fontSize: '1.28rem' }}>
                  {item.title}
                </div>
                <div className="plan-desc" style={{ marginTop: 12, lineHeight: 1.75 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="section">
        <div className="section-inner">
          <div className="about-grid">
            <div className="about-text">
              <div className="section-tag">About</div>
              <h2 className="section-title" style={{ marginBottom: 16 }}>
                Built for businesses that need clarity, not tech chaos.
              </h2>

              <p>
                TechDesk Pro is a remote-only support business built to help small businesses
                manage day-to-day technical issues, user support, and cloud tools without hiring
                a full internal IT team.
              </p>

              <p className="muted">
                The approach is practical: clear monthly plans, honest service boundaries, AI-assisted
                workflows where helpful, and human oversight throughout delivery. The goal is not to
                sound bigger than reality — it is to provide structured, dependable support that businesses
                can actually use.
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
              <div className="about-card-label">What we prioritize</div>
              {ABOUT_BARS.map((b, i) => (
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

              <div
                style={{
                  marginTop: 24,
                  paddingTop: 20,
                  borderTop: '1px solid var(--border-light)',
                  fontSize: '0.88rem',
                  color: 'var(--ink-muted)',
                  lineHeight: 1.7,
                }}
              >
                Public metrics are intentionally conservative. Where performance data is not yet backed
                by real client history, the site prioritizes process clarity over inflated claims.
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <section id="contact" className="cta-section">
        <div className="cta-card">
          <h2>Ready to improve your remote support operations?</h2>
          <p>
            Start with a free assessment. We’ll review your current support needs, tools, and
            operational pain points, then recommend the most sensible next step.
          </p>

          <div className="cta-btns">
            <button
              className="cta-btn-white"
              onClick={() => window.location.assign('/free-assessment')}
            >
              Start Free Assessment
            </button>
            <a href="mailto:hello@techdeskpro.com" className="cta-btn-ghost">
              Send an Email
            </a>
          </div>

          <div className="cta-info">
            <span>Remote-only, U.S. small businesses</span>
            <span>hello@techdeskpro.com</span>
            <span>Mon–Fri, 9am–6pm ET</span>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="logo" style={{ fontSize: '1rem' }}>
            <div
              className="logo-mark"
              style={{ width: 28, height: 28, fontSize: '0.75rem', borderRadius: 7 }}
            >
              T
            </div>
            TechDesk Pro
          </div>

          <div className="footer-links">
            {['Services', 'Pricing', 'About', 'Contact'].map((link) => (
              <a key={link} onClick={() => scrollTo(link.toLowerCase())}>
                {link}
              </a>
            ))}
            <a href="/support-transparency">Support &amp; AI Transparency</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a
              href="/support-transparency"
              target="_blank"
              rel="noopener noreferrer"
            >
              Support Scope
            </a>
            <a href="/login" style={{ color: 'var(--teal)' }}>
              Client Portal
            </a>
          </div>

          <div className="footer-copy">© 2026 TechDesk Pro. Remote-only, based in Virginia.</div>
        </div>
      </footer>
    </main>
  )
}