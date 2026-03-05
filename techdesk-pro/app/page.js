// File: app/page.js (replace existing)

'use client'
import { useState, useEffect } from 'react'

const SERVICES = [
  {
    num: '01',
    title: 'IT Helpdesk & Support',
    desc: 'Email issues, account lockouts, software troubleshooting, hardware guidance, remote desktop support — your team gets fast, reliable IT help without hiring in-house.',
    features: ['Email & account support', 'Software troubleshooting', 'Remote desktop access', 'Device management', 'Same-day response'],
    price: 'Included',
    priceNote: 'in every plan',
  },
  {
    num: '02',
    title: 'Cloud & SaaS Management',
    desc: 'We manage your cloud stack — Google Workspace, Microsoft 365, Slack, Zoom, CRM, project management tools. Setup, migrations, user provisioning, and ongoing support.',
    features: ['Google Workspace & M365', 'SaaS app management', 'User provisioning', 'Cloud migrations', 'License optimization'],
    price: 'Included',
    priceNote: 'in Growth+',
  },
  {
    num: '03',
    title: 'Business Process Automation',
    desc: 'AI-powered document processing, workflow automation, and data extraction. Turn manual tasks into automated pipelines — invoices, forms, reports, and more.',
    features: ['AI document processing', 'Workflow automation', 'Data extraction & entry', 'Custom integrations', 'Monthly reporting'],
    price: '$500–$3,000',
    priceNote: 'per project',
  },
  {
    num: '04',
    title: 'Cybersecurity Essentials',
    desc: 'Protect your business with proactive security monitoring, threat detection, employee training, and incident response. Enterprise-grade protection at small business prices.',
    features: ['Security monitoring', 'Threat detection', 'Employee training', 'Incident response', 'Compliance support'],
    price: '+$300',
    priceNote: 'added to any plan',
  },
  {
    num: '05',
    title: 'E-Commerce Operations',
    desc: 'Shopify, Wix, WooCommerce, Squarespace — we build, manage, and optimize your online store. From setup to ongoing support, integrations, and performance tuning.',
    features: ['Store setup & launch', 'Platform migrations', 'App integrations', 'Performance optimization', 'Ongoing maintenance'],
    price: '$500–$5,000',
    priceNote: 'per project',
  },
]

const PLANS = [
  {
    name: 'Starter',
    price: '499',
    desc: 'For small teams getting started',
    features: ['10 support tickets/mo', 'IT helpdesk support', 'Email & account help', 'AI-powered Atlas copilot', '24hr response time'],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Growth',
    price: '999',
    desc: 'For growing businesses',
    features: ['30 support tickets/mo', 'Full cloud & SaaS management', 'AI document processing', 'Sentinel AI monitoring', 'Priority support — 4hr response', 'Monthly strategy call'],
    cta: 'Start Growing',
    featured: true,
  },
  {
    name: 'Scale',
    price: '1,999',
    desc: 'For established companies',
    features: ['Unlimited tickets', 'All services included', 'Cybersecurity essentials', 'Dedicated account manager', '1hr response time', 'Weekly check-in call', 'Custom automation builds'],
    cta: "Let's Talk",
    featured: false,
  },
]

const FAQS = [
  { q: 'Do I need to sign a long-term contract?', a: 'No. All plans are month-to-month. You can cancel anytime with 30 days notice.' },
  { q: "We're not an e-commerce business. Can you still help?", a: "Absolutely. Most of our clients are regular businesses — law firms, agencies, medical offices, startups. E-commerce is just one of our specialties. Our IT support, cloud management, and automation services work for any industry." },
  { q: 'How does the AI-powered support work?', a: 'When you submit a ticket, our AI (AutoResolve) analyzes it instantly. Simple issues get resolved automatically — password resets, how-to questions, configuration help. Complex issues get routed to our team with AI-generated context, so we resolve them faster. You also get Atlas AI, a business copilot you can chat with anytime.' },
  { q: 'What size businesses do you work with?', a: 'From solo founders to 200+ employee companies. Our plans scale with your needs. Starter works great for 1-10 people, Growth for 10-50, and Scale for 50+.' },
  { q: 'How is this different from hiring an IT person?', a: 'An in-house IT hire costs $60-100K/year plus benefits. You get a full team of specialists plus AI-powered tools for a fraction of that. We handle everything from helpdesk to cloud management to automation — no single hire covers all of that.' },
  { q: 'What does the free assessment include?', a: "We review your current IT infrastructure, cloud tools, security posture, and workflows — then give you a prioritized list of improvements with cost estimates. No strings attached." },
]

const TOOLS = ['Google Workspace', 'Microsoft 365', 'Slack', 'Shopify', 'QuickBooks', 'Salesforce', 'Zoom', 'Zapier', 'HubSpot', 'AWS', 'Stripe', 'Notion']

const STATS = [
  { val: '< 4hr', label: 'Avg Response' },
  { val: '98%', label: 'Satisfaction' },
  { val: '70%', label: 'Auto-Resolved' },
  { val: '$0', label: 'Setup Fee' },
]

const STEPS = [
  { n: '01', t: 'Free Assessment', d: 'We audit your IT setup, tools, and workflows. You get a clear picture of where things stand.' },
  { n: '02', t: 'Custom Plan', d: 'We recommend the right plan and services based on your actual business needs.' },
  { n: '03', t: 'Onboarding', d: 'Connect your platforms, set up your support portal, and meet your AI copilot — all within 24 hours.' },
  { n: '04', t: 'We Handle It', d: 'Submit tickets anytime. AI handles the easy stuff instantly. Our team tackles the rest.' },
]

const BARS = [
  { label: 'Response Speed', val: 95 },
  { label: 'Issue Resolution', val: 98 },
  { label: 'Client Satisfaction', val: 100 },
  { label: 'Uptime Guarantee', val: 99 },
]

const ABOUT_FEATURES = [
  { icon: '📍', text: 'Stafford, VA based' },
  { icon: '🤖', text: 'AI-powered operations' },
  { icon: '🔒', text: 'Security-first approach' },
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
            <button className="nav-cta" onClick={() => scrollTo('contact')}>Free Assessment</button>
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
            Free Assessment
          </button>
        </div>
      </nav>

      {/* ——— HERO ——— */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-tag">AI-Powered IT Operations · Based in Stafford, VA</div>
            <h1>
              Your IT Department — <em>Powered&nbsp;by&nbsp;AI</em> — Without&nbsp;the&nbsp;Overhead.
            </h1>
            <p className="hero-desc">
              Managed IT support, cloud operations, and business automation for growing companies.
              AI handles the routine. Our team handles the rest. No hiring headaches. No six-figure salaries.
            </p>
            <div className="hero-btns">
              <button className="btn-primary" onClick={() => scrollTo('contact')}>
                Get Free Assessment →
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
              <div className="tools-label">Platforms We Manage</div>
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
            <h2 className="section-title">Everything your business needs to run smoothly.</h2>
            <p className="section-desc">From IT helpdesk to cloud management to AI automation — one partner for all your technology operations.</p>
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

      {/* ——— AI SECTION ——— */}
      <section className="section">
        <div className="section-inner" style={{ textAlign: 'center' }}>
          <div className="section-tag">AI-Powered</div>
          <h2 className="section-title">Not your typical IT provider.</h2>
          <p className="section-desc" style={{ margin: '12px auto 48px', maxWidth: 600 }}>
            Every client gets access to our proprietary AI suite — tools that make your IT support faster, smarter, and more proactive than anything else on the market.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, textAlign: 'left' }}>
            {[
              { icon: '🧠', name: 'Atlas AI', desc: 'Your 24/7 business copilot. Ask it anything about your tech setup, get instant answers.' },
              { icon: '⚡', name: 'AutoResolve', desc: 'AI solves 70% of tickets instantly — password resets, how-tos, config issues. No waiting.' },
              { icon: '👻', name: 'Ghost Admin', desc: 'AI drafts expert replies and teaches our team how to fix complex issues faster.' },
              { icon: '🛡️', name: 'Sentinel AI', desc: 'Monitors your systems 24/7. Catches downtime, SLA breaches, and anomalies before you do.' },
            ].map((ai, i) => (
              <div key={i} style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
                padding: 24, transition: 'all 0.3s'
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>{ai.icon}</div>
                <div style={{ fontFamily: "'Source Serif 4', serif", fontWeight: 600, fontSize: '1.1rem', marginBottom: 6, color: 'var(--ink)' }}>{ai.name}</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', lineHeight: 1.6 }}>{ai.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— PRICING ——— */}
      <section id="pricing" className="section section-alt">
        <div className="section-inner">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <div className="section-tag">Pricing</div>
            <h2 className="section-title">Simple, transparent pricing.</h2>
            <p className="section-desc" style={{ margin: '12px auto 0' }}>
              No hidden fees. No long contracts. Scales with your business.
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
            Custom projects (automation builds, migrations, store setups) are quoted separately. Cybersecurity add-on: +$300/mo.
          </p>
        </div>
      </section>

      {/* ——— ABOUT ——— */}
      <section id="about" className="section">
        <div className="section-inner">
          <div className="about-grid">
            <div className="about-text">
              <div className="section-tag">About</div>
              <h2 className="section-title" style={{ marginBottom: 16 }}>
                Built for businesses that can&apos;t afford downtime.
              </h2>
              <p>
                TechDesk Pro was founded in Stafford, VA with one mission: give growing businesses
                enterprise-grade IT operations without the enterprise price tag.
              </p>
              <p className="muted">
                We combine hands-on expertise with cutting-edge AI tools to resolve issues faster,
                automate manual work, and keep your operations running smoothly — whether you run
                an online store, a law firm, or a 100-person company.
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
      <section id="faq" className="section section-alt">
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
          <h2>Ready to upgrade your IT operations?</h2>
          <p>
            Book a free assessment. We&apos;ll audit your current setup and show you exactly
            where AI-powered IT support can save you time, money, and headaches.
          </p>
          <div className="cta-btns">
            <a
              href="https://calendly.com"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-btn-white"
            >
              Book Free Assessment →
            </a>
            <a href="mailto:hello@techdeskpro.com" className="cta-btn-ghost">
              Send an Email
            </a>
          </div>
          <div className="cta-info">
            <span>📍 Stafford, VA</span>
            <span>✉️ hello@techdeskpro.com</span>
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