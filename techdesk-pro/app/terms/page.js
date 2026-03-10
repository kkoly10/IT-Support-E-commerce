export const metadata = {
  title: 'Terms of Use | Kocre IT Services',
  description:
    'Review the terms governing your access to the Kocre IT Services website, portal, and online services.',
}

export default function TermsPage() {
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
            Terms of Use
          </h1>

          <p style={{ color: 'var(--ink-muted)', fontSize: '0.95rem' }}>
            Effective Date: March 10, 2026
            <br />
            Last Updated: March 10, 2026
          </p>
        </div>

        <section style={sectionStyle}>
          <p style={pStyle}>
            Welcome to Kocre IT Services. These Terms of Use govern your access to and use of the
            Kocre IT Services website, portal, and related online services.
          </p>
          <p style={pStyle}>
            By accessing or using the website or portal, you agree to these Terms. If you do not
            agree, do not use the site or portal.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Who We Are</h2>
          <p style={pStyle}>
            Kocre IT Services provides information about managed IT support, cloud and SaaS administration,
            workflow automation, support services, and related business technology services.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. Informational Use Only</h2>
          <p style={pStyle}>
            Content on this website is provided for general informational purposes only. Nothing on
            this website creates a client relationship, service contract, guarantee of results, or
            legally binding commitment unless stated in a separate written agreement signed by both parties.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. Assessments, Quotes, and Plan Descriptions</h2>
          <p style={pStyle}>
            Any free assessment, pricing example, plan description, scope summary, or service
            description shown on this website is for general guidance only. Final services, support
            levels, pricing, scope, response commitments, exclusions, and deliverables are governed
            by a written proposal, order form, or client agreement.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. Portal Access and Account Security</h2>
          <p style={pStyle}>If you create or use a portal account, you are responsible for:</p>
          <ul style={ulStyle}>
            <li>Maintaining the confidentiality of your credentials</li>
            <li>Restricting unauthorized access to your account</li>
            <li>Notifying Kocre IT Services promptly if you suspect unauthorized access, misuse, or compromise</li>
          </ul>
          <p style={pStyle}>
            You are responsible for activity occurring under your account unless caused by
            Kocre IT Services’s own unauthorized conduct.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Acceptable Use</h2>
          <p style={pStyle}>You agree not to:</p>
          <ul style={ulStyle}>
            <li>Use the website or portal for unlawful purposes</li>
            <li>Attempt unauthorized access to systems, data, accounts, or environments</li>
            <li>Upload malware, malicious code, or harmful files</li>
            <li>Interfere with website or portal availability or security</li>
            <li>Scrape, copy, reverse engineer, or exploit the website or portal beyond permitted use</li>
            <li>Submit content that violates law, infringes intellectual property, or invades privacy</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Intellectual Property</h2>
          <p style={pStyle}>
            Unless otherwise stated, the website, branding, copy, graphics, interface elements, and
            related materials are owned by Kocre IT Services or used with permission and are protected by
            applicable intellectual property laws.
          </p>
          <p style={pStyle}>
            Nothing in these Terms transfers ownership of Kocre IT Services materials to you.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Third-Party Services and Links</h2>
          <p style={pStyle}>
            The website or portal may reference or integrate third-party services, including
            scheduling, communication, hosting, authentication, storage, payment, analytics, or
            AI-related providers. Kocre IT Services is not responsible for third-party services beyond
            the extent required by law or by separate written agreement.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. No Guarantee of Uninterrupted Availability</h2>
          <p style={pStyle}>
            We may update, suspend, change, or discontinue any part of the website or portal at any
            time. We do not guarantee uninterrupted or error-free operation of the public website
            or portal.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>9. Disclaimer</h2>
          <p style={pStyle}>
            To the maximum extent permitted by law, the website and portal are provided “as is” and
            “as available.” Kocre IT Services disclaims warranties of merchantability, fitness for a
            particular purpose, non-infringement, and uninterrupted availability, except as
            expressly stated in a written client agreement.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>10. Limitation of Liability</h2>
          <p style={pStyle}>
            To the maximum extent permitted by law, Kocre IT Services will not be liable for indirect,
            incidental, consequential, special, exemplary, or punitive damages arising out of or
            related to website or portal use.
          </p>
          <p style={pStyle}>
            Any liability relating solely to public website use will be limited to the amount, if
            any, paid by you directly for that use.
          </p>
          <p style={pStyle}>
            Nothing in these Terms limits liability where such limitation is prohibited by law.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>11. Governing Law</h2>
          <p style={pStyle}>
            These Terms are governed by the laws of the Commonwealth of Virginia, without regard to
            conflict-of-law rules, unless a separate signed agreement states otherwise.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>12. Changes to These Terms</h2>
          <p style={pStyle}>
            We may update these Terms from time to time. Updated Terms will be posted with a revised
            effective date. Continued use after updates means you accept the revised Terms.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>13. Contact</h2>
          <p style={pStyle}>
            For questions about these Terms, contact:
            <br />
            Email:{' '}
            <a href="mailto:legal@techdeskpro.com" style={linkStyle}>
              legal@techdeskpro.com
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