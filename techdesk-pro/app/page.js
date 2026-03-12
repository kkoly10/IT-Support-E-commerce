'use client'

import { useState } from 'react'
import BrandMark from './components/BrandMark'
import styles from './homepage.module.css'

const SERVICES = [
  {
    num: '01',
    title: 'IT Helpdesk & User Support',
    desc:
      'Remote-first support for the day-to-day issues that slow teams down — account access, email issues, software troubleshooting, device guidance, and routine user support.',
    features: [
      'Email and account support',
      'Routine software troubleshooting',
      'Remote desktop guidance',
      'User support workflows',
    ],
    price: 'Included',
    priceNote: 'in monthly plans',
  },
  {
    num: '02',
    title: 'Cloud & SaaS Administration',
    desc:
      'Support for the platforms your business already depends on — Microsoft 365, Google Workspace, Slack, Zoom, user permissions, and routine admin tasks.',
    features: [
      'Google Workspace & Microsoft 365',
      'User provisioning',
      'Permission management',
      'Routine admin support',
    ],
    price: 'Included',
    priceNote: 'in Growth+',
  },
  {
    num: '03',
    title: 'Structured Remote Technical Support',
    desc:
      'A support model for small teams that need reliable help without hiring a full internal IT person. Clear requests, clear boundaries, and a real onboarding process before activation.',
    features: [
      'Business-hours support model',
      'Lifecycle-aware onboarding',
      'Support request workflow',
      'Human-supervised AI assistance',
    ],
    price: 'Included',
    priceNote: 'in active support paths',
  },
]

const HERO_POINTS = [
  {
    title: 'Business-hours support',
    desc: 'Monday–Friday, 9:00 AM–6:00 PM ET',
  },
  {
    title: 'Remote-only delivery',
    desc: 'Built for small U.S. businesses that need practical support without full internal IT',
  },
  {
    title: 'Fit-first onboarding',
    desc: 'Assessment, signup, onboarding, and activation are intentionally separated',
  },
  {
    title: 'Human-supervised AI',
    desc: 'AI helps speed up workflows, but human oversight remains part of delivery',
  },
]

const FIT_GOOD = [
  '1–25 user businesses with recurring support needs',
  'Microsoft 365, Google Workspace, Slack, Zoom, and common SaaS environments',
  'Businesses that want a clear onboarding and support workflow',
  'Teams that need dependable remote helpdesk and admin support',
]

const FIT_NOT = [
  'Large project implementation disguised as routine support',
  'Immediate activation before fit, access, contacts, and onboarding are reviewed',
  'On-site support as part of the standard monthly offer',
  'Unlimited project work inside a normal monthly support plan',
]

const PROCESS = [
  {
    n: '01',
    t: 'Request a Free Assessment',
    d: 'Tell us about your business, tools, team size, and biggest support friction points.',
  },
  {
    n: '02',
    t: 'Get a Fit Recommendation',
    d: 'We review whether your business fits a standard support path or needs a more guided review.',
  },
  {
    n: '03',
    t: 'Create Your Portal Workspace',
    d: 'Signup reserves your workspace so onboarding, contacts, access, and documents can be tracked properly.',
  },
  {
    n: '04',
    t: 'Complete Onboarding Before Activation',
    d: 'Support goes live only after readiness, scope, and handoff are actually confirmed.',
  },
]

const PLANS = [
  {
    name: 'Starter',
    desc: 'Best for 1–5 users',
    price: '499',
    features: [
      'Up to 10 standard support tickets per month',
      'Business-hours remote IT helpdesk support',
      'Email, login, and account troubleshooting',
      'Remote software and device guidance',
      'Client portal access',
      'First response within 1 business day',
    ],
    featured: false,
    cta: 'Start Free Assessment',
  },
  {
    name: 'Growth',
    desc: 'Best for 5–15 users',
    price: '999',
    features: [
      'Up to 30 standard support tickets per month',
      'Business-hours remote IT helpdesk support',
      'Cloud and SaaS administration',
      'User onboarding and offboarding support',
      'Routine admin support for supported platforms',
      'Monthly review call',
      'First response within 4 business hours',
    ],
    featured: true,
    cta: 'Start Free Assessment',
  },
  {
    name: 'Scale',
    desc: 'Best for 15+ users or more operational complexity',
    price: '1,999',
    priceLabel: 'Starting at',
    features: [
      'Custom support volume based on team size and environment',
      'Priority business-hours remote support',
      'Broader cloud and systems administration',
      'Structured coordination across business tools',
      'Optional security-focused support path',
      'Strategic check-ins',
    ],
    featured: false,
    cta: 'Start Guided Review',
  },
]

const FOUNDER_PROOF = [
  {
    title: 'Founder-led support model',
    desc:
      'This business is being built by a founder actively shaping the public site, client portal, onboarding, and admin workflows behind the service.',
  },
  {
    title: 'Platform-minded operations',
    desc:
      'The business is being structured around real systems — tickets, contacts, access, onboarding, launch discipline, and operational visibility — not just homepage copy.',
  },
  {
    title: 'Honest pilot-stage positioning',
    desc:
      'Where long-term client history is still being built, the brand prioritizes clarity, boundaries, and process honesty over inflated claims.',
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

const FAQS = [
  {
    q: 'Do I need a long-term contract?',
    a:
      'No. Monthly support plans are meant to stay straightforward and flexible. Final billing, notice periods, and service terms are governed by your written agreement.',
  },
  {
    q: 'What counts as a support ticket?',
    a:
      'A standard support ticket is one routine request for help involving one issue, one user, or one related interruption that requires review, triage, and action.',
  },
  {
    q: 'What is not included as a standard ticket?',
    a:
      'Large projects, migrations, major remediation, planned after-hours work, onsite work, and implementation projects are scoped separately unless specifically included in writing.',
  },
  {
    q: 'What counts as an emergency?',
    a:
      'An emergency is a business-critical outage, suspected security incident, or major disruption with material operational impact and no reasonable workaround. Routine one-user issues usually do not qualify.',
  },
  {
    q: 'Do you provide on-site support?',
    a:
      'Kocre IT Services is currently a remote-only service. On-site support is not part of the standard offering at this stage.',
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

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  const scrollTo = (id) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <div className={`${styles.shell} ${styles.navInner}`}>
          <a href="/" className={styles.brand}>
            <div className={styles.brandMark}>
              <BrandMark />
            </div>
            Kocre IT Services
          </a>

          <div className={styles.navLinks}>
            {['services', 'pricing', 'about', 'faq'].map((id) => (
              <button
                key={id}
                className={styles.navLink}
                onClick={() => scrollTo(id)}
              >
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>

          <div className={styles.navActions}>
            <a href="/login" className={styles.portalLink}>
              Client Portal
            </a>
            <a href="/free-assessment" className={styles.primaryBtn}>
              Free Assessment
            </a>
          </div>

          <button
            className={`${styles.mobileToggle} ${menuOpen ? styles.mobileOpen : ''}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <div className={`${styles.shell} ${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}>
          <button className={styles.navLink} onClick={() => scrollTo('services')}>
            Services
          </button>
          <button className={styles.navLink} onClick={() => scrollTo('pricing')}>
            Pricing
          </button>
          <button className={styles.navLink} onClick={() => scrollTo('about')}>
            About
          </button>
          <button className={styles.navLink} onClick={() => scrollTo('faq')}>
            FAQ
          </button>
          <a href="/login" className={styles.footerLink}>
            Client Portal
          </a>
          <a href="/free-assessment" className={styles.primaryBtn}>
            Free Assessment
          </a>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.shell}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <div className={styles.eyebrow}>Remote-only IT support · U.S. small businesses</div>
              <h1 className={styles.heroTitle}>
                Remote-first IT support and{' '}
                <span className={styles.heroAccent}>cloud administration</span> for small businesses.
              </h1>
              <p className={styles.heroDesc}>
                Kocre IT Services helps small businesses handle day-to-day technical support,
                user issues, and cloud administration without hiring a full internal IT team —
                with AI-assisted workflows, human oversight, and a fit-first onboarding process.
              </p>

              <div className={styles.heroActions}>
                <a href="/free-assessment" className={styles.primaryBtn}>
                  Request Free Assessment
                </a>
                <a href="/pilot" className={styles.secondaryBtn}>
                  Review Pilot Path
                </a>
              </div>

              <div className={styles.helperText}>
                Need scope clarity first?{' '}
                <a href="/support-transparency">Review Support Scope</a>.
              </div>
            </div>

            <div className={styles.heroPanel}>
              <div>
                <div className={styles.panelTag}>How Kocre IT works</div>
                <div className={styles.panelTitle}>
                  Assessment first. Activation later.
                </div>
                <div className={styles.panelCopy}>
                  The process is intentionally structured: fit review, signup, onboarding,
                  readiness, then support activation. That protects both the client experience
                  and delivery quality.
                </div>
              </div>

              <div className={styles.proofGrid}>
                {HERO_POINTS.map((item) => (
                  <div key={item.title} className={styles.proofItem}>
                    <div className={styles.proofTitle}>{item.title}</div>
                    <div className={styles.proofDesc}>{item.desc}</div>
                  </div>
                ))}
              </div>

              <div>
                <div className={styles.stackLabel}>Supported platforms</div>
                <div className={styles.chipRow}>
                  {TOOLS.map((tool) => (
                    <span key={tool} className={styles.chip}>
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.strip}>
        <div className={styles.shell}>
          <div className={styles.stripGrid}>
            <div className={styles.stripCard}>
              <div className={styles.stripCardTitle}>Business-hours support</div>
              <div className={styles.stripCardText}>Monday–Friday, 9 AM–6 PM ET</div>
            </div>
            <div className={styles.stripCard}>
              <div className={styles.stripCardTitle}>Remote-only delivery</div>
              <div className={styles.stripCardText}>No onsite work inside the standard offer</div>
            </div>
            <div className={styles.stripCard}>
              <div className={styles.stripCardTitle}>Fit-first process</div>
              <div className={styles.stripCardText}>Assessment → signup → onboarding → activation</div>
            </div>
            <div className={styles.stripCard}>
              <div className={styles.stripCardTitle}>Human oversight</div>
              <div className={styles.stripCardText}>AI assists workflows, but people still supervise delivery</div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionKicker}>Core services</div>
              <h2 className={styles.sectionTitle}>
                Remote support for the systems your business depends on.
              </h2>
              <p className={styles.sectionDesc}>
                Kocre IT Services is focused on remote IT support, cloud administration, and
                routine technical help for small businesses that need dependable support without
                building a full in-house IT team.
              </p>
            </div>

            <div className={styles.servicesGrid}>
              {SERVICES.map((service) => (
                <div key={service.title} className={styles.serviceCard}>
                  <div className={styles.serviceNum}>{service.num}</div>
                  <h3 className={styles.serviceTitle}>{service.title}</h3>
                  <p className={styles.serviceDesc}>{service.desc}</p>

                  <div className={styles.serviceMeta}>
                    <div className={styles.badgeRow}>
                      {service.features.map((feature) => (
                        <span key={feature} className={styles.badge}>
                          {feature}
                        </span>
                      ))}
                    </div>

                    <div className={styles.servicePrice}>
                      <div className={styles.servicePriceValue}>{service.price}</div>
                      <div className={styles.servicePriceNote}>{service.priceNote}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionKicker}>Best fit</div>
              <h2 className={styles.sectionTitle}>
                This works best when the support path is clear.
              </h2>
              <p className={styles.sectionDesc}>
                The goal is not to fit every possible lead. The goal is to qualify the right
                businesses and move them into a clean onboarding workflow.
              </p>
            </div>

            <div className={styles.fitGrid}>
              <div className={`${styles.fitCard} ${styles.fitCardGood}`}>
                <h3 className={styles.fitTitle}>Best fit for Kocre IT</h3>
                <div className={styles.fitList}>
                  {FIT_GOOD.map((item) => (
                    <div key={item} className={styles.fitListItem}>
                      <span className={styles.fitBulletGood}>✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${styles.fitCard} ${styles.fitCardBad}`}>
                <h3 className={styles.fitTitle}>Not standard support scope</h3>
                <div className={styles.fitList}>
                  {FIT_NOT.map((item) => (
                    <div key={item} className={styles.fitListItem}>
                      <span className={styles.fitBulletBad}>•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionKicker}>How it works</div>
              <h2 className={styles.sectionTitle}>
                A simple support path from assessment to activation.
              </h2>
              <p className={styles.sectionDesc}>
                We keep the process straightforward: assess the environment, recommend the right
                support path, reserve the client workspace, and complete onboarding before support goes live.
              </p>
            </div>

            <div className={styles.processGrid}>
              {PROCESS.map((step) => (
                <div key={step.n} className={styles.processCard}>
                  <div className={styles.processNum}>{step.n}</div>
                  <h3 className={styles.processTitle}>{step.t}</h3>
                  <p className={styles.processDesc}>{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionKicker}>Pricing</div>
              <h2 className={styles.sectionTitle}>
                Simple monthly remote support for growing businesses.
              </h2>
              <p className={styles.sectionDesc}>
                Choose the support path that best matches your team size and recurring support needs.
                Final fit and activation are confirmed through review and onboarding — not by assumptions alone.
              </p>
            </div>

            <div className={styles.pricingGrid}>
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`${styles.pricingCard} ${plan.featured ? styles.pricingFeatured : ''}`}
                >
                  <div className={styles.planTop}>
                    <div>
                      <h3 className={styles.planName}>{plan.name}</h3>
                      <div className={styles.planDesc}>{plan.desc}</div>
                    </div>
                    {plan.featured ? <div className={styles.planTag}>Most practical fit</div> : null}
                  </div>

                  <div className={styles.planPriceBlock}>
                    {plan.priceLabel ? <div className={styles.planStarting}>{plan.priceLabel}</div> : null}
                    <div className={styles.planPrice}>
                      <span className={styles.planDollar}>$</span>
                      <span className={styles.planAmount}>{plan.price}</span>
                      <span className={styles.planPeriod}>/mo</span>
                    </div>
                  </div>

                  <div className={styles.planList}>
                    {plan.features.map((feature) => (
                      <div key={feature} className={styles.planItem}>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <a
                    href="/free-assessment"
                    className={`${styles.planBtn} ${
                      plan.featured ? styles.planBtnPrimary : styles.planBtnOutline
                    }`}
                  >
                    {plan.cta}
                  </a>
                </div>
              ))}
            </div>

            <div className={styles.pricingFootnote}>
              Not sure which path fits? Start with a free assessment and we’ll recommend the most
              sensible next step.
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionKicker}>Why this approach</div>
              <h2 className={styles.sectionTitle}>
                Founder-led, platform-minded, and built around real support operations.
              </h2>
              <p className={styles.sectionDesc}>
                Kocre IT is being built as an actual support platform — not just a homepage —
                with onboarding, documents, access, launch discipline, and client/admin workflows behind it.
              </p>
            </div>

            <div className={styles.proofGridLong}>
              {FOUNDER_PROOF.map((item) => (
                <div key={item.title} className={styles.proofLongCard}>
                  <h3 className={styles.proofLongTitle}>{item.title}</h3>
                  <p className={styles.proofLongText}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.sectionCard}>
            <div className={styles.aboutGrid}>
              <div className={styles.aboutCardMain}>
                <div className={styles.sectionKicker}>About</div>
                <h2 className={styles.sectionTitle}>
                  Built for businesses that need clarity, not tech chaos.
                </h2>

                <p className={styles.aboutText}>
                  Kocre IT Services is a remote-only support business built to help small businesses
                  manage day-to-day technical issues, user support, and cloud tools without hiring a
                  full internal IT team.
                </p>

                <p className={styles.aboutText}>
                  The approach is practical: clear monthly paths, honest service boundaries,
                  AI-assisted workflows where helpful, and human oversight throughout delivery.
                  The goal is not to sound bigger than reality — it is to provide structured,
                  dependable support that businesses can actually use.
                </p>

                <div className={styles.featureGrid}>
                  {ABOUT_FEATURES.map((item) => (
                    <div key={item.text} className={styles.featureItem}>
                      <span className={styles.featureIcon}>{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.aboutCardSide}>
                <div className={styles.metricLabel}>What we prioritize</div>

                {ABOUT_BARS.map((item) => (
                  <div key={item.label} className={styles.metricGroup}>
                    <div className={styles.metricTop}>
                      <span className={styles.metricName}>{item.label}</span>
                      <span className={styles.metricVal}>{item.val}%</span>
                    </div>
                    <div className={styles.metricTrack}>
                      <div className={styles.metricFill} style={{ width: `${item.val}%` }} />
                    </div>
                  </div>
                ))}

                <div className={styles.sideNote}>
                  Public claims are intentionally conservative. Where performance history is still
                  being built, the site prioritizes process clarity over inflated promises.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.faqWrap}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionKicker}>FAQ</div>
              <h2 className={styles.sectionTitle}>Common questions.</h2>
            </div>

            <div className={styles.faqList}>
              {FAQS.map((faq, index) => {
                const open = openFaq === index
                return (
                  <div key={faq.q} className={styles.faqItem}>
                    <button
                      className={styles.faqButton}
                      onClick={() => setOpenFaq(open ? null : index)}
                    >
                      <span>{faq.q}</span>
                      <span
                        className={`${styles.faqSymbol} ${open ? styles.faqSymbolOpen : ''}`}
                      >
                        +
                      </span>
                    </button>
                    {open ? <div className={styles.faqAnswer}>{faq.a}</div> : null}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.shell}>
          <div className={styles.ctaCard}>
            <h2 className={styles.ctaTitle}>
              Ready to see whether Kocre IT is the right support fit?
            </h2>
            <p className={styles.ctaText}>
              Start with a free assessment. We’ll review your current support needs, tools, and
              operational pain points, then recommend the most sensible next step.
            </p>

            <div className={styles.ctaActions}>
              <a href="/free-assessment" className={styles.primaryBtn}>
                Start Free Assessment
              </a>
              <a href="/pilot" className={styles.ghostBtn + ' ' + styles.secondaryBtn}>
                Review Pilot Path
              </a>
            </div>

            <div className={styles.ctaMeta}>
              <span>Remote-only, U.S. small businesses</span>
              <span>Mon–Fri, 9 AM–6 PM ET</span>
              <span>Onboarding required before activation</span>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.shell}>
          <div className={styles.footerInner}>
            <a href="/" className={styles.brand}>
              <div className={styles.brandMark}>
                <BrandMark />
              </div>
              Kocre IT Services
            </a>

            <div className={styles.footerLinks}>
              <button className={styles.footerLink} onClick={() => scrollTo('services')}>
                Services
              </button>
              <button className={styles.footerLink} onClick={() => scrollTo('pricing')}>
                Pricing
              </button>
              <button className={styles.footerLink} onClick={() => scrollTo('about')}>
                About
              </button>
              <button className={styles.footerLink} onClick={() => scrollTo('faq')}>
                FAQ
              </button>
              <a className={styles.footerLink} href="/pilot">
                Pilot Path
              </a>
              <a className={styles.footerLink} href="/support-transparency">
                Support Scope
              </a>
              <a className={styles.footerLink} href="/privacy">
                Privacy
              </a>
              <a className={styles.footerLink} href="/terms">
                Terms
              </a>
              <a className={styles.footerLink} href="/login">
                Client Portal
              </a>
            </div>

            <div className={styles.footerCopy}>
              © 2026 Kocre IT Services. Remote-only, based in Virginia.
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}