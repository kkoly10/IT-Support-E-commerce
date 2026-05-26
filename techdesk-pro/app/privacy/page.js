export const metadata = {
  title: 'Privacy Policy | Kocre IT Services',
  description:
    'How Kocre IT Services collects, uses, shares, transfers, and protects personal information across our website, client portal, and support services — including GDPR, UK GDPR, PIPEDA, and US state-law disclosures.',
}

export default function PrivacyPage() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', padding: '120px 20px 80px' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap" />
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
              fontFamily: 'Inter Tight, sans-serif',
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
            Effective Date: May 26, 2026
            <br />
            Last Updated: May 26, 2026
          </p>
        </div>

        <section style={sectionStyle}>
          <p style={pStyle}>
            Kocre IT Services (&ldquo;Kocre IT,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects your privacy.
            This Privacy Policy explains how we collect, use, disclose, transfer, and protect personal
            information through our website, client portal, support workflows, and related services
            (collectively, the &ldquo;Services&rdquo;).
          </p>
          <p style={pStyle}>
            We provide remote IT support to small businesses in the United States, Canada, the United
            Kingdom, and Ireland. Because we operate across these regions, this Policy includes
            disclosures required by the EU and UK General Data Protection Regulation (&ldquo;GDPR&rdquo; and
            &ldquo;UK GDPR&rdquo;), Canada&rsquo;s Personal Information Protection and Electronic Documents Act
            (&ldquo;PIPEDA&rdquo;) and Quebec&rsquo;s Law 25, and US state privacy laws including the California
            Consumer Privacy Act as amended (&ldquo;CCPA/CPRA&rdquo;) and the Virginia Consumer Data Protection Act.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Our Role: Controller vs. Processor</h2>
          <p style={pStyle}>
            Our responsibilities under data-protection law depend on the context in which we handle
            personal information:
          </p>
          <ul style={ulStyle}>
            <li>
              <strong>As a controller.</strong> For information collected through our website, marketing,
              inquiries, free assessments, account administration, and billing, Kocre IT determines the
              purposes and means of processing and acts as the data controller (or &ldquo;business&rdquo; under US law).
              This Policy governs that processing.
            </li>
            <li>
              <strong>As a processor / service provider.</strong> When we deliver support services, we may
              process personal information contained in a client&rsquo;s systems, accounts, files, or tickets on
              that client&rsquo;s behalf and under their instructions. In that role the client is the controller
              and Kocre IT is a processor (or &ldquo;service provider&rdquo;). That processing is governed by our
              client agreement and, where applicable, a separate Data Processing Agreement (&ldquo;DPA&rdquo;) — not by
              this Policy. If you are an employee or contact of one of our clients, please direct privacy
              requests to that client in the first instance.
            </li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. Information We Collect</h2>
          <p style={pStyle}>Depending on how you interact with us, we may collect:</p>
          <ul style={ulStyle}>
            <li>Contact information such as name, email address, phone number, company name, and job title.</li>
            <li>Account and portal information such as login credentials and profile details.</li>
            <li>Support information such as ticket contents, uploaded files, screenshots, device or platform details, and related communications.</li>
            <li>Billing and transactional information (payment processing is handled by third-party processors; we do not store full payment card numbers).</li>
            <li>Technical information such as browser type, IP address, device information, referring pages, timestamps, and usage activity.</li>
            <li>Information you submit through forms, scheduling tools, email, chat, or support channels.</li>
          </ul>
          <p style={pStyle}>
            We do not intentionally collect special-category data (such as health, biometric, or similar
            sensitive data) through our website, and we ask that you not submit it through public forms.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. How We Use Information &amp; Legal Bases</h2>
          <p style={pStyle}>We use information to:</p>
          <ul style={ulStyle}>
            <li>Operate the website and portal, and authenticate and secure accounts.</li>
            <li>Respond to inquiries and free assessments, and manage client relationships.</li>
            <li>Provide and deliver contracted services and support.</li>
            <li>Process billing and payments.</li>
            <li>Improve workflows, documentation, service quality, and internal operations.</li>
            <li>Detect, investigate, and prevent fraud, misuse, and security issues.</li>
            <li>Send administrative, service-related, billing, legal, and account notices.</li>
            <li>Comply with legal obligations and establish, exercise, or defend legal claims.</li>
          </ul>
          <p style={pStyle}>
            For individuals in the EU, UK, and other regions that require a legal basis, we rely on:
            <strong> performance of a contract</strong> (to provide the Services you request);
            <strong> legitimate interests</strong> (to operate, secure, and improve our business, balanced against your rights);
            <strong> consent</strong> (for optional marketing and non-essential cookies, which you may withdraw at any time); and
            <strong> legal obligation</strong> (to meet recordkeeping, tax, and compliance requirements).
            Where we rely on consent, you may withdraw it without affecting prior processing.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. AI-Assisted Processing &amp; Automated Decisions</h2>
          <p style={pStyle}>
            We may use AI-assisted tools to help classify requests, extract structured information from
            files, route workflows, generate drafts, assist internal research, support knowledge retrieval,
            and improve operational speed.
          </p>
          <p style={pStyle}>
            Unless we expressly state otherwise in writing, Kocre IT does not use client confidential
            information or service data to train public AI models. Where third-party AI providers are used
            as part of service delivery, they act as service providers or subprocessors.
          </p>
          <p style={pStyle}>
            We do not make decisions that produce legal or similarly significant effects about you based
            solely on automated processing without meaningful human involvement. AI output in our workflows
            is reviewed under human supervision.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. How We Share Information</h2>
          <p style={pStyle}>
            We share information with service providers and subprocessors that help us operate the business
            and deliver services, including providers for:
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
          <p style={pStyle}>
            These providers are bound by contractual obligations to process personal information only as
            instructed and to protect it. A current list of subprocessors is available on request at{' '}
            <a href="mailto:privacy@kocreit.com" style={linkStyle}>privacy@kocreit.com</a>.
          </p>
          <p style={pStyle}>We may also disclose information:</p>
          <ul style={ulStyle}>
            <li>To comply with law, legal process, or valid governmental requests</li>
            <li>To protect rights, safety, security, systems, and property</li>
            <li>In connection with a merger, sale, restructuring, or similar business transaction</li>
            <li>With your direction or consent</li>
          </ul>
          <p style={pStyle}>
            <strong>We do not sell your personal information, and we do not &ldquo;share&rdquo; it for cross-context
            behavioral advertising</strong> as those terms are defined under US state privacy laws.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. International Data Transfers</h2>
          <p style={pStyle}>
            Kocre IT is based in the United States, and our service providers may process information in the
            United States and other countries. If you are located in the EU/EEA, the UK, or Canada, your
            personal information may be transferred to and processed in a country whose data-protection laws
            differ from those of your jurisdiction.
          </p>
          <p style={pStyle}>
            Where we transfer personal information from the EU/EEA or UK to a country without an adequacy
            decision, we use appropriate safeguards, such as the European Commission&rsquo;s Standard Contractual
            Clauses and the UK International Data Transfer Addendum, together with supplementary measures
            where appropriate. For transfers subject to PIPEDA, we remain accountable for personal
            information transferred to service providers for processing and use contractual means to require
            comparable protection. You may request more information about these safeguards using the contact
            details below.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Cookies and Similar Technologies</h2>
          <p style={pStyle}>
            We use strictly necessary cookies to operate the website and maintain authenticated portal
            sessions. Where we use non-essential cookies or similar technologies (for example, analytics),
            we will, where required in the EU and UK, obtain your consent before setting them. You can also
            control cookies through your browser settings, though some site features may not function
            properly if cookies are disabled.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. Data Retention</h2>
          <p style={pStyle}>
            We retain information for as long as reasonably necessary for service delivery, account
            management, security, legal compliance, recordkeeping, dispute resolution, and backup rotation.
            Retention periods depend on the type of information and the purpose for which it was collected;
            when no longer needed, we delete, archive, or de-identify it. Information processed on behalf of
            a client is retained and deleted in accordance with that client&rsquo;s agreement.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>9. Data Security</h2>
          <p style={pStyle}>
            We use administrative, technical, and organizational safeguards designed to protect information
            appropriate to its nature and the Services provided, including access controls, encryption in
            transit, and least-privilege practices. No method of transmission, storage, or processing is
            completely secure, and we cannot guarantee absolute security. We will notify affected individuals
            and regulators of a personal-data breach where required by applicable law.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>10. Marketing Communications</h2>
          <p style={pStyle}>
            If you receive promotional emails from us, you can opt out using the unsubscribe link or by
            contacting us. We may still send non-promotional communications relating to accounts, support,
            billing, security, legal notices, or active services. Where required, we obtain consent before
            sending marketing communications.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>11. Children&rsquo;s Privacy</h2>
          <p style={pStyle}>
            Our website and services are intended for businesses and are not directed to children. We do not
            knowingly collect personal information from children below the age of digital consent in their
            jurisdiction (for example, 13 in the United States and the UK, and 16 in Ireland and much of the
            EU). If you believe a child has provided us personal information, contact us and we will delete it.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>12. Your Privacy Rights</h2>
          <p style={pStyle}>
            Subject to applicable law and verification of your identity, you may have the following rights.
            To exercise any of them, contact{' '}
            <a href="mailto:privacy@kocreit.com" style={linkStyle}>privacy@kocreit.com</a>. We will respond
            within the timeframe required by the applicable law and will not discriminate against you for
            exercising your rights.
          </p>

          <h3 style={h3Style}>EU/EEA &amp; United Kingdom (GDPR / UK GDPR)</h3>
          <p style={pStyle}>
            You have the right to access; rectify; erase; restrict or object to processing; data portability;
            and to withdraw consent. You also have the right not to be subject to a decision based solely on
            automated processing that produces legal or similarly significant effects. You may lodge a
            complaint with your supervisory authority — in Ireland, the Data Protection Commission
            (dataprotection.ie); in the UK, the Information Commissioner&rsquo;s Office (ico.org.uk).
          </p>

          <h3 style={h3Style}>Canada (PIPEDA &amp; Quebec Law 25)</h3>
          <p style={pStyle}>
            You may request access to and correction of your personal information, ask about our handling
            practices, and withdraw consent subject to legal or contractual restrictions. You may complain to
            the Office of the Privacy Commissioner of Canada (priv.gc.ca) or, in Quebec, the Commission
            d&rsquo;accès à l&rsquo;information.
          </p>

          <h3 style={h3Style}>California &amp; other US states (CCPA/CPRA, VCDPA)</h3>
          <p style={pStyle}>
            You may request to know, access, correct, and delete personal information, and to opt out of any
            &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; and limit use of sensitive personal information — though, as noted above, we
            do not sell or share personal information. You may use an authorized agent to submit a request,
            and you may appeal a denied request as permitted by law.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>13. Healthcare and Other Regulated Data</h2>
          <p style={pStyle}>
            If we provide services involving regulated data, including protected health information,
            additional contractual terms may apply, including a Business Associate Agreement where legally
            required.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>14. Client Data Processing Agreement</h2>
          <p style={pStyle}>
            Where we act as a processor of personal information on a client&rsquo;s behalf, that processing is
            governed by our client agreement and a Data Processing Agreement that addresses processing
            instructions, confidentiality, security, subprocessors, international transfers, assistance with
            data-subject requests, and deletion or return of data. Clients may request our DPA at{' '}
            <a href="mailto:legal@kocreit.com" style={linkStyle}>legal@kocreit.com</a>.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>15. Changes to This Policy</h2>
          <p style={pStyle}>
            We may update this Privacy Policy from time to time. Updated versions will be posted on this page
            with a revised effective date. Material changes will be communicated as required by law.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>16. Contact</h2>
          <p style={pStyle}>
            For privacy questions or to exercise your rights, contact us:
            <br />
            Email:{' '}
            <a href="mailto:privacy@kocreit.com" style={linkStyle}>privacy@kocreit.com</a>
            <br />
            Phone: <a href="tel:+15405158324" style={linkStyle}>(540) 515-8324</a>
            <br />
            Kocre IT Services, Stafford, Virginia, United States
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

const h3Style = {
  fontFamily: 'Inter Tight, sans-serif',
  fontSize: '1rem',
  fontWeight: 700,
  color: 'var(--ink)',
  margin: '18px 0 8px',
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
