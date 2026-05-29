'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FAQS, BUSINESS, REGIONS } from '../lib/seo'

// ---------------------------------------------------------------------------
// "Calm Operator" theme — Mercury/Vanta-style restraint. White + warm cream,
// a single sage-green accent, hand-set serif accents on numbers.
// Content is kept honest: no fabricated performance metrics, no invented
// client logos, no fake testimonials. Real routes are wired throughout.
// ---------------------------------------------------------------------------

const CO = {
  bg: '#ffffff',
  bg2: '#faf8f4',
  bg3: '#0f100e',
  ink: '#0f100e',
  ink2: '#4a4944',
  ink3: '#6f6a62', // ~5.3:1 on white — passes WCAG AA for the small captions/labels it's used on
  border: '#ecead8',
  borderSoft: '#f3f1e7',
  green: '#2f7a4d',
  greenSoft: '#e8f1ea',
  serif: '"Newsreader", Georgia, serif',
  sans: '"Inter Tight", "Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
}

// Animated number that eases to a target whenever it changes.
function useAnimatedNumber(target, ms = 600) {
  const [v, setV] = useState(target)
  const fromRef = useRef(target)
  const startRef = useRef(0)
  useEffect(() => {
    fromRef.current = v
    startRef.current = performance.now()
    let raf
    const tick = (t) => {
      const k = Math.min(1, (t - startRef.current) / ms)
      const eased = 1 - Math.pow(1 - k, 3)
      setV(fromRef.current + (target - fromRef.current) * eased)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])
  return v
}

// Scroll-triggered "in view" hook.
function useInView(opts = {}) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.2, ...opts }
    )
    io.observe(ref.current)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return [ref, seen]
}

// Pricing model: team size + environment + support need + urgency → recommended path.
// Plans are real and consistent with the pricing cards below.
const PLAN_CATALOG = {
  founding: {
    key: 'founding',
    name: 'Founding Managed Support',
    setup: 199,
    setupLabel: '$199 setup fee',
    fit: 'Small businesses trying structured remote IT support',
    summary: 'Up to 5 users / 5 Windows devices · 90-day pilot',
    response: '1 business day first response',
    includes: [
      'Remote helpdesk',
      'Email/account support',
      'Microsoft 365 or Google Workspace basic support',
      'Managed Windows device support',
      'Remote troubleshooting',
      'Device health visibility',
    ],
  },
  remote: {
    key: 'remote',
    name: 'Remote Desk',
    perUser: 49,
    minMonth: 299,
    setup: 199,
    setupLabel: '$199 setup fee',
    fit: 'Helpdesk and cloud account support',
    summary: 'No managed device monitoring',
    response: 'Business-hours support',
    includes: [
      'Remote helpdesk',
      'Email/login support',
      'Microsoft 365 or Google Workspace basic admin',
      'Software troubleshooting',
      'Client portal',
      'Business-hours support',
    ],
  },
  managed: {
    key: 'managed',
    name: 'Managed Desk',
    perUser: 89,
    minMonth: 499,
    setup: 499,
    setupLabel: '$499 setup fee',
    featured: true,
    fit: 'Helpdesk plus managed Windows devices',
    summary: 'One managed Windows device per user',
    response: 'Business-hours support',
    includes: [
      'Everything in Remote Desk',
      'One managed Windows device per user',
      'Remote support agent',
      'Device inventory',
      'Patch/update visibility',
      'Basic health checks',
      'Employee onboarding/offboarding',
      'Monthly support summary',
    ],
  },
  secure: {
    key: 'secure',
    name: 'Secure Desk',
    perUser: 129,
    minMonth: 899,
    setup: 799,
    setupLabel: '$799+ setup fee',
    fit: 'Managed support plus security hygiene',
    summary: 'Basic security hygiene reviews — not full cybersecurity',
    response: 'Priority business-hours response',
    includes: [
      'Everything in Managed Desk',
      'MFA review',
      'Local admin review',
      'Defender/firewall status checks',
      'BitLocker/encryption review',
      'Monthly risk notes',
      'Quarterly access cleanup',
    ],
  },
  custom: {
    key: 'custom',
    name: 'Custom Review',
    fit: 'Larger teams, Mac-heavy environments, urgent or compliance-heavy needs',
    summary: 'We review your situation and quote a tailored scope',
    response: 'Quoted by review',
    includes: [
      'Mac/Linux support reviewed case by case',
      'Urgent or after-hours expectations',
      'Compliance or security incident needs',
      'Servers, networks, or on-site work',
    ],
  },
}

function computeMonthly(plan, team) {
  if (!plan) return null
  if (plan.key === 'founding') return 399
  if (plan.perUser && plan.minMonth) return Math.max(plan.perUser * team, plan.minMonth)
  return null
}

function recommendPath(team, env, need, urgency) {
  if (urgency === 'urgent') return PLAN_CATALOG.custom
  if (team > 25) return PLAN_CATALOG.custom
  if (env === 'mac') return PLAN_CATALOG.custom
  if (need === 'security') return PLAN_CATALOG.secure
  if (need === 'managed') {
    if (team <= 5 && env === 'windows') return PLAN_CATALOG.founding
    if (env === 'windows' || env === 'mixed') return PLAN_CATALOG.managed
    return PLAN_CATALOG.custom
  }
  return PLAN_CATALOG.remote
}

function IconStroke({ d, size = 22, color = 'currentColor', sw = 1.6 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const ICON = {
  shield: 'M12 3l8 3v6c0 4.5-3.5 8.5-8 9-4.5-.5-8-4.5-8-9V6l8-3z',
  cloud: 'M7 18h11a4 4 0 0 0 0-8 6 6 0 0 0-11.7-1.3A3.5 3.5 0 0 0 7 18z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8',
  check: 'M5 12l4 4L19 7',
}

function Logo({ color = CO.ink }) {
  return (
    <svg width="22" height="22" viewBox="0 0 100 100" aria-hidden="true">
      <rect x="14" y="14" width="14" height="72" fill={color} />
      <path d="M 30 50 L 80 14 L 58 50 L 80 86 L 30 50 Z" fill={CO.green} />
    </svg>
  )
}

// Founder details — update the name/title/copy as needed, and drop a real
// photo at /public/founder.jpg (or change FOUNDER.img). Falls back to initials
// if the image is missing, so nothing breaks before the file is committed.
const FOUNDER = {
  name: 'Komlan Kouhiko',
  title: 'Founder · Kocre IT Services',
  initials: 'KK',
  img: '/founder.jpg',
  note:
    'I started Kocre IT to give small businesses structured remote IT support without the cost of hiring in-house. The service is intentionally focused: helpdesk, cloud account support, onboarding/offboarding, and managed Windows device support for approved devices. I am building it carefully with real onboarding, a support portal, clear scope, and human-supervised AI. We are early, and I would rather earn trust through process and honesty than inflated claims.',
}

function FounderAvatar() {
  const [ok, setOk] = useState(true)
  return (
    <div style={{ width: 96, height: 96, borderRadius: 20, overflow: 'hidden', flexShrink: 0, background: CO.greenSoft, border: `1px solid ${CO.border}`, display: 'grid', placeItems: 'center' }}>
      {ok ? (
        <img src={FOUNDER.img} alt={FOUNDER.name} width={96} height={96} onError={() => setOk(false)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <span style={{ fontFamily: CO.sans, fontWeight: 600, fontSize: 28, color: CO.green, letterSpacing: -0.5 }}>{FOUNDER.initials}</span>
      )}
    </div>
  )
}

function Dot({ color = CO.green, size = 7 }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
      <span className="co-dot-pulse" style={{ position: 'absolute', inset: 0, borderRadius: size, background: color }} />
      <span style={{ position: 'absolute', inset: 0, borderRadius: size, background: color }} />
    </span>
  )
}

function CoBtn({ kind = 'primary', as = 'button', children, style, ...p }) {
  const base = {
    padding: '11px 18px',
    fontFamily: CO.sans,
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 999,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
    border: 'none',
    transition: 'all 0.15s',
  }
  const k =
    kind === 'primary'
      ? { background: CO.ink, color: '#fff' }
      : kind === 'accent'
      ? { background: CO.green, color: '#fff' }
      : { background: 'transparent', color: CO.ink, border: `1px solid ${CO.border}` }
  const Tag = as
  return (
    <Tag style={{ ...base, ...k, ...style }} {...p}>
      {children}
    </Tag>
  )
}

const NAV_LINKS = [
  ['Services', '#services'],
  ['How it works', '#how-it-works'],
  ['Pricing', '#pricing'],
  ['About', '#about'],
  ['FAQ', '#faq'],
]

function CoNav() {
  const [open, setOpen] = useState(false)
  return (
    <div className="co-nav" style={{ display: 'flex', alignItems: 'center', gap: 32, background: CO.bg, fontFamily: CO.sans, borderBottom: `1px solid ${CO.borderSoft}` }}>
      <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: CO.ink, marginRight: 'auto' }}>
        <Logo />
        <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: -0.2 }}>Kocre IT</span>
      </a>
      <nav className="co-nav-links" style={{ display: 'flex', gap: 28 }}>
        {NAV_LINKS.map(([l, href]) => (
          <a key={l} href={href} style={{ color: CO.ink2, textDecoration: 'none', fontSize: 14 }}>
            {l}
          </a>
        ))}
      </nav>
      <div className="co-nav-actions" style={{ display: 'flex', gap: 10 }}>
        <a href="/login" style={{ fontSize: 14, color: CO.ink2, textDecoration: 'none', padding: '11px 0', alignSelf: 'center' }}>
          Client portal
        </a>
        <CoBtn as="a" href="/free-assessment" kind="primary">
          Free assessment
        </CoBtn>
      </div>
      <button
        className="co-nav-toggle"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', flexDirection: 'column', gap: 5, width: 26 }}
      >
        <span style={{ display: 'block', height: 2, background: CO.ink, borderRadius: 2 }} />
        <span style={{ display: 'block', height: 2, background: CO.ink, borderRadius: 2 }} />
        <span style={{ display: 'block', height: 2, background: CO.ink, borderRadius: 2 }} />
      </button>
      {open && (
        <div className="co-mobile-menu" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: CO.bg, borderBottom: `1px solid ${CO.border}`, padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 14, zIndex: 60 }}>
          {NAV_LINKS.map(([l, href]) => (
            <a key={l} href={href} onClick={() => setOpen(false)} style={{ color: CO.ink2, textDecoration: 'none', fontSize: 15 }}>
              {l}
            </a>
          ))}
          <a href="/login" style={{ color: CO.ink2, textDecoration: 'none', fontSize: 15 }}>
            Client portal
          </a>
          <CoBtn as="a" href="/free-assessment" kind="accent" style={{ justifyContent: 'center' }}>
            Free assessment
          </CoBtn>
        </div>
      )}
    </div>
  )
}

function CoHero() {
  return (
    <section className="co-section co-hero" style={{ background: CO.bg }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 14px', background: CO.greenSoft, borderRadius: 999, fontSize: 13, color: CO.green, marginBottom: 28, fontWeight: 500 }}>
          <Dot color={CO.green} size={6} />
          Now onboarding founding clients
        </div>
        <h1 className="co-h1" style={{ fontFamily: CO.sans, fontWeight: 500, lineHeight: 1.04, letterSpacing: -2.4, color: CO.ink, margin: 0 }}>
          Small-business IT support, <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontWeight: 400 }}>handled remotely.</span>
        </h1>
        <p style={{ marginTop: 26, fontSize: 20, lineHeight: 1.5, color: CO.ink2, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
          Kocre IT helps small teams with helpdesk requests, Microsoft 365, Google Workspace, employee onboarding, and managed Windows device support through one structured portal.
        </p>
        <div style={{ marginTop: 36, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <CoBtn as="a" href="/free-assessment" kind="accent">
            Start free assessment
          </CoBtn>
          <CoBtn as="a" href="#pricing" kind="ghost">
            See pricing
          </CoBtn>
        </div>
      </div>

      <div style={{ maxWidth: 1120, margin: '64px auto 0', background: CO.bg2, border: `1px solid ${CO.border}`, borderRadius: 20, padding: 4 }}>
        <div style={{ background: CO.bg, border: `1px solid ${CO.borderSoft}`, borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${CO.borderSoft}` }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: CO.border }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: CO.border }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: CO.border }} />
            <span style={{ marginLeft: 'auto', fontFamily: CO.mono, fontSize: 11, color: CO.ink3 }}>Kocre IT · client portal</span>
          </div>
          <img
            src="/portal-preview.png"
            alt="The Kocre IT client portal dashboard — account lifecycle, support-request stats, and recent tickets"
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
        </div>
      </div>

      <div className="co-hero-checks" style={{ marginTop: 28, display: 'flex', justifyContent: 'center', gap: 28, color: CO.ink3, fontSize: 13, flexWrap: 'wrap' }}>
        {[
          'Helpdesk support',
          'Cloud admin',
          'Managed Windows devices',
          'Business-hours support',
        ].map((t) => (
          <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconStroke d={ICON.check} size={14} color={CO.green} sw={2.5} /> {t}
          </span>
        ))}
      </div>
    </section>
  )
}

const PLATFORMS = ['Google Workspace', 'Microsoft 365', 'Slack', 'Zoom', 'QuickBooks', 'Dropbox', 'Notion', 'Adobe']

function CoPlatforms() {
  return (
    <div style={{ padding: '40px 0', background: CO.bg2, borderTop: `1px solid ${CO.border}`, borderBottom: `1px solid ${CO.border}` }}>
      <div className="co-section-x">
        <div style={{ textAlign: 'center', fontSize: 12, letterSpacing: 1.4, color: CO.ink3, marginBottom: 22, fontFamily: CO.sans, textTransform: 'uppercase' }}>
          Supports the tools small teams already use
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '18px 40px', flexWrap: 'wrap' }}>
          {PLATFORMS.map((p) => (
            <span key={p} style={{ fontFamily: CO.sans, fontWeight: 600, fontSize: 17, color: CO.ink2, letterSpacing: -0.3 }}>
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

const SERVICES = [
  {
    icon: ICON.users,
    title: 'Remote helpdesk',
    kicker: 'Day to day',
    body: 'Support for everyday computer, software, email, browser, and login issues handled through a structured support process.',
    bullets: ['Slow computer troubleshooting', 'Email issues', 'Login/password help', 'Software errors', 'Browser & app problems', 'Zoom, Teams, Slack support'],
  },
  {
    icon: ICON.cloud,
    title: 'Microsoft 365 & Google Workspace',
    kicker: 'Account & cloud admin',
    body: 'Help managing users, accounts, email access, MFA, shared mailboxes, groups, permissions, and basic admin tasks.',
    bullets: ['New user setup', 'Password resets', 'MFA setup', 'Shared mailbox help', 'License cleanup', 'Employee offboarding'],
  },
  {
    icon: ICON.shield,
    title: 'Managed Windows devices',
    kicker: 'Approved devices',
    body: 'Approved Windows computers can be connected to Kocre IT’s secure support system for remote help, inventory, update visibility, and basic health checks.',
    bullets: ['Remote support access', 'Device inventory', 'Storage & health checks', 'Patch/update visibility', 'Software inventory', 'Basic monitoring'],
  },
  {
    icon: ICON.users,
    title: 'Onboarding & offboarding',
    kicker: 'Employee lifecycle',
    body: 'Structured setup and removal of employee access so accounts, devices, and permissions are handled properly.',
    bullets: ['New hire account setup', 'App access', 'MFA setup', 'Access removal', 'Password resets', 'Offboarding checklist'],
  },
]

function CoServices() {
  return (
    <section id="services" className="co-section">
      <div className="co-services-grid" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 80, alignItems: 'start', maxWidth: 1280, margin: '0 auto' }}>
        <div className="co-services-aside" style={{ position: 'sticky', top: 100 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: CO.green, letterSpacing: 0.6, marginBottom: 16, textTransform: 'uppercase' }}>What we do</div>
          <h2 className="co-h2" style={{ fontFamily: CO.sans, fontWeight: 500, letterSpacing: -1.8, color: CO.ink, margin: 0, lineHeight: 1.02 }}>
            <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontWeight: 400 }}>Four lanes</span> of work, one delivery model.
          </h2>
          <p style={{ marginTop: 20, fontSize: 17, lineHeight: 1.55, color: CO.ink2 }}>
            Every request runs through the same portal, with the same scope and the same audit trail. Quiet by design.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {SERVICES.map((s, i) => (
            <div key={s.title} className="co-service-card" style={{ padding: '32px 36px', background: CO.bg, border: `1px solid ${CO.border}`, borderRadius: 16, display: 'grid', gridTemplateColumns: '52px 1fr', gap: 24 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: CO.greenSoft, display: 'grid', placeItems: 'center' }}>
                <IconStroke d={s.icon} size={22} color={CO.green} sw={1.7} />
              </div>
              <div>
                <div style={{ fontFamily: CO.mono, fontSize: 11, color: CO.ink3, letterSpacing: 0.6, marginBottom: 6, textTransform: 'uppercase' }}>
                  0{i + 1} · {s.kicker}
                </div>
                <h3 style={{ fontFamily: CO.sans, fontSize: 26, fontWeight: 500, letterSpacing: -0.6, color: CO.ink, margin: 0, lineHeight: 1.1 }}>{s.title}</h3>
                <p style={{ fontSize: 15.5, lineHeight: 1.55, color: CO.ink2, marginTop: 12, marginBottom: 16 }}>{s.body}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                  {s.bullets.map((b) => (
                    <span key={b} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: CO.ink }}>
                      <span style={{ width: 4, height: 4, borderRadius: 2, background: CO.green }} />
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const PRINCIPLES = [
  ['Coverage', 'Business-hours remote support', 'Focused support during standard business hours, with urgent or after-hours work reviewed separately.'],
  ['Onboarding', 'Fit review before activation', 'Scope, contacts, approved users, admin access, and devices are confirmed before support goes live.'],
  ['Delivery', 'Portal-tracked, not scattered', 'Requests are tracked in a support workflow instead of disappearing into texts, calls, and random emails.'],
  ['Approach', 'AI-assisted, human-supervised', 'AI may help classify and organize requests, but support actions are reviewed before changes are made.'],
]

function CoPrinciples() {
  return (
    <section style={{ background: CO.bg2 }} className="co-section-tight">
      <div className="co-principles-grid" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
        {PRINCIPLES.map(([label, title, desc], i) => (
          <div key={label} style={{ padding: '24px 32px', borderLeft: i ? `1px solid ${CO.border}` : 'none' }}>
            <div style={{ fontFamily: CO.mono, fontSize: 11, color: CO.green, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 14 }}>{label}</div>
            <div style={{ fontFamily: CO.sans, fontSize: 22, fontWeight: 500, letterSpacing: -0.6, color: CO.ink, lineHeight: 1.15 }}>{title}</div>
            <div style={{ marginTop: 12, fontSize: 14, lineHeight: 1.55, color: CO.ink2 }}>{desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

const STEPS = [
  { n: '01', title: 'Free assessment', body: 'Tell us your team size, tools, devices, and current IT problems.', meta: '≈ 10–12 minutes' },
  { n: '02', title: 'Fit review', body: 'We confirm whether Kocre IT is the right support fit before activation.', meta: '≈ 1–2 business days' },
  { n: '03', title: 'Onboarding', body: 'We set up your portal, confirm contacts, approved users, admin access, and device list.', meta: 'controlled setup' },
  { n: '04', title: 'Support agent install', body: 'For managed plans, approved Windows devices receive the secure support agent.', meta: 'approved devices only' },
  { n: '05', title: 'Support goes live', body: 'Your team submits requests through the portal and Kocre IT tracks, responds, and documents the work.', meta: 'after readiness' },
]

function CoProcess() {
  const [ref, seen] = useInView({ threshold: 0.15 })
  return (
    <section ref={ref} id="how-it-works" className="co-section">
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div className="co-section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56, gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: CO.green, letterSpacing: 0.6, marginBottom: 16, textTransform: 'uppercase' }}>How it works</div>
            <h2 className="co-h2" style={{ fontFamily: CO.sans, fontWeight: 500, letterSpacing: -1.8, color: CO.ink, margin: 0, lineHeight: 1.02, maxWidth: 760 }}>
              How Kocre IT <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontWeight: 400 }}>support works.</span>
            </h2>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: CO.ink2, maxWidth: 360, margin: 0 }}>
            We do not just send a random download link. Every client starts with controlled onboarding so users, devices, access, and scope are clear before support goes live.
          </p>
        </div>
        <div className="co-process-grid" style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 22 }}>
          <div className="co-process-line" style={{ position: 'absolute', top: 22, left: '6%', right: '6%', height: 1, background: CO.border }}>
            <div style={{ height: 1, background: CO.green, width: seen ? '100%' : '0%', transition: 'width 2.6s cubic-bezier(0.2, 0.7, 0.3, 1)' }} />
          </div>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ opacity: seen ? 1 : 0, transform: seen ? 'translateY(0)' : 'translateY(16px)', transition: `opacity 0.6s ease ${0.2 + i * 0.2}s, transform 0.6s ease ${0.2 + i * 0.2}s` }}>
              <div style={{ width: 44, height: 44, borderRadius: 22, background: CO.bg, border: `2px solid ${seen ? CO.green : CO.border}`, display: 'grid', placeItems: 'center', position: 'relative', zIndex: 1, fontFamily: CO.mono, fontSize: 12, fontWeight: 700, color: seen ? CO.green : CO.ink3, transition: `all 0.4s ease ${0.2 + i * 0.2}s` }}>
                {s.n}
              </div>
              <h3 style={{ fontFamily: CO.sans, fontSize: 22, fontWeight: 500, letterSpacing: -0.5, color: CO.ink, marginTop: 28, marginBottom: 10 }}>{s.title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.55, color: CO.ink2, margin: 0 }}>{s.body}</p>
              <div style={{ marginTop: 16, fontFamily: CO.mono, fontSize: 11.5, color: CO.ink3, letterSpacing: 0.4, textTransform: 'uppercase' }}>{s.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const COMPARE_ROWS = [
  ['Support requests', 'Texts, calls, and random emails', 'Portal-tracked support requests'],
  ['Device issues', 'Handled only after something breaks', 'Managed Windows device visibility'],
  ['New employees', 'Manual, inconsistent setup', 'Structured onboarding checklist'],
  ['Departing employees', 'Access may be missed', 'Offboarding and access removal'],
  ['Microsoft/Google admin', 'Owner guesses settings', 'Routine admin support'],
  ['Scope', 'Unclear expectations', 'Clear included/not-included rules'],
  ['Cost', 'Hiring full-time IT may be too expensive', 'Predictable monthly support'],
]

function CoCompare() {
  return (
    <section className="co-section" style={{ background: CO.bg2 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: CO.green, letterSpacing: 0.6, marginBottom: 16, textTransform: 'uppercase' }}>With Kocre · without</div>
          <h2 className="co-h2" style={{ fontFamily: CO.sans, fontWeight: 500, letterSpacing: -1.8, color: CO.ink, margin: 0, lineHeight: 1.02, maxWidth: 780 }}>
            What changes when small teams <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontWeight: 400 }}>stop running</span> their own IT.
          </h2>
        </div>
        <div className="co-compare" style={{ display: 'grid', gridTemplateColumns: '220px 1fr 1fr' }}>
          <div />
          <div className="co-compare-h" style={{ padding: '16px 28px', fontSize: 12, fontWeight: 600, color: CO.ink3, letterSpacing: 0.6, textTransform: 'uppercase' }}>Before</div>
          <div className="co-compare-h" style={{ padding: '16px 28px', fontSize: 12, fontWeight: 600, color: CO.green, letterSpacing: 0.6, textTransform: 'uppercase' }}>After · with Kocre</div>
          {COMPARE_ROWS.map(([cat, bad, good]) => (
            <div key={cat} style={{ display: 'contents' }}>
              <div className="co-compare-cat" style={{ padding: '24px 0', borderTop: `1px solid ${CO.border}`, fontSize: 13, fontWeight: 500, color: CO.ink2 }}>{cat}</div>
              <div style={{ padding: '24px 28px', borderTop: `1px solid ${CO.border}`, fontFamily: CO.serif, fontSize: 19, lineHeight: 1.4, color: CO.ink3, fontStyle: 'italic' }}>{bad}</div>
              <div style={{ padding: '24px 28px', borderTop: `1px solid ${CO.border}`, fontSize: 16, lineHeight: 1.45, color: CO.ink, fontWeight: 500 }}>{good}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PickerButtons({ options, value, onChange, columns = 2 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
      {options.map(([key, label]) => {
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={{
              padding: '12px 10px',
              fontFamily: CO.sans,
              fontSize: 13.5,
              fontWeight: 500,
              background: active ? CO.ink : CO.bg,
              color: active ? '#fff' : CO.ink,
              border: `1px solid ${active ? CO.ink : CO.border}`,
              cursor: 'pointer',
              borderRadius: 999,
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function CoPricing() {
  const [team, setTeam] = useState(8)
  const [env, setEnv] = useState('windows')
  const [need, setNeed] = useState('managed')
  const [urgency, setUrgency] = useState('normal')

  const plan = recommendPath(team, env, need, urgency)
  const monthly = computeMonthly(plan, team)
  const animPrice = useAnimatedNumber(monthly ?? 0)

  const tiers = [
    PLAN_CATALOG.founding,
    PLAN_CATALOG.remote,
    PLAN_CATALOG.managed,
    PLAN_CATALOG.secure,
  ]

  const priceLabel = (p) => {
    if (p.key === 'founding') return '$399'
    if (p.perUser) return `$${p.perUser}`
    return null
  }
  const priceSuffix = (p) => {
    if (p.key === 'founding') return '/ month'
    if (p.perUser) return '/ user / month'
    return null
  }

  return (
    <section id="pricing" className="co-section">
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 56px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: CO.green, letterSpacing: 0.6, marginBottom: 16, textTransform: 'uppercase' }}>Pricing</div>
          <h2 className="co-h2" style={{ fontFamily: CO.sans, fontWeight: 500, letterSpacing: -1.8, color: CO.ink, margin: 0, lineHeight: 1.02 }}>
            Simple monthly support <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontWeight: 400 }}>based on your team size.</span>
          </h2>
          <p style={{ marginTop: 20, fontSize: 16.5, lineHeight: 1.55, color: CO.ink2 }}>
            Plans are priced per supported user, with managed Windows device support included on Managed Desk and Secure Desk. Standard remote support is included under fair-use rules. Projects, migrations, after-hours emergencies, hardware repair, cabling, and on-site work are quoted separately.
          </p>
        </div>

        <div className="co-calc" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'stretch', marginBottom: 28 }}>
          <div style={{ background: CO.bg2, border: `1px solid ${CO.border}`, borderRadius: 20, padding: 36 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: CO.ink3, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 18 }}>
              Find your support path
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <label style={{ fontSize: 14, fontWeight: 500, color: CO.ink }}>Team size</label>
                <span style={{ fontFamily: CO.serif, fontSize: 38, fontWeight: 500, color: CO.ink, letterSpacing: -1.2, lineHeight: 1 }}>
                  {team}
                  <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontSize: 16, color: CO.ink3, marginLeft: 6 }}>users</span>
                </span>
              </div>
              <input type="range" min="1" max="50" value={team} onChange={(e) => setTeam(+e.target.value)} style={{ width: '100%', accentColor: CO.green }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: CO.ink3, marginTop: 8 }}>
                <span>1</span>
                <span>10</span>
                <span>25</span>
                <span>50+</span>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13.5, fontWeight: 500, color: CO.ink, display: 'block', marginBottom: 10 }}>Device environment</label>
              <PickerButtons
                value={env}
                onChange={setEnv}
                columns={3}
                options={[
                  ['windows', 'Mostly Windows'],
                  ['mixed', 'Mixed Win/Mac'],
                  ['mac', 'Mostly Mac/Linux'],
                ]}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13.5, fontWeight: 500, color: CO.ink, display: 'block', marginBottom: 10 }}>What you need most</label>
              <PickerButtons
                value={need}
                onChange={setNeed}
                columns={2}
                options={[
                  ['helpdesk', 'Helpdesk only'],
                  ['helpdesk_admin', 'Helpdesk + cloud admin'],
                  ['managed', 'Managed devices'],
                  ['security', 'Security hygiene'],
                ]}
              />
            </div>

            <div>
              <label style={{ fontSize: 13.5, fontWeight: 500, color: CO.ink, display: 'block', marginBottom: 10 }}>Urgency</label>
              <PickerButtons
                value={urgency}
                onChange={setUrgency}
                columns={3}
                options={[
                  ['normal', 'Normal business-hours'],
                  ['frequent', 'Frequent interruptions'],
                  ['urgent', 'Needs urgent review'],
                ]}
              />
            </div>
          </div>

          <div style={{ background: CO.bg3, color: '#fff', borderRadius: 20, padding: 36, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.6, opacity: 0.55, textTransform: 'uppercase', marginBottom: 14 }}>Recommended path</div>
            <div style={{ fontFamily: CO.sans, fontWeight: 500, fontSize: 48, letterSpacing: -1.6, lineHeight: 1.05, color: '#fff', marginBottom: 6 }}>
              <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontWeight: 400, color: '#a3d4b3' }}>{plan.name}</span>
            </div>
            <div style={{ fontSize: 14.5, opacity: 0.7, marginBottom: 20 }}>{plan.summary}</div>

            {monthly !== null ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: CO.sans, fontWeight: 500, fontSize: 52, letterSpacing: -1.6 }}>${Math.round(animPrice).toLocaleString()}</span>
                <span style={{ fontSize: 15, opacity: 0.6 }}>est. / month</span>
              </div>
            ) : (
              <div style={{ fontFamily: CO.sans, fontWeight: 500, fontSize: 28, letterSpacing: -0.8 }}>Quoted by review</div>
            )}

            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 12, fontSize: 14 }}>
              {[
                ['Best fit', plan.fit],
                ['Setup', plan.setupLabel || '—'],
                ['Response', plan.response],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <span style={{ opacity: 0.6 }}>{k}</span>
                  <span style={{ fontFamily: CO.mono, fontWeight: 500, textAlign: 'right', maxWidth: 220 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5, opacity: 0.85 }}>
              {plan.includes.slice(0, 5).map((row) => (
                <span key={row} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <IconStroke d={ICON.check} size={13} color="#a3d4b3" sw={2.5} />
                  {row}
                </span>
              ))}
            </div>

            <a href="/free-assessment" style={{ marginTop: 'auto', paddingTop: 28 }}>
              <span style={{ display: 'block', textAlign: 'center', width: '100%', padding: '15px', background: '#a3d4b3', color: CO.bg3, fontFamily: CO.sans, fontSize: 14.5, fontWeight: 600, borderRadius: 999, textDecoration: 'none' }}>
                Start {plan.name} assessment →
              </span>
            </a>
          </div>
        </div>

        <div className="co-tiers" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          {tiers.map((t) => (
            <div key={t.key} style={{ background: t.featured ? CO.bg2 : CO.bg, border: `1px solid ${t.featured ? CO.green : CO.border}`, borderRadius: 18, padding: 28, position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {t.featured && (
                <div style={{ position: 'absolute', top: -12, right: 20, background: CO.green, color: '#fff', fontSize: 10.5, padding: '4px 12px', borderRadius: 999, letterSpacing: 0.4, fontWeight: 600, textTransform: 'uppercase' }}>Recommended</div>
              )}
              <div style={{ fontFamily: CO.serif, fontStyle: 'italic', fontSize: 26, color: CO.ink, marginBottom: 4, letterSpacing: -0.4, fontWeight: 500, lineHeight: 1.1 }}>{t.name}</div>
              <div style={{ fontSize: 12.5, color: CO.ink3, marginBottom: 18, minHeight: 30 }}>{t.fit}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: CO.ink3 }}>$</span>
                <span style={{ fontFamily: CO.sans, fontSize: 38, fontWeight: 500, color: CO.ink, letterSpacing: -1.2, lineHeight: 1 }}>{priceLabel(t)?.replace('$', '')}</span>
                <span style={{ fontSize: 12.5, color: CO.ink3, marginLeft: 4 }}>{priceSuffix(t)}</span>
              </div>
              {t.minMonth && (
                <div style={{ fontSize: 12, color: CO.ink3, marginTop: 4 }}>${t.minMonth}/month minimum</div>
              )}
              <div style={{ fontSize: 12, color: CO.ink3, marginTop: 6 }}>{t.setupLabel}</div>
              <CoBtn as="a" href="/free-assessment" kind={t.featured ? 'accent' : 'ghost'} style={{ marginTop: 18, width: '100%', justifyContent: 'center', padding: '12px' }}>
                Start assessment
              </CoBtn>
              <ul style={{ listStyle: 'none', padding: 0, margin: '22px 0 0' }}>
                {t.includes.map((r) => (
                  <li key={r} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '7px 0', fontSize: 13.5, color: CO.ink, lineHeight: 1.4 }}>
                    <IconStroke d={ICON.check} size={14} color={CO.green} sw={2.5} />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, padding: '20px 24px', background: CO.bg2, border: `1px solid ${CO.border}`, borderRadius: 14, textAlign: 'center', fontSize: 14, color: CO.ink2 }}>
          <strong style={{ color: CO.ink, fontWeight: 600 }}>Bigger or unusual situation?</strong>{' '}
          Teams over ~25 users, mostly Mac/Linux environments, after-hours expectations, heavy compliance, or on-site work get a <strong style={{ color: CO.ink, fontWeight: 600 }}>Custom Review</strong> — we quote a tailored scope instead of forcing a standard plan.
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: CO.ink3 }}>
          Routine remote support is standard. Larger projects, migrations, and implementation work are scoped separately.{' '}
          <a href="/support-transparency" style={{ color: CO.green, textDecoration: 'none', fontWeight: 500 }}>
            Review support scope
          </a>
          .
        </div>
      </div>
    </section>
  )
}

function CoAgentExplainer() {
  return (
    <section className="co-section" style={{ background: CO.bg }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: CO.green, letterSpacing: 0.6, marginBottom: 16, textTransform: 'uppercase' }}>Managed devices</div>
          <h2 className="co-h2" style={{ fontFamily: CO.sans, fontWeight: 500, letterSpacing: -1.6, color: CO.ink, margin: 0, lineHeight: 1.05 }}>
            How <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontWeight: 400 }}>managed device support</span> works.
          </h2>
          <p style={{ marginTop: 20, fontSize: 16.5, lineHeight: 1.55, color: CO.ink2, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
            For managed device plans, approved Windows computers can receive a secure Kocre IT support agent. The agent helps with remote troubleshooting, device inventory, update visibility, basic health checks, and faster support sessions.
          </p>
        </div>
        <div className="co-agent-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: CO.bg, border: `1px solid ${CO.border}`, borderRadius: 18, padding: 30 }}>
            <div style={{ fontFamily: CO.mono, fontSize: 11, color: CO.green, letterSpacing: 0.6, marginBottom: 12, textTransform: 'uppercase' }}>What it helps with</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                'Remote troubleshooting',
                'Device inventory',
                'Update visibility',
                'Storage and health checks',
                'Software inventory',
                'Faster support sessions',
              ].map((r) => (
                <li key={r} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', fontSize: 15, color: CO.ink }}>
                  <IconStroke d={ICON.check} size={15} color={CO.green} sw={2.5} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: CO.bg2, border: `1px solid ${CO.border}`, borderRadius: 18, padding: 30 }}>
            <div style={{ fontFamily: CO.mono, fontSize: 11, color: CO.ink3, letterSpacing: 0.6, marginBottom: 12, textTransform: 'uppercase' }}>What it does not mean</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                'We do not install it without approval',
                'We do not support personal devices unless approved',
                'We do not provide 24/7 monitoring by default',
                'We do not make major changes without authorization',
                'We remove the agent during offboarding/cancellation',
              ].map((r) => (
                <li key={r} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', fontSize: 15, color: CO.ink2, lineHeight: 1.45 }}>
                  <span style={{ marginTop: 7, width: 6, height: 1.5, background: CO.ink3, flexShrink: 0 }} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

const SCOPE_ITEMS = [
  ['What counts as standard support?', 'Standard support covers routine remote issues and admin tasks that can normally be handled within 30 minutes.'],
  ['What is quoted separately?', 'Projects, migrations, vendor escalations, security incidents, after-hours requests, hardware repair, cabling, server work, and major system changes.'],
  ['What does remote-only mean?', 'Kocre IT supports accounts, software, cloud tools, and approved devices remotely. Physical work is outside standard monthly support.'],
  ['What happens if usage is too high?', 'If support usage is consistently above the normal range for your plan, Kocre IT may recommend a higher plan or scoped project pricing before continuing.'],
  ['Is first response the same as resolution?', 'No. First response means the request has been acknowledged and reviewed. Resolution time depends on access, user availability, vendors, and complexity.'],
]

function CoScopeGuardrails() {
  const [open, setOpen] = useState(0)
  return (
    <section className="co-section" style={{ background: CO.bg2, borderTop: `1px solid ${CO.border}`, borderBottom: `1px solid ${CO.border}` }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40, maxWidth: 760, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: CO.green, letterSpacing: 0.6, marginBottom: 16, textTransform: 'uppercase' }}>Scope</div>
          <h2 className="co-h2" style={{ fontFamily: CO.sans, fontWeight: 500, letterSpacing: -1.6, color: CO.ink, margin: 0, lineHeight: 1.05 }}>
            Clear scope. <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontWeight: 400 }}>No surprise promises.</span>
          </h2>
          <p style={{ marginTop: 18, fontSize: 16, lineHeight: 1.55, color: CO.ink2 }}>
            Kocre IT is remote-first. Standard support covers routine remote issues. Larger work is reviewed before it becomes a project.
          </p>
        </div>
        <div>
          {SCOPE_ITEMS.map(([q, a], i) => (
            <div key={q} style={{ borderTop: `1px solid ${CO.border}` }}>
              <button aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)} className="co-faq-q" style={{ width: '100%', padding: '22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontFamily: CO.sans, fontSize: 18, fontWeight: 500, color: CO.ink, letterSpacing: -0.3 }}>{q}</span>
                <span style={{ width: 28, height: 28, minWidth: 28, borderRadius: 14, background: open === i ? CO.ink : 'transparent', border: `1px solid ${open === i ? CO.ink : CO.border}`, color: open === i ? '#fff' : CO.ink2, display: 'grid', placeItems: 'center', fontSize: 16 }}>
                  {open === i ? '−' : '+'}
                </span>
              </button>
              {open === i && <div style={{ paddingBottom: 22, fontSize: 15.5, lineHeight: 1.6, color: CO.ink2, maxWidth: 780 }}>{a}</div>}
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${CO.border}` }} />
        </div>
      </div>
    </section>
  )
}

const FIT_GOOD = [
  '1–20 users',
  'Mostly Windows computers',
  'Microsoft 365 or Google Workspace',
  'No internal IT team',
  'Business-hours support expectations',
  'Remote-friendly operations',
  'Needs helpdesk, accounts, software, and device support',
]

const FIT_NOT = [
  'Need on-site visits',
  'Need 24/7 emergency coverage',
  'Heavy compliance requirements',
  'Complex servers/networks',
  'Mostly Mac/Linux environment',
  'Cabling/network installation',
  'Full cybersecurity incident response',
]

function CoFitChecker() {
  return (
    <section className="co-section" style={{ background: CO.bg }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: CO.green, letterSpacing: 0.6, marginBottom: 16, textTransform: 'uppercase' }}>Fit check</div>
          <h2 className="co-h2" style={{ fontFamily: CO.sans, fontWeight: 500, letterSpacing: -1.6, color: CO.ink, margin: 0, lineHeight: 1.05 }}>
            Is Kocre IT <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontWeight: 400 }}>the right fit?</span>
          </h2>
        </div>
        <div className="co-fit-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: CO.bg2, border: `1px solid ${CO.green}40`, borderRadius: 18, padding: 30 }}>
            <div style={{ fontFamily: CO.mono, fontSize: 11, color: CO.green, letterSpacing: 0.6, marginBottom: 14, textTransform: 'uppercase' }}>Good fit</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {FIT_GOOD.map((r) => (
                <li key={r} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '9px 0', fontSize: 15, color: CO.ink }}>
                  <IconStroke d={ICON.check} size={15} color={CO.green} sw={2.5} />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: CO.bg, border: `1px solid ${CO.border}`, borderRadius: 18, padding: 30 }}>
            <div style={{ fontFamily: CO.mono, fontSize: 11, color: CO.ink3, letterSpacing: 0.6, marginBottom: 14, textTransform: 'uppercase' }}>Not ideal yet</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {FIT_NOT.map((r) => (
                <li key={r} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '9px 0', fontSize: 15, color: CO.ink2, lineHeight: 1.45 }}>
                  <span style={{ marginTop: 7, width: 6, height: 1.5, background: CO.ink3, flexShrink: 0 }} />
                  {r}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 16, fontSize: 13.5, color: CO.ink3, fontStyle: 'italic', fontFamily: CO.serif }}>
              These situations get a Custom Review — we will tell you honestly whether we are a fit or recommend another path.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const PROOF = [
  ['Founder-led support model', 'The business is being built by a founder actively shaping the public site, onboarding logic, client portal, admin workflows, and AI-assisted support systems behind the service.'],
  ['Platform-minded operations', 'Kocre IT is structured around real systems — tickets, contacts, access, onboarding, launch discipline, and operational visibility — not just homepage copy.'],
  ['Honest pilot-stage positioning', 'Where long-term client history is still being built, the brand prioritizes clarity, scope control, and process honesty over inflated claims.'],
]

function CoAbout() {
  return (
    <section id="about" className="co-section" style={{ background: CO.bg2, borderTop: `1px solid ${CO.border}`, borderBottom: `1px solid ${CO.border}` }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: CO.green, letterSpacing: 0.6, marginBottom: 20, textTransform: 'uppercase' }}>About</div>
          <h2 className="co-quote" style={{ fontFamily: CO.sans, fontWeight: 500, lineHeight: 1.25, letterSpacing: -1, color: CO.ink, margin: '0 auto', maxWidth: 880 }}>
            Built to feel controlled, clear, and operationally serious — not to{' '}
            <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontWeight: 400 }}>sound bigger than reality.</span>
          </h2>
        </div>

        <div className="co-founder" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 28, background: CO.bg, border: `1px solid ${CO.border}`, borderRadius: 20, padding: 40, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <FounderAvatar />
            <div>
              <div style={{ fontFamily: CO.sans, fontSize: 20, fontWeight: 600, letterSpacing: -0.4, color: CO.ink }}>{FOUNDER.name}</div>
              <div style={{ fontFamily: CO.mono, fontSize: 12, color: CO.ink3, letterSpacing: 0.4, marginTop: 4, textTransform: 'uppercase' }}>{FOUNDER.title}</div>
            </div>
          </div>
          <p style={{ fontFamily: CO.serif, fontSize: 22, lineHeight: 1.5, color: CO.ink, margin: 0, letterSpacing: -0.2 }}>
            &ldquo;{FOUNDER.note}&rdquo;
          </p>
        </div>

        <div className="co-proof-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {PROOF.map(([title, desc]) => (
            <div key={title} style={{ background: CO.bg, border: `1px solid ${CO.border}`, borderRadius: 16, padding: '28px 28px' }}>
              <h3 style={{ fontFamily: CO.sans, fontSize: 18, fontWeight: 600, letterSpacing: -0.4, color: CO.ink, margin: 0 }}>{title}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: CO.ink2, marginTop: 12, marginBottom: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CoFaq() {
  const [open, setOpen] = useState(0)
  return (
    <section id="faq" className="co-section">
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: CO.green, letterSpacing: 0.6, marginBottom: 16, textTransform: 'uppercase' }}>FAQ</div>
          <h2 className="co-h2" style={{ fontFamily: CO.sans, fontWeight: 500, letterSpacing: -1.8, color: CO.ink, margin: 0, lineHeight: 1.02 }}>
            Common <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontWeight: 400 }}>questions</span>, answered plainly.
          </h2>
        </div>
        <div>
          {FAQS.map(([q, a], i) => (
            <div key={q} style={{ borderTop: `1px solid ${CO.border}` }}>
              <button aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)} className="co-faq-q" style={{ width: '100%', padding: '28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontFamily: CO.sans, fontSize: 22, fontWeight: 500, color: CO.ink, letterSpacing: -0.4 }}>{q}</span>
                <span style={{ width: 32, height: 32, minWidth: 32, borderRadius: 16, background: open === i ? CO.ink : 'transparent', border: `1px solid ${open === i ? CO.ink : CO.border}`, color: open === i ? '#fff' : CO.ink2, display: 'grid', placeItems: 'center', fontSize: 18 }}>
                  {open === i ? '−' : '+'}
                </span>
              </button>
              {open === i && <div style={{ paddingBottom: 28, fontSize: 16.5, lineHeight: 1.6, color: CO.ink2, maxWidth: 780 }}>{a}</div>}
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${CO.border}` }} />
        </div>
      </div>
    </section>
  )
}

function CoCtaFooter() {
  return (
    <>
      <section className="co-section" style={{ background: CO.bg3, color: '#fff', textAlign: 'center' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#a3d4b3', letterSpacing: 0.6, marginBottom: 20, textTransform: 'uppercase' }}>Next</div>
          <h2 className="co-cta-h" style={{ fontFamily: CO.sans, fontWeight: 500, letterSpacing: -2.6, lineHeight: 1.02, margin: 0 }}>
            See if <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontWeight: 400, color: '#a3d4b3' }}>Kocre fits.</span>
          </h2>
          <p style={{ marginTop: 24, fontSize: 18, lineHeight: 1.55, color: 'rgba(255,255,255,0.65)', maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}>
            Start with a free assessment. We review your team size, tools, devices, and support needs before recommending a plan.
          </p>
          <div style={{ marginTop: 36, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/free-assessment" style={{ padding: '15px 24px', background: '#a3d4b3', color: CO.bg3, fontFamily: CO.sans, fontSize: 15, fontWeight: 600, borderRadius: 999, textDecoration: 'none' }}>
              Start free assessment →
            </a>
            <a href="/pilot" style={{ padding: '15px 24px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontFamily: CO.sans, fontSize: 15, fontWeight: 500, borderRadius: 999, textDecoration: 'none' }}>
              Review pilot path
            </a>
          </div>
          <p style={{ marginTop: 22, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            Limited founding client spots available for 90-day managed support pilots.
          </p>
        </div>
      </section>
      <footer style={{ padding: '40px 0', background: CO.bg, borderTop: `1px solid ${CO.border}` }}>
        <div className="co-section-x" style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', paddingBottom: 28, marginBottom: 24, borderBottom: `1px solid ${CO.border}` }}>
            <div style={{ maxWidth: 470 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: CO.ink, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>Service areas</div>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, color: CO.ink2, margin: 0 }}>
                Serving DMV-based and remote-first U.S. small businesses — Washington, DC, Maryland, and Northern Virginia, plus remote teams across the U.S. International remote support may be reviewed case by case.
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12 }}>
                {REGIONS.map((r) => (
                  <a key={r.slug} href={`/service-areas/${r.slug}`} style={{ fontSize: 13, color: CO.ink2, textDecoration: 'none' }}>
                    {r.short}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: CO.ink, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>Contact</div>
              <a href={`tel:${BUSINESS.telephone}`} style={{ display: 'block', fontSize: 13.5, color: CO.ink2, textDecoration: 'none', marginBottom: 6 }}>{BUSINESS.telephoneDisplay}</a>
              <a href={`mailto:${BUSINESS.email}`} style={{ display: 'block', fontSize: 13.5, color: CO.ink2, textDecoration: 'none', marginBottom: 12 }}>{BUSINESS.email}</a>
              <div style={{ display: 'flex', gap: 14 }}>
                <a href={BUSINESS.sameAs[0]} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: CO.ink2, textDecoration: 'none' }}>Facebook</a>
                <a href={BUSINESS.sameAs[1]} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: CO.ink2, textDecoration: 'none' }}>Instagram</a>
              </div>
            </div>
          </div>
          <div className="co-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, color: CO.ink2, fontSize: 13, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Logo />
                <span style={{ fontWeight: 600, color: CO.ink }}>Kocre IT</span>
              </span>
              {[
                ['Pilot', '/pilot'],
                ['Scope', '/support-transparency'],
                ['Privacy', '/privacy'],
                ['Terms', '/terms'],
                ['Client portal', '/login'],
              ].map(([l, href]) => (
                <a key={l} href={href} style={{ color: CO.ink2, textDecoration: 'none' }}>
                  {l}
                </a>
              ))}
            </div>
            <div style={{ fontSize: 12.5, color: CO.ink3 }}>© 2026 Kocre IT Services · remote-only · based in Virginia</div>
          </div>
        </div>
      </footer>
    </>
  )
}

export default function Home() {
  return (
    <div id="calmop" style={{ background: CO.bg, color: CO.ink, fontFamily: CO.sans, width: '100%' }}>
      <style>{CALMOP_CSS}</style>
      <CoNav />
      <CoHero />
      <CoPlatforms />
      <CoServices />
      <CoPrinciples />
      <CoProcess />
      <CoAgentExplainer />
      <CoCompare />
      <CoPricing />
      <CoScopeGuardrails />
      <CoFitChecker />
      <CoAbout />
      <CoFaq />
      <CoCtaFooter />
    </div>
  )
}

// Scoped stylesheet. Overrides the global Outfit/Source-Serif !important rules
// for this page, defines the dot pulse + range styling, and handles responsive
// collapse (the source design was desktop-only with fixed paddings).
const CALMOP_CSS = `
#calmop { font-family: "Inter Tight","Inter",system-ui,sans-serif; }
#calmop h1, #calmop h2, #calmop h3 { font-family: "Inter Tight","Inter",system-ui,sans-serif !important; }
#calmop h1 span, #calmop h2 span, #calmop h3 span { font-family: inherit; }
#calmop .co-section { padding: 120px 64px; }
#calmop .co-section-tight { padding: 80px 64px; }
#calmop .co-hero { padding-top: 60px; padding-bottom: 80px; }
#calmop .co-nav { padding: 20px 64px; position: relative; }
#calmop .co-section-x { padding: 0 64px; }
#calmop .co-h1 { font-size: 78px; }
#calmop .co-h2 { font-size: 56px; }
#calmop .co-quote { font-size: 38px; }
#calmop .co-cta-h { font-size: 80px; }
#calmop input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; height: 22px; }
#calmop input[type=range]::-webkit-slider-runnable-track { height: 4px; background: rgba(0,0,0,0.08); border-radius: 2px; }
#calmop input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 9px; background: ${CO.green}; margin-top: -7px; border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.15); cursor: pointer; }
#calmop input[type=range]::-moz-range-track { height: 4px; background: rgba(0,0,0,0.08); border-radius: 2px; }
#calmop input[type=range]::-moz-range-thumb { width: 18px; height: 18px; border-radius: 9px; background: ${CO.green}; border: 2px solid #fff; cursor: pointer; }
#calmop .co-faq-q:hover span:first-child { color: ${CO.green}; }
#calmop a:focus-visible, #calmop button:focus-visible, #calmop input:focus-visible { outline: 2px solid ${CO.green}; outline-offset: 3px; border-radius: 6px; }
#calmop .co-service-card { transition: border-color 0.2s, box-shadow 0.2s; }
#calmop .co-service-card:hover { border-color: ${CO.green}; box-shadow: 0 8px 28px rgba(15,16,14,0.05); }
@keyframes coDotPulse { 0% { transform: scale(1); opacity: 0.7 } 70% { transform: scale(2.6); opacity: 0 } 100% { transform: scale(2.6); opacity: 0 } }
#calmop .co-dot-pulse { animation: coDotPulse 1.8s infinite; }

@media (max-width: 1100px) {
  #calmop .co-tiers { grid-template-columns: 1fr 1fr !important; }
}
@media (max-width: 1000px) {
  #calmop .co-services-grid { grid-template-columns: 1fr !important; gap: 40px; }
  #calmop .co-services-aside { position: static !important; top: auto !important; }
  #calmop .co-process-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 32px 22px; }
  #calmop .co-process-line { display: none; }
}
@media (max-width: 880px) {
  #calmop .co-nav-links, #calmop .co-nav-actions { display: none !important; }
  #calmop .co-nav-toggle { display: flex !important; }
  #calmop .co-section { padding: 72px 22px; }
  #calmop .co-section-tight { padding: 48px 22px; }
  #calmop .co-nav { padding: 16px 22px; }
  #calmop .co-section-x { padding: 0 22px; }
  #calmop .co-h1 { font-size: 40px; letter-spacing: -1.2px; }
  #calmop .co-h2 { font-size: 34px; letter-spacing: -1px; }
  #calmop .co-quote { font-size: 26px; }
  #calmop .co-cta-h { font-size: 42px; letter-spacing: -1.4px; }
  #calmop .co-h1 br, #calmop .co-cta-h br { display: none; }
  #calmop .co-principles-grid { grid-template-columns: 1fr 1fr !important; }
  #calmop .co-principles-grid > div { border-left: none !important; border-top: 1px solid ${CO.border}; }
  #calmop .co-process-grid { grid-template-columns: 1fr 1fr !important; gap: 36px 24px; }
  #calmop .co-process-line { display: none; }
  #calmop .co-section-head { flex-direction: column; align-items: flex-start; gap: 16px; }
  #calmop .co-calc { grid-template-columns: 1fr !important; }
  #calmop .co-tiers { grid-template-columns: 1fr !important; max-width: 460px; margin-left: auto; margin-right: auto; }
  #calmop .co-proof-grid { grid-template-columns: 1fr !important; }
  #calmop .co-compare { grid-template-columns: 1fr !important; }
  #calmop .co-compare-h { display: none; }
  #calmop .co-compare-cat { padding: 18px 0 4px !important; font-size: 12px !important; text-transform: uppercase; letter-spacing: 0.6px; color: ${CO.green} !important; border-top: 1px solid ${CO.border}; }
  #calmop .co-compare > div > div:nth-child(2) { padding: 4px 0 18px !important; border-top: none !important; }
  #calmop .co-compare > div > div:nth-child(3) { padding: 0 0 18px !important; border-top: none !important; }
  #calmop .co-agent-grid, #calmop .co-fit-grid { grid-template-columns: 1fr !important; }
}
@media (max-width: 560px) {
  #calmop .co-principles-grid { grid-template-columns: 1fr !important; }
  #calmop .co-process-grid { grid-template-columns: 1fr !important; }
}
`
