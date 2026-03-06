export const metadata = {
  title: 'Support & AI Transparency | TechDesk Pro',
  description:
    'Learn how TechDesk Pro defines support tickets, emergencies, response times, AI-assisted workflows, and business-hours coverage.',
}

export default function SupportTransparencyPage() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', padding: '120px 20px 80px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--teal)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: 12,
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            Support
          </div>

          <h1
            style={{
              fontFamily: "'Source Serif 4', serif",
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 600,
              color: 'var(--ink)',
              marginBottom: 12,
              letterSpacing: '-0.02em',
            }}
          >
            Support &amp; AI Transparency
          </h1>

          <p style={{ color: 'var(--ink-muted)', fontSize: '0.95rem' }}>
            Effective Date: [Month Day, Year]
            <br />
            Last Updated: [Month Day, Year]
          </p>
        </div>

        <section style={sectionStyle}>
          <p style={pStyle}>
            TechDesk Pro provides AI-assisted, human-supervised support and operational services
            for businesses. This page explains how our support model works in plain English.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1. How Our Support Model Works</h2>
          <p style={pStyle}>
            We use a combination of human support workflows and AI-assisted tools to help classify
            issues, retrieve knowledge, draft responses, identify patterns, support automation, and
            speed up service delivery.
          </p>
          <p style={pStyle}>
            AI assists our operations, but humans remain responsible for service delivery, oversight,
            escalation, and final support decisions.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. What Counts as a Support Ticket</h2>
          <p style={pStyle}>
            A support ticket is one routine request for help involving one issue, one user, or one
            related service interruption that requires review, triage, and action.
          </p>
          <p style={pStyle}>Examples may include:</p>
          <ul style={ulStyle}>
            <li>Login and password issues</li>
            <li>Email and account support</li>
            <li>Software troubleshooting</li>
            <li>Remote desktop help</li>
            <li>Small configuration assistance</li>
            <li>User provisioning or deprovisioning</li>
            <li>Routine platform support questions</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. What Is Not Included as a Standard Ticket</h2>
          <p style={pStyle}>Standard support tickets do not include:</p>
          <ul style={ulStyle}>
            <li>Major migrations</li>
            <li>Custom automations</li>
            <li>Website or store builds</li>
            <li>Major remediation work</li>
            <li>Compliance documentation projects</li>
            <li>Full platform implementation</li>
            <li>Procurement</li>
            <li>Onsite work</li>
            <li>Structured project work</li>
            <li>Planned after-hours work</li>
          </ul>
          <p style={pStyle}>
            Those items are scoped separately unless explicitly included in a written agreement.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. What Counts as an Emergency</h2>
          <p style={pStyle}>
            An emergency is a business-critical outage, suspected security incident, or major
            service disruption with material operational impact and no reasonable workaround.
          </p>
          <p style={pStyle}>Examples may include:</p>
          <ul style={ulStyle}>
            <li>Company-wide email outage</li>
            <li>Business-critical platform outage</li>
            <li>Suspected account compromise</li>
            <li>Major security event</li>
            <li>Loss of access to a core operational system affecting multiple users</li>
          </ul>
          <p style={pStyle}>
            A single-user issue, low-impact inconvenience, cosmetic website issue, or routine
            request is generally not an emergency.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Response Time</h2>
          <p style={pStyle}>
            Response time means the time to acknowledge, review, classify, and begin triage of a
            request. It does not guarantee full resolution within that same time window.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Support Hours</h2>
          <p style={pStyle}>
            Unless otherwise stated in a written agreement, standard support is provided during
            published business hours.
          </p>
          <p style={pStyle}>
            After-hours emergency response is available only when expressly included or separately contracted.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. AI Output Limitations</h2>
          <p style={pStyle}>
            AI-assisted outputs may be incomplete, inaccurate, or require human review. Clients
            should not rely solely on AI-generated content for legal, tax, financial, regulatory,
            or other professional determinations.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. Data Handling and Confidentiality</h2>
          <p style={pStyle}>
            We treat client information as confidential in accordance with applicable agreements and
            internal safeguards. We do not use client confidential information to train public AI
            models without express written consent.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>9. Fair Use</h2>
          <p style={pStyle}>
            Any “unlimited” or high-volume support offering applies to standard support requests and
            is subject to fair use, business-hours coverage, and exclusions for project work, major
            implementations, onsite work, and separately scoped items.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>10. Contact</h2>
          <p style={pStyle}>
            Questions about support scope or service coverage:
            <br />
            Email:{' '}
            <a href="mailto:hello@techdeskpro.com" style={linkStyle}>
              hello@techdeskpro.com
            </a>
          </p>
        </section>
      </div>
    </main>
  )
}

const sectionStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 18,
  padding: '28px 24px',
  marginBottom: 18,
}

const h2Style = {
  fontFamily: "'Source Serif 4', serif",
  fontSize: '1.35rem',
  fontWeight: 600,
  color: 'var(--ink)',
  marginBottom: 12,
}

const pStyle = {
  fontSize: '0.96rem',
  color: 'var(--ink-light)',
  lineHeight: 1.75,
  marginBottom: 12,
}

const ulStyle = {
  paddingLeft: 20,
  color: 'var(--ink-light)',
  lineHeight: 1.75,
  fontSize: '0.96rem',
}

const linkStyle = {
  color: 'var(--teal)',
  textDecoration: 'none',
  fontWeight: 600,
}