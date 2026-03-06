'use client'
import { useEffect, useState } from 'react'

const SERVICE_BLOCKS = [
  {
    num: '01',
    title: 'Workflow Audits',
    desc: 'Review the repetitive tasks, disconnected tools, and manual handoffs slowing your business down. We identify where automation makes sense and where a simpler process fix may be better.',
    features: [
      'Process review',
      'Workflow bottleneck analysis',
      'Tool-stack review',
      'Automation opportunity mapping',
      'Practical next-step recommendations',
    ],
    price: 'From $250',
    priceNote: 'assessment',
  },
  {
    num: '02',
    title: 'Automation Builds',
    desc: 'Design and implement scoped workflows for intake, routing, notifications, data movement, document handling, reporting, and other repetitive operational tasks.',
    features: [
      'Intake and routing workflows',
      'Notifications and status updates',
      'Data handoff automation',
      'Document and form workflows',
      'Operational workflow builds',
    ],
    price: 'From $750',
    priceNote: 'project-based',
  },
  {
    num: '03',
    title: 'Ongoing Maintenance',
    desc: 'Keep existing automations working as your tools, processes, and business needs change. Best for businesses that already rely on connected workflows and need ongoing support.',
    features: [
      'Automation monitoring',
      'Broken workflow fixes',
      'Light updates and tune-ups',
      'Connection maintenance',
      'Change support as processes evolve',
    ],
    price: 'From $150/mo',
    priceNote: 'add-on support',
  },
]

const PRICING_OPTIONS = [
  {
    name: 'Workflow Audit',
    desc: 'Best for businesses still figuring out where automation would actually help',
    price: '$250',
    features: [
      'Review current workflow pain points',
      'Identify manual tasks worth fixing',
      'Recommend practical next steps',
      'Can be credited toward approved project work',
    ],
  },
  {
    name: 'Automation Projects',
    desc: 'Best for businesses ready to build a defined workflow',
    price: 'From $750',
    features: [
      'Scoped build based on business need',
      'Quoted by complexity and tool stack',
      'Good fit for intake, routing, reporting, and admin flows',
      'Larger multi-step systems quoted separately',
    ],
    featured: true,
  },
  {
    name: 'Maintenance & Support',
    desc: 'Best for businesses with existing workflows that need upkeep',
    price: 'From $150/mo',
    features: [
      'Available as an add-on or standalone support',
      'Fix broken connections and light issues',
      'Small updates and workflow tuning',
      'Larger rebuilds scoped separately',
    ],
  },
]

const TOOL_TAGS = [
  'Zapier',
  'Make',
  'Google Sheets',
  'Notion',
  'Slack',
  'Stripe',
  'QuickBooks',
  'HubSpot',
  'Shopify',
  'Email workflows',
]

const USE_CASES = [
  {
    title: 'Businesses buried in repetitive admin work',
    desc: 'A strong fit for teams copying data between tools, re-entering information, or managing too many manual handoffs.',
  },
  {
    title: 'Teams with disconnected systems',
    desc: 'Useful when forms, inboxes, spreadsheets, portals, and core apps are not working together cleanly.',
  },
  {
    title: 'Operators who need practical workflows, not hype',
    desc: 'Best for businesses that want AI-assisted automation where it helps, while keeping human oversight and process clarity.',
  },
]

const FAQS = [
  {
    q: 'What kinds of workflows do you automate?',
    a: 'Typical examples include intake routing, notifications, document handling, data transfer between tools, status updates, repetitive admin flows, and reporting support.',
  },
  {
    q: 'Do you charge monthly or per project?',
    a: 'Automation work is usually scoped as an assessment plus project fee, with optional monthly maintenance if ongoing support is needed.',
  },
  {
    q: 'Do you include third-party software costs?',
    a: 'No. Clients typically pay directly for third-party software such as automation platforms, store apps, or other tools. Our fees cover scoping, setup, implementation, and support.',
  },
  {
    q: 'Does AI run everything automatically?',
    a: 'No. We use AI-assisted tools where useful for classification, drafting, extraction, routing, or process support, but human oversight remains part of the workflow design and service delivery.',
  },
  {
    q: 'Can this be added to ongoing IT support?',
    a: 'Yes. Automation services can be scoped as separate projects or added onto a broader TechDesk Pro relationship when appropriate.',
  },
]

export default function AutomationPage() {
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
              Workflow Assessment
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
            Workflow Assessment
          </button>
        </div>
      </nav>

      {/* ——— HERO ——— */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-tag">Specialized Service · AI Workflow Automation</div>

            <h1>
              AI workflow automation for businesses doing <em>too much manually</em>.
            </h1>

            <p className="hero-desc">
              We help businesses reduce repetitive admin work, improve handoffs, and build more
              efficient operational workflows — with AI-assisted systems where useful and human
              oversight where it matters.
            </p>

            <div className="hero-btns">
              <button className="btn-primary" onClick={() => scrollTo('contact')}>
                Book Workflow Assessment →
              </button>
              <button className="btn-secondary" onClick={() => scrollTo('services')}>
                See Automation Services
              </button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="section-tag" style={{ marginBottom: 16 }}>
              Best Fit
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              {USE_CASES.map((item, i) => (
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
              <div className="tools-label">Tools & Workflow Environments</div>
              <div className="tools-list">
                {TOOL_TAGS.map((tag) => (
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
            <h2 className="section-title">Practical workflow systems for growing operations.</h2>
            <p className="section-desc">
              This service line is built for businesses that need more than advice. We help audit,
              design, implement, and maintain operational workflows that reduce manual work and make
              day-to-day processes more reliable.
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

      {/* ——— PRICING ——— */}
      <section id="pricing" className="section section-alt">
        <div className="section-inner" style={{ textAlign: 'center' }}>
          <div className="section-tag">How Pricing Works</div>
          <h2 className="section-title">Assessment first, then scoped build or support.</h2>
          <p className="section-desc" style={{ margin: '12px auto 0' }}>
            Automation work is usually sold as a workflow audit, a defined implementation project,
            and optional ongoing maintenance. This keeps pricing aligned with scope and avoids vague,
            all-inclusive promises.
          </p>

          <div className="pricing-grid" style={{ marginTop: 48 }}>
            {PRICING_OPTIONS.map((option, i) => (
              <div key={i} className={`plan ${option.featured ? 'featured' : ''}`}>
                {option.featured && <div className="plan-badge">Best Starting Point</div>}

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
            Third-party software subscriptions are typically paid directly by the client. TechDesk Pro
            fees cover scoping, setup, implementation, and support.
          </p>
        </div>
      </section>

      {/* ——— HOW THIS HELPS ——— */}
      <section className="section">
        <div className="section-inner">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <div className="section-tag">What This Helps With</div>
            <h2 className="section-title">Reduce manual work without creating new chaos.</h2>
            <p className="section-desc" style={{ margin: '12px auto 0' }}>
              The goal is not to automate everything. The goal is to improve the parts of your
              operation that are repetitive, error-prone, or slowing your team down.
            </p>
          </div>

          <div className="steps">
            {[
              {
                n: '01',
                t: 'Forms & Intake',
                d: 'Route submissions, collect the right data, and reduce manual follow-up after leads, requests, or internal submissions come in.',
              },
              {
                n: '02',
                t: 'Handoffs & Notifications',
                d: 'Move information between people and tools more cleanly so work does not get stuck in inboxes or forgotten across apps.',
              },
              {
                n: '03',
                t: 'Documents & Data',
                d: 'Support document handling, structured data extraction, and repetitive admin tasks that should not require the same manual steps every time.',
              },
              {
                n: '04',
                t: 'Reporting & Visibility',
                d: 'Improve visibility into workflow status, recurring issues, or routine operational activity without depending entirely on manual updates.',
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
          <h2>Need help cleaning up your workflows?</h2>
          <p>
            Start with a workflow assessment. We’ll review your current process pain points, tool
            stack, and opportunities for practical automation before recommending a scoped next step.
          </p>

          <div className="cta-btns">
            <a href="mailto:hello@techdeskpro.com?subject=Workflow%20Assessment" className="cta-btn-white">
              Request Workflow Assessment →
            </a>
            <a href="/" className="cta-btn-ghost">
              Back to Main Services
            </a>
          </div>

          <div className="cta-info">
            <span>Remote-first service</span>
            <span>hello@techdeskpro.com</span>
            <span>Assessment, build, and maintenance options</span>
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
            <a href="/ecommerce">E-Commerce Services</a>
            <a href="/support-transparency">Support &amp; AI Transparency</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/login" style={{ color: 'var(--teal)' }}>
              Client Portal
            </a>
          </div>

          <div className="footer-copy">© 2026 TechDesk Pro. AI workflow automation services.</div>
        </div>
      </footer>
    </main>
  )
}