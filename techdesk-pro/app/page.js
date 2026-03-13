'use client'

import { useState } from 'react'
import BrandMark from './components/BrandMark'
import styles from './homepage.module.css'

const SERVICES = [
  {
    num: '01',
    title: 'IT Helpdesk & User Support',
    desc:
      'Remote-first support for the issues that slow teams down — account access, email problems, software troubleshooting, device guidance, and routine user support.',
    features: [
      'Email and account support',
      'Routine software troubleshooting',
      'Remote device guidance',
      'Day-to-day user support',
    ],
    meta: 'Included in monthly support paths',
  },
  {
    num: '02',
    title: 'Cloud & SaaS Administration',
    desc:
      'Support for the platforms your business already depends on — Microsoft 365, Google Workspace, Slack, Zoom, shared permissions, and routine admin tasks.',
    features: [
      'Google Workspace & Microsoft 365',
      'User provisioning',
      'Permission management',
      'Routine admin support',
    ],
    meta: 'Best fit for businesses with recurring admin needs',
  },
  {
    num: '03',
    title: 'Structured Remote Technical Support',
    desc:
      'A support model for small teams that need dependable help without hiring a full internal IT person, with clear scope, real onboarding, and controlled activation.',
    features: [
      'Business-hours support model',
      'Portal-based support workflow',
      'Lifecycle-aware onboarding',
      'Human-supervised AI assistance',
    ],
    meta: 'Activation follows onboarding review',
  },
]

const FIT_GOOD = [
  '1–25 user businesses with recurring support needs',
  'Google Workspace, Microsoft 365, Slack, Zoom, and common SaaS environments',
  'Businesses that want a clear onboarding and support workflow',
  'Teams that need practical remote support without a full internal IT hire',
]

const FIT_BAD = [
  'Large implementation work disguised as routine support',
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
    d: 'We review whether your business fits a standard support path or needs a guided review first.',
  },
  {
    n: '03',
    t: 'Create Your Portal Workspace',
    d: 'Signup reserves your workspace so onboarding, contacts, access, and documents can be tracked properly.',
  },
  {
    n: '04',
    t: 'Complete Onboarding Before Activation',
    d: 'Support goes live only after readiness, scope, handoff, and launch expectations are confirmed.',
  },
]

const PLANS = [
  {
    name: 'Starter',
    desc: 'Often suitable for smaller teams with lighter support needs',
    price: '499',
    features: [
      'Up to 10 standard support tickets per month',
      'Business-hours remote IT helpdesk support',
      'Email, login, and account troubleshooting',
      'Remote software and device guidance',
      'Client portal access',
      'First response within 1 business day',
    ],
    highlight: false,
    cta: 'Start Free Assessment',
  },
  {
    name: 'Growth',
    desc: 'Often suitable for teams with steadier support and admin needs',
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
    highlight: true,
    cta: 'Start Free Assessment',
  },
  {
    name: 'Scale',
    desc: 'For larger teams or environments needing a more guided support path',
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
    highlight: false,
    cta: 'Start Guided Review',
  },
]

const PROOF_ITEMS = [
  {
    title: 'Founder-led support model',
    desc:
      'The business is being built by a founder actively shaping the public site, onboarding logic, client portal, admin workflows, and AI-assisted support systems behind the service.',
  },
  {
    title: 'Platform-minded operations',
    desc:
      'Kocre IT is being structured around real systems — tickets, contacts, access, onboarding, launch discipline, and operational visibility — not just homepage copy.',
  },
  {
    title: 'Honest pilot-stage positioning',
    desc:
      'Where long-term client history is still being built, the brand prioritizes clarity, scope control, and process honesty over inflated claims.',
  },
]

const FAQS = [
  {
    q: 'Do I need a long-term contract?',
    a:
      'No. Monthly support paths are meant to stay straightforward and flexible. Final billing, notice periods, and service terms are governed by your written agreement.',
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

const PLATFORMS = [
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
  'Business-hours support',
  'Structured onboarding',
  'Scope-controlled delivery',
  'Human-supervised AI',
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
            <button className={styles.navLink} onClick={() => scrollTo('services')}>
              Services
            </button>
            <button className={styles.navLink} onClick={() => scrollTo('fit')}>
              Fit
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
          <button className={styles.navLink} onClick={() => scrollTo('fit')}>
            Fit
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
          <a href="/login" className={styles.mobileTextLink}>
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
                Remote-first IT support and <span className={styles.heroAccent}>cloud administration</span> for small businesses.
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

              <div className={styles.heroReassurance}>
                <span>Best for 1–25 user teams</span>
                <i>•</i>
                <span>Remote-only support</span>
                <i>•</i>
                <span>Assessment first, activation later</span>
              </div>

              <div className={styles.helperText}>
                Need scope clarity first?{' '}
                <a href="/support-transparency">Review Support Scope</a>.
              </div>
            </div>

            <div className={styles.heroAside}>
              <div className={styles.asideLabel}>Operating posture</div>
              <h2 className={styles.asideTitle}>
                This is not instant-activation tech support.
              </h2>
              <p className={styles.asideText}>
                The process is intentionally structured: fit review, signup, onboarding,
                readiness, then support activation. That protects both delivery quality
                and client expectations.
              </p>

              <div className={styles.heroPointRow}>
                {HERO_POINTS.map((item) => (
                  <span key={item} className={styles.heroPoint}>
                    {item}
                  </span>
                ))}
              </div>

              <div className={styles.platformBlock}>
                <div className={styles.platformLabel}>Supported platforms</div>
                <div className={styles.platformRow}>
                  {PLATFORMS.map((tool) => (
                    <span key={tool} className={styles.platformChip}>
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionKicker}>Core services</div>
            <h2 className={styles.sectionTitle}>
              Remote support for the systems your business depends on.
            </h2>
            <p className={styles.sectionDesc}>
              Kocre IT Services is focused on remote IT support, cloud administration, and routine
              technical help for small businesses that need dependable support without building a
              full in-house IT team.
            </p>
          </div>

          <div className={styles.servicesGrid}>
            {SERVICES.map((service) => (
              <div key={service.title} className={styles.serviceCard}>
                <div className={styles.serviceNum}>{service.num}</div>
                <h3 className={styles.serviceTitle}>{service.title}</h3>
                <p className={styles.serviceDesc}>{service.desc}</p>

                <div className={styles.featurePills}>
                  {service.features.map((feature) => (
                    <span key={feature} className={styles.pill}>
                      {feature}
                    </span>
                  ))}
                </div>

                <div className={styles.serviceMeta}>{service.meta}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="fit" className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionKicker}>Fit and process</div>
            <h2 className={styles.sectionTitle}>
              The right client flow matters as much as the offer itself.
            </h2>
            <p className={styles.sectionDesc}>
              The goal is not to fit every possible lead. The goal is to qualify the right businesses
              and move them into a clean onboarding workflow that protects delivery quality.
            </p>
          </div>

          <div className={styles.fitGrid}>
            <div className={styles.fitPanel}>
              <h3 className={styles.fitTitle}>Best fit for Kocre IT</h3>
              <div className={styles.fitList}>
                {FIT_GOOD.map((item) => (
                  <div key={item} className={styles.fitItem}>
                    <span className={styles.fitGoodBullet}>✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.fitPanel}>
              <h3 className={styles.fitTitle}>Not standard support scope</h3>
              <div className={styles.fitList}>
                {FIT_BAD.map((item) => (
                  <div key={item} className={styles.fitItem}>
                    <span className={styles.fitBadBullet}>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.processWrap}>
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
                className={`${styles.pricingCard} ${plan.highlight ? styles.pricingHighlighted : ''}`}
              >
                <div className={styles.planTop}>
                  <div>
                    <h3 className={styles.planName}>{plan.name}</h3>
                    <div className={styles.planDesc}>{plan.desc}</div>
                  </div>
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
                    plan.highlight ? styles.planBtnPrimary : styles.planBtnOutline
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>

          <div className={styles.scopeCallout}>
            Routine remote support is standard. Larger projects, migrations, planned remediation,
            and implementation work are scoped separately.{' '}
            <a href="/support-transparency">Review support scope</a>.
          </div>
        </div>
      </section>

      <section id="about" className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.aboutGrid}>
            <div className={styles.aboutCopy}>
              <div className={styles.sectionKicker}>About</div>
              <h2 className={styles.sectionTitle}>
                Built to feel controlled, clear, and operationally serious.
              </h2>

              <p className={styles.aboutText}>
                Kocre IT Services is a remote-only support business built to help small businesses
                manage day-to-day technical issues, user support, and cloud tools without hiring
                a full internal IT team.
              </p>

              <p className={styles.aboutText}>
                The approach is practical: clear monthly paths, honest service boundaries,
                AI-assisted workflows where helpful, and human oversight throughout delivery.
                The goal is not to sound bigger than reality — it is to provide structured,
                dependable support that businesses can actually use.
              </p>

              <div className={styles.aboutNote}>
                Public claims are intentionally conservative. Where performance history is still
                being built, the business prioritizes process clarity over inflated promises.
              </div>
            </div>

            <div className={styles.proofColumn}>
              {PROOF_ITEMS.map((item) => (
                <div key={item.title} className={styles.proofCard}>
                  <h3 className={styles.proofTitle}>{item.title}</h3>
                  <p className={styles.proofText}>{item.desc}</p>
                </div>
              ))}
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
                      <span className={`${styles.faqSymbol} ${open ? styles.faqSymbolOpen : ''}`}>
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
              <a href="/free-assessment" className={styles.ctaWhiteBtn}>
                Start Free Assessment
              </a>
              <a href="/pilot" className={styles.ctaGhostBtn}>
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
              <button className={styles.footerLink} onClick={() => scrollTo('fit')}>
                Fit
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