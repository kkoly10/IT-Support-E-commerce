export const metadata = {
  title: 'Privacy Policy | Kocre IT Services',
  description:
    'Learn how Kocre IT Services collects, uses, shares, and protects information across our website, portal, and support services.',
}

export default function PrivacyPage() {
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
            Legal
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
            Privacy Policy
          </h1>

          <p style={{ color: 'var(--ink-muted)', fontSize: '0.95rem' }}>
            Effective Date: March 10, 2026
            <br />
            Last Updated: March 10, 2026
          </p>
        </div>

        <section style={sectionStyle}>
          <p style={pStyle}>
            Kocre IT Services respects your privacy. This Privacy Policy explains how we collect, use,
            disclose, and protect information through our website, client portal, support workflows,
            and related services.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Information We Collect</h2>
          <p style={pStyle}>Depending on how you interact with us, we may collect:</p>
          <ul style={ulStyle}>
            <li>Contact information such as name, email address, phone number, company name, and job title.</li>
            <li>Account and portal information such as login credentials and profile details.</li>
            <li>Support information such as ticket contents, uploaded files, screenshots, device or platform details, and related communications.</li>
            <li>Billing and transactional information.</li>
            <li>Technical information such as browser type, IP address, device information, referring pages, timestamps, and usage activity.</li>
            <li>Information you submit through forms, scheduling tools, email, chat, or support channels.</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. How We Use Information</h2>
          <p style={pStyle}>We may use information to:</p>
          <ul style={ulStyle}>
            <li>Operate the website and portal.</li>
            <li>Respond to inquiries and free assessments.</li>
            <li>Authenticate users and secure accounts.</li>
            <li>Provide support and manage client relationships.</li>
            <li>Deliver contracted services.</li>
            <li>Improve workflows, documentation, service quality, and internal operations.</li>
            <li>Detect, investigate, and prevent fraud, misuse, and security issues.</li>
            <li>Send administrative, service-related, billing, legal, and account notices.</li>
            <li>Comply with legal obligations and enforce agreements.</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. AI-Assisted Processing</h2>
          <p style={pStyle}>
            We may use AI-assisted tools to help classify requests, extract structured information
            from files, route workflows, generate drafts, assist internal research, support knowledge
            retrieval, and improve operational speed.
          </p>
          <p style={pStyle}>
            Unless we expressly state otherwise in writing, Kocre IT Services does not use client
            confidential information or service data to train public AI models.
          </p>
          <p style={pStyle}>
            Where third-party AI providers are used as part of service delivery, they act as service
            providers or subprocessors in connection with the services we provide.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. How We Share Information</h2>
          <p style={pStyle}>
            We may share information with service providers and subprocessors that help us operate
            the business and deliver services, including providers for:
          </p>
          <ul style={ulStyle}>
            <li>Hosting and infrastructure</li>
            <li>Authentication and account management</li>
            <li>Storage and backups</li>
            <li>Communications and email</li>
            <li>Scheduling</li>
            <li>Payments</li>
            <li>Analytics</li>
            <li>AI-assisted workflow and service-delivery functions</li>
          </ul>
          <p style={pStyle}>We may also disclose information:</p>
          <ul style={ulStyle}>
            <li>To comply with law, legal process, or valid governmental requests</li>
            <li>To protect rights, safety, security, systems, and property</li>
            <li>In connection with a merger, sale, restructuring, or similar business transaction</li>
            <li>With your direction or consent</li>
          </ul>
          <p style={pStyle}>We do not sell personal information.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Cookies and Similar Technologies</h2>
          <p style={pStyle}>
            We may use cookies and similar technologies to operate the website, maintain sessions,
            measure usage, improve performance, and understand how users interact with the site.
            You can control cookies through your browser settings, though some site features may not
            function properly if cookies are disabled.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Data Retention</h2>
          <p style={pStyle}>
            We retain information for as long as reasonably necessary for service delivery, account
            management, security, legal compliance, recordkeeping, dispute resolution, backup
            rotation, and legitimate business purposes. After that, we may delete, archive, or
            de-identify the information.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Data Security</h2>
          <p style={pStyle}>
            We use administrative, technical, and organizational safeguards designed to protect
            information appropriate to the nature of the information and services provided. No
            method of transmission, storage, or processing is completely secure, and we cannot
            guarantee absolute security.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. Marketing Communications</h2>
          <p style={pStyle}>
            If you receive promotional emails from us, you can opt out using the unsubscribe link
            or by contacting us. We may still send non-promotional communications relating to
            accounts, support, billing, security, legal notices, or active services.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>9. Children</h2>
          <p style={pStyle}>
            Our website and services are not directed to children under 13, and we do not knowingly
            collect personal information from children under 13.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>10. Your Rights</h2>
          <p style={pStyle}>
            Depending on applicable law, you may have rights to request access, correction, deletion,
            or other control over your personal information. To make a request, contact us at{' '}
            <a href="mailto:privacy@techdeskpro.com" style={linkStyle}>
              privacy@techdeskpro.com
            </a>
            . We may need to verify your identity before processing a request.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>11. Healthcare and Other Regulated Data</h2>
          <p style={pStyle}>
            If we provide services involving regulated data, including protected health information,
            additional contractual terms may apply, including a Business Associate Agreement where
            legally required.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>12. Changes to This Policy</h2>
          <p style={pStyle}>
            We may update this Privacy Policy from time to time. Updated versions will be posted on
            this page with a revised effective date.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>13. Contact</h2>
          <p style={pStyle}>
            For privacy questions or requests, contact:
            <br />
            Email:{' '}
            <a href="mailto:privacy@techdeskpro.com" style={linkStyle}>
              privacy@techdeskpro.com
            </a>
            <br />
            Mailing Address: [Your Business Mailing Address]
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