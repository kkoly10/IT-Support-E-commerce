'use client'

import { useMemo, useState } from 'react'

const TEAM_SIZE_OPTIONS = ['1-5', '6-15', '16-30', '31-75', '75+']

export default function FreeAssessmentPage() {
  const [form, setForm] = useState({
    business_name: '',
    full_name: '',
    email: '',
    team_size_range: '',
    current_tools: '',
    pain_points: '',
    environment: '',
    urgency: '',
    has_internal_it: 'unknown',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successId, setSuccessId] = useState('')

  const signupHref = useMemo(() => {
    if (!successId) return '#'
    return `/signup?assessment=${successId}&email=${encodeURIComponent(form.email)}&company=${encodeURIComponent(
      form.business_name
    )}&name=${encodeURIComponent(form.full_name)}`
  }, [successId, form])

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit assessment')

      setSuccessId(data.id)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (successId) {
    return (
      <main style={{ maxWidth: 920, margin: '40px auto', padding: '0 16px 48px' }}>
        <div
          style={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: 18,
            padding: 28,
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.06)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 999,
              background: '#ecfdf3',
              color: '#067647',
              fontSize: '0.84rem',
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            ✓ Assessment received
          </div>

          <h1 style={{ margin: 0, fontSize: '2rem', lineHeight: 1.15 }}>You’re in the right place.</h1>
          <p style={{ color: 'var(--ink-muted)', marginTop: 10, maxWidth: 700, lineHeight: 1.75 }}>
            We received your support assessment and created a reference for manual review. The next step is
            to reserve your portal workspace so Kocre IT can connect your assessment, onboarding checklist,
            and support-readiness review in one place.
          </p>

          <div
            style={{
              marginTop: 20,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
            }}
          >
            {[
              {
                title: '1. Human review',
                desc: 'We review your tools, support pain points, and likely fit for a monthly support path.',
              },
              {
                title: '2. Portal signup',
                desc: 'You create your workspace so onboarding, documents, contacts, and access can be tracked properly.',
              },
              {
                title: '3. Guided onboarding',
                desc: 'We confirm fit, access, scope, and activation instead of pushing straight into service.',
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
                <div style={{ fontSize: '0.9rem', color: 'var(--ink-muted)', lineHeight: 1.65 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 20,
              padding: '14px 16px',
              borderRadius: 12,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '0.9rem',
              color: 'var(--ink-muted)',
            }}
          >
            Reference ID: <strong style={{ color: 'var(--ink)' }}>{successId}</strong>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
            <a
              className="auth-submit"
              style={{ display: 'inline-block', textDecoration: 'none' }}
              href={signupHref}
            >
              Continue to Portal Signup
            </a>

            <a
              href="/pilot"
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
              Review Pilot Support Path
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 1100, margin: '40px auto', padding: '0 16px 48px' }}>
      <a href="/" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>
        ← Back to Kocre IT
      </a>

      <div
        style={{
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: '1.05fr 0.95fr',
          gap: 22,
          alignItems: 'start',
        }}
      >
        <section
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid var(--border)',
            borderRadius: 18,
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
            Free assessment · Remote-first small business support
          </div>

          <h1 style={{ margin: 0, fontSize: '2.3rem', lineHeight: 1.06 }}>
            Find out whether Kocre IT is the right support fit before you commit.
          </h1>

          <p style={{ color: 'var(--ink-muted)', marginTop: 14, lineHeight: 1.8, maxWidth: 640 }}>
            This free assessment helps us understand your team size, tools, pain points, and support risk.
            We use that to recommend a sensible monthly support path, guided onboarding, or a human scoping
            conversation when needed.
          </p>

          <div
            style={{
              marginTop: 20,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 14,
            }}
          >
            {[
              {
                title: 'Best fit',
                desc: 'Remote-first businesses using Microsoft 365, Google Workspace, Slack, Zoom, or common SaaS tools.',
              },
              {
                title: 'What you get',
                desc: 'A practical fit review, onboarding recommendation, and a clearer next step than “just book a call.”',
              },
              {
                title: 'What this is not',
                desc: 'Not a promise of instant activation, all-scope support, or automatic approval into the biggest plan.',
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: 18,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--ink-muted)', lineHeight: 1.7 }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 22,
              background: '#fafaf8',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 18,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 12 }}>What happens next</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                'We review your current environment and recurring support friction.',
                'We recommend a support path that matches your size and complexity.',
                'You move into signup and onboarding only if the fit makes sense.',
              ].map((text) => (
                <div key={text} style={{ display: 'flex', gap: 10, color: 'var(--ink-muted)', lineHeight: 1.7 }}>
                  <span style={{ color: '#0D7C66', fontWeight: 700 }}>•</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <a
                href="/pilot"
                style={{ color: 'var(--teal)', fontWeight: 700, textDecoration: 'none' }}
              >
                Review the pilot support path →
              </a>
            </div>
          </div>
        </section>

        <section
          style={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: 18,
            padding: 22,
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.05)',
          }}
        >
          <h2 style={{ margin: '0 0 8px', fontSize: '1.35rem' }}>Start your assessment</h2>
          <p style={{ color: 'var(--ink-muted)', marginBottom: 16, lineHeight: 1.7 }}>
            Fill this out once. We use it to guide fit review, onboarding, and the recommended support path.
          </p>

          <form onSubmit={onSubmit}>
            {error && (
              <div className="auth-error" style={{ marginBottom: 12 }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label>Business name *</label>
              <input
                required
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Full name *</label>
              <input
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label>Team size *</label>
                <select
                  required
                  value={form.team_size_range}
                  onChange={(e) => setForm({ ...form, team_size_range: e.target.value })}
                >
                  <option value="">Select</option>
                  {TEAM_SIZE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Urgency *</label>
                <select
                  required
                  value={form.urgency}
                  onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                >
                  <option value="">Select</option>
                  <option value="routine">Routine</option>
                  <option value="soon">Need help soon</option>
                  <option value="urgent">Urgent operational pain</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Current tools *</label>
              <textarea
                required
                rows={2}
                value={form.current_tools}
                onChange={(e) => setForm({ ...form, current_tools: e.target.value })}
                placeholder="Google Workspace, Microsoft 365, Slack, Zoom, QuickBooks, Notion..."
              />
            </div>

            <div className="form-group">
              <label>Environment summary *</label>
              <textarea
                required
                rows={2}
                value={form.environment}
                onChange={(e) => setForm({ ...form, environment: e.target.value })}
                placeholder="Example: Microsoft 365 + 12 users, mixed permissions, remote staff, shared mailboxes"
              />
            </div>

            <div className="form-group">
              <label>Biggest support pain points *</label>
              <textarea
                required
                rows={3}
                value={form.pain_points}
                onChange={(e) => setForm({ ...form, pain_points: e.target.value })}
                placeholder="What is slowing your team down right now?"
              />
            </div>

            <div className="form-group">
              <label>Do you already have internal IT?</label>
              <select
                value={form.has_internal_it}
                onChange={(e) => setForm({ ...form, has_internal_it: e.target.value })}
              >
                <option value="unknown">Not sure / N/A</option>
                <option value="no">No internal IT</option>
                <option value="part_time">Part-time / shared IT</option>
                <option value="yes">Yes, internal IT exists</option>
              </select>
            </div>

            <div className="form-group">
              <label>Anything else we should know?</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Free Assessment'}
            </button>

            <p style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--ink-muted)', lineHeight: 1.65 }}>
              This assessment helps Kocre IT recommend the right support path. Final service scope,
              onboarding, and activation are confirmed through review — not by this form alone.
            </p>
          </form>
        </section>
      </div>
    </main>
  )
}