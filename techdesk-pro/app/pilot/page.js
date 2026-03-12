export default function PilotPage() {
  return (
    <main style={{ maxWidth: 1080, margin: '40px auto', padding: '0 16px 56px' }}>
      <a href="/" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>
        ← Back to Kocre IT
      </a>

      <section
        style={{
          marginTop: 16,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          padding: 28,
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.05)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 999,
            background: '#e8f5f0',
            color: '#0D7C66',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          Pilot support path
        </div>

        <h1 style={{ margin: 0, fontSize: '2.35rem', lineHeight: 1.06 }}>
          A clear path from assessment to activated support.
        </h1>

        <p style={{ color: 'var(--ink-muted)', marginTop: 14, lineHeight: 1.8, maxWidth: 780 }}>
          Kocre IT is built for small businesses that need dependable remote IT support, cloud/SaaS
          administration, and a structured onboarding process before support goes live.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
          <a
            href="/free-assessment"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 18px',
              borderRadius: 10,
              background: 'var(--teal)',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Start Free Assessment
          </a>

          <a
            href="/support-transparency"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 18px',
              borderRadius: 10,
              border: '1.5px solid var(--border)',
              textDecoration: 'none',
              color: 'var(--ink)',
              fontWeight: 600,
              background: 'white',
            }}
          >
            Review Support Scope
          </a>
        </div>
      </section>

      <section style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div
          style={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: 18,
            padding: 24,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Best fit</h2>
          <div style={{ display: 'grid', gap: 10, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
            <div>• 1–25 user businesses that need routine remote support</div>
            <div>• Microsoft 365, Google Workspace, Slack, Zoom, shared SaaS tools</div>
            <div>• Teams without full internal IT or with limited internal IT bandwidth</div>
            <div>• Businesses that want a real onboarding and accountability layer</div>
          </div>
        </div>

        <div
          style={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: 18,
            padding: 24,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Not standard support scope</h2>
          <div style={{ display: 'grid', gap: 10, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
            <div>• Major migrations, full implementations, and large project work</div>
            <div>• On-site support as part of the standard offering</div>
            <div>• Unlimited anything without onboarding and scope confirmation</div>
            <div>• Activation before fit, access, contacts, and readiness are actually reviewed</div>
          </div>
        </div>
      </section>

      <section
        style={{
          marginTop: 24,
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: 24,
        }}
      >
        <h2 style={{ marginTop: 0 }}>How the pilot path works</h2>

        <div
          style={{
            marginTop: 14,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          {[
            {
              title: '1. Assessment',
              desc: 'You submit your environment, pain points, urgency, and tool stack.',
            },
            {
              title: '2. Fit review',
              desc: 'Kocre IT reviews whether your business is a clean fit for standard support or needs more scoping.',
            },
            {
              title: '3. Portal signup',
              desc: 'A workspace is created so onboarding, contacts, access, and documents can be tracked properly.',
            },
            {
              title: '4. Onboarding',
              desc: 'We confirm contacts, access, discovery, launch expectations, and support-readiness before activation.',
            },
            {
              title: '5. Activation',
              desc: 'Support goes live only after the onboarding gate is actually satisfied.',
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: '#fafaf8',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: 18,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{item.title}</div>
              <div style={{ color: 'var(--ink-muted)', lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          marginTop: 24,
          background: '#fafaf8',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: 24,
        }}
      >
        <h2 style={{ marginTop: 0 }}>What we are trying to do commercially</h2>
        <p style={{ color: 'var(--ink-muted)', lineHeight: 1.8, marginTop: 10 }}>
          The goal is not to force every lead into the largest monthly plan. The goal is to make the fit
          obvious, preserve trust, and move qualified businesses into a clean onboarding workflow that
          supports long-term delivery.
        </p>
      </section>
    </main>
  )
}