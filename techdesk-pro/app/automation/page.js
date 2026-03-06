// File: app/automation/page.js (new — mkdir -p app/automation)

export const metadata = {
  title: 'AI Workflow Automation | TechDesk Pro',
  description:
    'Workflow audits, automation builds, AI-assisted process improvement, and ongoing maintenance for small businesses.',
}

export default function AutomationPage() {
  const projectPricing = [
    { name: 'Simple Automation', range: '$750 – $1,500', desc: 'Single-workflow automation builds (e.g. form-to-spreadsheet, email triggers, basic routing)' },
    { name: 'Standard System', range: '$1,500 – $3,500', desc: 'Multi-step automation systems connecting 2-3 platforms with error handling and notifications' },
    { name: 'Advanced / AI-Assisted', range: '$3,500 – $7,500+', desc: 'Complex multi-platform workflows, AI-assisted document processing, custom routing logic' },
  ]

  const maintenancePricing = [
    { name: 'Add-on (IT clients)', price: '+$150 – $400/mo', desc: 'Monitoring, updates, and support for existing automations' },
    { name: 'Standalone', price: '$300 – $750/mo', desc: 'Full automation maintenance without an IT plan' },
  ]

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', padding: '120px 20px 80px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <a href="/" style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>← Back to homepage</a>

        <div style={{ marginBottom: 40 }}>
          <div style={tagStyle}>Specialized Service</div>
          <h1 style={h1Style}>AI Workflow Automation</h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--ink-light)', lineHeight: 1.7, maxWidth: 640 }}>
            AI-assisted workflows for forms, documents, intake routing, repetitive admin tasks,
            reporting, and process improvement across your operations.
          </p>
        </div>

        {/* How it works */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>How It Works</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            {[
              { n: '01', t: 'Workflow Audit', d: 'We review your current processes and identify where manual work, bottlenecks, or repetitive tasks can be improved or automated. The audit is $250 and can be credited toward project work.' },
              { n: '02', t: 'Scope & Build', d: 'We scope the automation, select the right tools, build the workflow, test it, and document how it works.' },
              { n: '03', t: 'Handoff & Maintenance', d: 'You get a working system with documentation. Optional ongoing maintenance keeps it running and adapts as your business changes.' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'var(--teal-light)', color: 'var(--teal)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.85rem',
                }}>{step.n}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: 4 }}>{step.t}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--ink-light)', lineHeight: 1.65 }}>{step.d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What we automate */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>What We Help Automate</h2>
          <ul style={ulStyle}>
            <li>Form submissions and intake routing</li>
            <li>Document processing and data extraction</li>
            <li>Invoice and receipt handling</li>
            <li>Client onboarding workflows</li>
            <li>Report generation and delivery</li>
            <li>Email and notification triggers</li>
            <li>CRM and platform data sync</li>
            <li>Repetitive admin tasks and manual data entry</li>
            <li>Approval and escalation workflows</li>
          </ul>
        </section>

        {/* Tools */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>Tools We Work With</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['Zapier', 'Make', 'Google Apps Script', 'Anthropic API', 'Webhooks', 'Custom integrations'].map(p => (
              <span key={p} style={tagBadge}>{p}</span>
            ))}
          </div>
          <p style={{ ...pStyle, marginTop: 14 }}>
            Clients pay directly for third-party tool subscriptions (Zapier, Make, etc.).
            TechDesk Pro pricing covers scoping, setup, implementation, and support.
          </p>
        </section>

        {/* Audit */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>Workflow Audit</h2>
          <div style={cardStyle}>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: '1.4rem', fontWeight: 600, color: 'var(--teal)', marginBottom: 6 }}>$250</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--ink-light)', lineHeight: 1.65 }}>
              We review your current workflows, tools, and processes, then deliver a clear
              recommendation of what to automate, estimated cost, and expected impact.
              The audit fee can be credited toward project work if you move forward.
            </div>
          </div>
        </section>

        {/* Project pricing */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>Project Pricing</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
            {projectPricing.map((tier, i) => (
              <div key={i} style={cardStyle}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)' }}>{tier.name}</div>
                <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: '1.2rem', fontWeight: 600, color: 'var(--teal)', margin: '8px 0' }}>{tier.range}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', lineHeight: 1.6 }}>{tier.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Maintenance */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>Ongoing Maintenance</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            {maintenancePricing.map((tier, i) => (
              <div key={i} style={cardStyle}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)' }}>{tier.name}</div>
                <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: '1.2rem', fontWeight: 600, color: 'var(--teal)', margin: '8px 0' }}>{tier.price}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{tier.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <a href="/#contact" style={{ ...ctaBtn }}>Request a Workflow Audit →</a>
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