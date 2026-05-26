'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

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
  ink3: '#807c75',
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

// Pricing model: team size + intensity → recommended path.
function computePlan(teamSize, intensity = 1) {
  const base = teamSize <= 6 ? 'Starter' : teamSize <= 18 ? 'Growth' : 'Scale'
  const bumped =
    intensity === 2 && base === 'Starter'
      ? 'Growth'
      : intensity === 2 && base === 'Growth'
      ? 'Scale'
      : base
  const tickets = bumped === 'Starter' ? 10 : bumped === 'Growth' ? 30 : Math.max(40, teamSize * 2)
  const price = bumped === 'Starter' ? 499 : bumped === 'Growth' ? 999 : 1999 + Math.max(0, teamSize - 25) * 60
  const responseLabel = bumped === 'Starter' ? '1 business day' : bumped === 'Growth' ? '4 business hours' : '1 business hour'
  return { plan: bumped, tickets, price, responseLabel }
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
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="11" r="10" fill="none" stroke={color} strokeWidth="1.6" />
      <circle cx="11" cy="11" r="4" fill={CO.green} />
    </svg>
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

// Honest portal preview — illustrative interface, no invented metrics.
const PREVIEW_TILES = [
  ['Coverage', '9–6', 'ET', 'Mon–Fri business hours'],
  ['Built for', '1–25', 'users', 'U.S. small businesses'],
  ['Support paths', '3', '', 'Starter · Growth · Scale'],
  ['Model', 'Remote', '', 'remote-only by design'],
  ['Activation', 'Fit-first', '', 'onboarding before go-live'],
]

function CoHero() {
  return (
    <section className="co-section co-hero" style={{ background: CO.bg }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 14px', background: CO.greenSoft, borderRadius: 999, fontSize: 13, color: CO.green, marginBottom: 28, fontWeight: 500 }}>
          <Dot color={CO.green} size={6} />
          Onboarding U.S. small businesses · 1–25 users
        </div>
        <h1 className="co-h1" style={{ fontFamily: CO.sans, fontWeight: 500, lineHeight: 1.04, letterSpacing: -2.4, color: CO.ink, margin: 0 }}>
          Quietly capable IT support
          <br />
          for the size of business you actually run.
        </h1>
        <p style={{ marginTop: 26, fontSize: 20, lineHeight: 1.5, color: CO.ink2, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
          Day-to-day helpdesk, cloud admin, and user support — delivered through a structured portal, with real onboarding
          and human-supervised AI. Built for U.S. small businesses without an in-house IT team.
        </p>
        <div style={{ marginTop: 36, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <CoBtn as="a" href="/free-assessment" kind="accent">
            Start free assessment
          </CoBtn>
          <CoBtn as="a" href="#how-it-works" kind="ghost">
            See how it works
          </CoBtn>
        </div>
      </div>

      <div style={{ maxWidth: 1120, margin: '64px auto 0', background: CO.bg2, border: `1px solid ${CO.border}`, borderRadius: 20, padding: 4 }}>
        <div style={{ background: CO.bg, border: `1px solid ${CO.borderSoft}`, borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${CO.borderSoft}`, flexWrap: 'wrap' }}>
            <Dot color={CO.green} size={7} />
            <span style={{ fontSize: 13, fontWeight: 500, color: CO.ink }}>Client portal</span>
            <span style={{ fontSize: 12, color: CO.ink3 }}>· structured remote support</span>
            <span style={{ marginLeft: 'auto', fontFamily: CO.mono, fontSize: 11, color: CO.ink3 }}>illustrative interface</span>
          </div>
          <div className="co-preview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: `1px solid ${CO.borderSoft}` }}>
            {PREVIEW_TILES.map(([k, v, unit, sub], i) => (
              <div key={k} className="co-preview-cell" style={{ padding: '24px 20px', borderRight: i < 4 ? `1px solid ${CO.borderSoft}` : 'none' }}>
                <div style={{ fontSize: 12, color: CO.ink3, marginBottom: 8 }}>{k}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontFamily: CO.serif, fontSize: 32, fontWeight: 500, color: CO.ink, letterSpacing: -1, lineHeight: 1 }}>{v}</span>
                  {unit && <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontSize: 16, color: CO.ink3 }}>{unit}</span>}
                </div>
                <div style={{ fontSize: 11.5, color: CO.ink2, marginTop: 8 }}>{sub}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: CO.ink2, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: CO.ink3, letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 500 }}>How it works</span>
            <span style={{ fontFamily: CO.mono, color: CO.green, fontSize: 11 }}>OK</span>
            <span>Every request runs through a ticketed workflow with an audit trail.</span>
          </div>
        </div>
      </div>

      <div className="co-hero-checks" style={{ marginTop: 28, display: 'flex', justifyContent: 'center', gap: 28, color: CO.ink3, fontSize: 13, flexWrap: 'wrap' }}>
        {['Month-to-month after onboarding', 'Cancel any time · 30 days notice', 'Activation only after onboarding'].map((t) => (
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
          Works across the tools you already use
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
    title: 'Helpdesk & user support',
    kicker: 'Day to day',
    body: 'Account access, email problems, software troubleshooting, device guidance — the small frictions that slow teams down every week.',
    bullets: ['Email & account access', 'Software troubleshooting', 'Remote device guidance', 'Day-to-day user support'],
  },
  {
    icon: ICON.cloud,
    title: 'Cloud & SaaS administration',
    kicker: 'Recurring admin',
    body: 'Microsoft 365, Google Workspace, Slack, Zoom — provisioning, permissions, license hygiene, and the routine admin no one wants to own.',
    bullets: ['Workspace & M365', 'User provisioning', 'Permission management', 'Routine admin support'],
  },
  {
    icon: ICON.shield,
    title: 'Structured remote support',
    kicker: 'Without hiring',
    body: 'A full support model for teams that need real IT without bringing on an internal hire — defined scope, real onboarding, complete audit trail.',
    bullets: ['Business-hours coverage', 'Portal-based workflow', 'Lifecycle onboarding', 'Human-supervised AI'],
  },
]

function CoServices() {
  return (
    <section id="services" className="co-section">
      <div className="co-services-grid" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 80, alignItems: 'start', maxWidth: 1280, margin: '0 auto' }}>
        <div className="co-services-aside" style={{ position: 'sticky', top: 100 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: CO.green, letterSpacing: 0.6, marginBottom: 16, textTransform: 'uppercase' }}>What we do</div>
          <h2 className="co-h2" style={{ fontFamily: CO.sans, fontWeight: 500, letterSpacing: -1.8, color: CO.ink, margin: 0, lineHeight: 1.02 }}>
            <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontWeight: 400 }}>Three lanes</span> of work, one delivery model.
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
  ['Coverage', 'Mon–Fri · 9–6 ET', 'Business-hours remote support for U.S. small businesses.'],
  ['Onboarding', 'Fit review before activation', 'Scope, access, and contacts confirmed before support goes live.'],
  ['Delivery', 'Portal-tracked, not ad hoc', 'Every request runs through a ticketed workflow with an audit trail.'],
  ['Approach', 'AI-assisted, human-supervised', 'Automation where it speeds delivery; people where judgment matters.'],
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
  { n: '01', title: 'Free assessment', body: 'A short async form on your team shape, tools, and recurring pain points.', meta: '≈ 12 minutes' },
  { n: '02', title: 'Fit recommendation', body: 'We review whether a standard path fits, or recommend waiting. Honest answers.', meta: '≈ 2 business days' },
  { n: '03', title: 'Portal workspace', body: 'Your workspace is reserved at signup — onboarding, contacts, access tracked in writing.', meta: 'self-serve' },
  { n: '04', title: 'Activation', body: 'Support goes live only after readiness, scope, handoff, and launch expectations are confirmed.', meta: '5–10 business days' },
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
              The right client flow matters as much as <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontWeight: 400 }}>the offer.</span>
            </h2>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: CO.ink2, maxWidth: 320, margin: 0 }}>
            Four stages. None skipped. The point is correctness of activation — not speed of activation.
          </p>
        </div>
        <div className="co-process-grid" style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 28 }}>
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
  ['Support model', 'One engineer wearing five hats', 'Ticketed workflow with explicit scope'],
  ['First response', 'Whenever they can', 'Defined targets by plan, during business hours'],
  ['Onboarding', 'We hope nothing was missed', 'Fit review, access, launch — in writing'],
  ['AI use', 'Pasted into a chatbot', 'Integrated into triage, supervised by people'],
  ['Off days', 'The office goes dark', 'Continuity is part of the model'],
  ['Accountability', 'Nothing is tracked', 'Every request leaves a record'],
  ['Cost trajectory', 'Salary + ramp + risk', 'Flat monthly · cancelable'],
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

function CoPricing() {
  const [team, setTeam] = useState(8)
  const [intensity, setIntensity] = useState(1)
  const plan = computePlan(team, intensity)
  const animPrice = useAnimatedNumber(plan.price)

  const tiers = [
    {
      name: 'Starter',
      price: '499',
      fit: 'Smaller teams · lighter needs',
      rows: ['10 standard tickets / mo', 'Business-hours helpdesk', 'Email, login, account', 'Software & device guidance', 'Client portal access', '1 business day first response'],
    },
    {
      name: 'Growth',
      price: '999',
      fit: 'Steadier support & admin',
      featured: true,
      rows: ['30 standard tickets / mo', 'Business-hours helpdesk', 'Cloud & SaaS admin', 'User on / offboarding', 'Routine admin support', 'Monthly review call', '4 business hour first response'],
    },
    {
      name: 'Scale',
      price: '1,999',
      fit: 'Larger teams · guided path',
      from: true,
      rows: ['Custom support volume', 'Priority remote support', 'Broader systems admin', 'Cross-tool coordination', 'Optional security path', 'Strategic check-ins'],
    },
  ]

  return (
    <section id="pricing" className="co-section">
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 56px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: CO.green, letterSpacing: 0.6, marginBottom: 16, textTransform: 'uppercase' }}>Pricing</div>
          <h2 className="co-h2" style={{ fontFamily: CO.sans, fontWeight: 500, letterSpacing: -1.8, color: CO.ink, margin: 0, lineHeight: 1.02 }}>
            Tell us about your team. <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontWeight: 400 }}>See what fits.</span>
          </h2>
        </div>

        <div className="co-calc" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'stretch', marginBottom: 20 }}>
          <div style={{ background: CO.bg2, border: `1px solid ${CO.border}`, borderRadius: 20, padding: 40 }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                <label style={{ fontSize: 14, fontWeight: 500, color: CO.ink }}>Team size</label>
                <span style={{ fontFamily: CO.serif, fontSize: 42, fontWeight: 500, color: CO.ink, letterSpacing: -1.2, lineHeight: 1 }}>
                  {team}
                  <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontSize: 18, color: CO.ink3, marginLeft: 6 }}>users</span>
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

            <div>
              <label style={{ fontSize: 14, fontWeight: 500, color: CO.ink, display: 'block', marginBottom: 14 }}>Support intensity</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {['Light', 'Standard', 'Heavy'].map((l, i) => (
                  <button
                    key={l}
                    onClick={() => setIntensity(i)}
                    style={{
                      padding: '14px 10px',
                      fontFamily: CO.sans,
                      fontSize: 14,
                      fontWeight: 500,
                      background: intensity === i ? CO.ink : CO.bg,
                      color: intensity === i ? '#fff' : CO.ink,
                      border: `1px solid ${intensity === i ? CO.ink : CO.border}`,
                      cursor: 'pointer',
                      borderRadius: 999,
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 32, padding: '24px 0 0', borderTop: `1px solid ${CO.border}`, fontSize: 14, color: CO.ink3, fontStyle: 'italic', lineHeight: 1.55, fontFamily: CO.serif }}>
              The calculator is a starting point. Final fit and activation are confirmed through the free assessment — not a slider.
            </div>
          </div>

          <div style={{ background: CO.bg3, color: '#fff', borderRadius: 20, padding: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.6, opacity: 0.5, textTransform: 'uppercase', marginBottom: 16 }}>Recommended path</div>
            <div style={{ fontFamily: CO.sans, fontWeight: 500, fontSize: 72, letterSpacing: -2.2, lineHeight: 1, color: '#fff', marginBottom: 8 }}>
              The <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontWeight: 400, color: '#a3d4b3' }}>{plan.plan}</span>
            </div>
            <div style={{ fontSize: 16, opacity: 0.5, marginBottom: 32 }}>path</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: CO.sans, fontWeight: 500, fontSize: 64, letterSpacing: -1.8 }}>${Math.round(animPrice).toLocaleString()}</span>
              <span style={{ fontSize: 16, opacity: 0.6 }}>per month</span>
            </div>
            <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 14, fontSize: 14 }}>
              {[
                ['Standard tickets / mo', plan.tickets],
                ['First response target', plan.responseLabel],
                ['Cloud admin', plan.plan === 'Starter' ? 'Add-on' : 'Included'],
                ['Monthly review', plan.plan === 'Starter' ? '—' : 'Yes'],
                ['Security path', plan.plan === 'Scale' ? 'Optional' : '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <span style={{ opacity: 0.6 }}>{k}</span>
                  <span style={{ fontFamily: CO.mono, fontWeight: 500, textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
            <a href="/free-assessment" style={{ marginTop: 32, display: 'block', textAlign: 'center', width: '100%', padding: '15px', background: '#a3d4b3', color: CO.bg3, border: 'none', fontFamily: CO.sans, fontSize: 14.5, fontWeight: 600, cursor: 'pointer', borderRadius: 999, textDecoration: 'none' }}>
              Start {plan.plan} assessment →
            </a>
          </div>
        </div>

        <div className="co-tiers" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {tiers.map((t) => (
            <div key={t.name} style={{ background: t.featured ? CO.bg2 : CO.bg, border: `1px solid ${t.featured ? CO.green : CO.border}`, borderRadius: 20, padding: 36, position: 'relative' }}>
              {t.featured && (
                <div style={{ position: 'absolute', top: -12, right: 24, background: CO.green, color: '#fff', fontSize: 11, padding: '4px 12px', borderRadius: 999, letterSpacing: 0.4, fontWeight: 600, textTransform: 'uppercase' }}>Recommended</div>
              )}
              <div style={{ fontFamily: CO.serif, fontStyle: 'italic', fontSize: 34, color: CO.ink, marginBottom: 6, letterSpacing: -0.5, fontWeight: 500 }}>{t.name}</div>
              <div style={{ fontSize: 13, color: CO.ink3, marginBottom: 28 }}>{t.fit}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                {t.from && <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontSize: 16, color: CO.ink3, marginRight: 4 }}>from</span>}
                <span style={{ fontSize: 14, fontWeight: 600, color: CO.ink3 }}>$</span>
                <span style={{ fontFamily: CO.sans, fontSize: 52, fontWeight: 500, color: CO.ink, letterSpacing: -1.6, lineHeight: 1 }}>{t.price}</span>
                <span style={{ fontSize: 14, color: CO.ink3, marginLeft: 4 }}>/ month</span>
              </div>
              <CoBtn as="a" href="/free-assessment" kind={t.featured ? 'accent' : 'ghost'} style={{ marginTop: 24, width: '100%', justifyContent: 'center', padding: '13px' }}>
                Begin assessment
              </CoBtn>
              <ul style={{ listStyle: 'none', padding: 0, margin: '28px 0 0' }}>
                {t.rows.map((r) => (
                  <li key={r} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', fontSize: 14.5, color: CO.ink }}>
                    <IconStroke d={ICON.check} size={15} color={CO.green} sw={2.5} />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: CO.ink3 }}>
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
          <p style={{ marginTop: 24, fontSize: 17, lineHeight: 1.6, color: CO.ink2, maxWidth: 680, marginLeft: 'auto', marginRight: 'auto' }}>
            Kocre IT Services is a remote-only support business that helps small businesses manage day-to-day technical issues, user
            support, and cloud tools without hiring a full internal IT team. Public claims are intentionally conservative.
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

const FAQS = [
  ['Do I need a long-term contract?', 'No. Monthly support paths are month-to-month after onboarding. Cancel any time with 30 days notice. Final billing and service terms are governed by your written agreement.'],
  ['What counts as a support ticket?', 'A discrete user-reported issue or routine admin request handled inside business hours through the portal — one issue, one user, or one related interruption.'],
  ['What is not included as a standard ticket?', 'Implementation projects, planned migrations, major remediation, on-site visits, and out-of-hours coverage. These are scoped separately unless specifically included in writing.'],
  ['What counts as an emergency?', 'A business-critical outage, suspected security incident, or major disruption with material operational impact and no reasonable workaround. Routine one-user issues usually do not qualify.'],
  ['Do you provide on-site support?', 'No. Kocre IT is remote-only by design — that focus keeps the offer clean and pricing flat.'],
]

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
              <button onClick={() => setOpen(open === i ? -1 : i)} className="co-faq-q" style={{ width: '100%', padding: '28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
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
            See if Kocre fits.
            <br />
            <span style={{ fontFamily: CO.serif, fontStyle: 'italic', fontWeight: 400, color: '#a3d4b3' }}>Twelve minutes.</span> Free.
          </h2>
          <p style={{ marginTop: 24, fontSize: 18, lineHeight: 1.55, color: 'rgba(255,255,255,0.65)', maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' }}>
            The assessment ends with an honest answer — including &ldquo;not yet&rdquo; if that&rsquo;s the right call for your business.
          </p>
          <div style={{ marginTop: 36, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/free-assessment" style={{ padding: '15px 24px', background: '#a3d4b3', color: CO.bg3, fontFamily: CO.sans, fontSize: 15, fontWeight: 600, borderRadius: 999, textDecoration: 'none' }}>
              Start free assessment →
            </a>
            <a href="/pilot" style={{ padding: '15px 24px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', fontFamily: CO.sans, fontSize: 15, fontWeight: 500, borderRadius: 999, textDecoration: 'none' }}>
              Review pilot path
            </a>
          </div>
        </div>
      </section>
      <footer style={{ padding: '40px 0', background: CO.bg, borderTop: `1px solid ${CO.border}` }}>
        <div className="co-section-x co-footer" style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
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
      <CoCompare />
      <CoPricing />
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
#calmop .co-service-card { transition: border-color 0.2s, box-shadow 0.2s; }
#calmop .co-service-card:hover { border-color: ${CO.green}; box-shadow: 0 8px 28px rgba(15,16,14,0.05); }
@keyframes coDotPulse { 0% { transform: scale(1); opacity: 0.7 } 70% { transform: scale(2.6); opacity: 0 } 100% { transform: scale(2.6); opacity: 0 } }
#calmop .co-dot-pulse { animation: coDotPulse 1.8s infinite; }

@media (max-width: 1000px) {
  #calmop .co-services-grid { grid-template-columns: 1fr; gap: 40px; }
  #calmop .co-services-aside { position: static; }
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
  #calmop .co-preview-grid { grid-template-columns: 1fr 1fr; }
  #calmop .co-preview-cell { border-right: none !important; border-bottom: 1px solid ${CO.borderSoft}; }
  #calmop .co-principles-grid { grid-template-columns: 1fr 1fr; }
  #calmop .co-principles-grid > div { border-left: none !important; border-top: 1px solid ${CO.border}; }
  #calmop .co-process-grid { grid-template-columns: 1fr 1fr; gap: 36px 24px; }
  #calmop .co-process-line { display: none; }
  #calmop .co-section-head { flex-direction: column; align-items: flex-start; gap: 16px; }
  #calmop .co-calc { grid-template-columns: 1fr; }
  #calmop .co-tiers { grid-template-columns: 1fr; max-width: 440px; margin-left: auto; margin-right: auto; }
  #calmop .co-proof-grid { grid-template-columns: 1fr; }
  #calmop .co-compare { grid-template-columns: 1fr; }
  #calmop .co-compare-h { display: none; }
  #calmop .co-compare-cat { padding: 18px 0 4px !important; font-size: 12px !important; text-transform: uppercase; letter-spacing: 0.6px; color: ${CO.green} !important; border-top: 1px solid ${CO.border}; }
  #calmop .co-compare > div > div:nth-child(2) { padding: 4px 0 18px !important; border-top: none !important; }
  #calmop .co-compare > div > div:nth-child(3) { padding: 0 0 18px !important; border-top: none !important; }
}
@media (max-width: 560px) {
  #calmop .co-preview-grid { grid-template-columns: 1fr; }
  #calmop .co-principles-grid { grid-template-columns: 1fr; }
  #calmop .co-process-grid { grid-template-columns: 1fr; }
}
`
