'use client'

import { useState } from 'react'

const TEAM_SIZE_OPTIONS = ['1-5', '6-15', '16-30', '31-75', '75+']

export default function FreeAssessmentPage() {
  const [form, setForm] = useState({
    business_name: '',
    full_name: '',
    email: '',
    phone: '',
    team_size_range: '',
    industry: '',
    tools_platforms: '',
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
      <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 16px' }}>
        <h1 style={{ marginBottom: 8 }}>Assessment received</h1>
        <p style={{ color: 'var(--ink-muted)' }}>
          Thanks — we received your free IT support assessment. A human will review this and follow up with onboarding guidance.
        </p>
        <p style={{ fontSize: '0.85rem', marginTop: 12, color: 'var(--ink-muted)' }}>
          Reference ID: {successId}
        </p>
        <a className="auth-submit" style={{ display: 'inline-block', marginTop: 18, textDecoration: 'none' }} href={`/signup?assessment=${successId}&email=${encodeURIComponent(form.email)}&company=${encodeURIComponent(form.business_name)}&name=${encodeURIComponent(form.full_name)}`}>
          Continue to Portal Signup
        </a>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 760, margin: '40px auto', padding: '0 16px' }}>
      <a href="/" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>← Back to Kocre IT Services</a>
      <h1 style={{ margin: '12px 0 8px' }}>Free Remote IT Support Assessment</h1>
      <p style={{ color: 'var(--ink-muted)', marginBottom: 18 }}>
        Tell us about your current setup and support pain points. We’ll recommend a practical support path for your team.
      </p>

      <form onSubmit={onSubmit} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
        {error && <div className="auth-error" style={{ marginBottom: 12 }}>{error}</div>}

        <div className="form-group"><label>Business name *</label><input required value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></div>
        <div className="form-group"><label>Full name *</label><input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        <div className="form-group"><label>Email *</label><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="form-group"><label>Phone (optional)</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="form-group"><label>Industry *</label><input required value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="form-group">
            <label>Team size *</label>
            <select required value={form.team_size_range} onChange={(e) => setForm({ ...form, team_size_range: e.target.value })}>
              <option value="">Select</option>
              {TEAM_SIZE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Urgency *</label>
            <select required value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
              <option value="">Select</option>
              <option value="routine">Routine</option>
              <option value="soon">Need help soon</option>
              <option value="urgent">Urgent operational pain</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Tools and platforms in scope *</label>
          <textarea required rows={2} value={form.tools_platforms} onChange={(e) => setForm({ ...form, tools_platforms: e.target.value, current_tools: e.target.value })} placeholder="e.g. Google Workspace, Microsoft 365, Slack, Zoom, QuickBooks" />
        </div>

        <div className="form-group">
          <label>Microsoft 365 / Google Workspace / SaaS environment *</label>
          <textarea required rows={2} value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })} placeholder="e.g. Mixed Google Workspace + Microsoft 365, 18 users, scattered permissions" />
        </div>

        <div className="form-group">
          <label>Biggest support pain points *</label>
          <textarea required rows={3} value={form.pain_points} onChange={(e) => setForm({ ...form, pain_points: e.target.value })} placeholder="What slows your team down today?" />
        </div>

        <div className="form-group">
          <label>Do you already have internal IT?</label>
          <select value={form.has_internal_it} onChange={(e) => setForm({ ...form, has_internal_it: e.target.value })}>
            <option value="unknown">Not sure / N/A</option>
            <option value="no">No internal IT</option>
            <option value="part_time">Part-time / shared IT</option>
            <option value="yes">Yes, internal IT exists</option>
          </select>
        </div>

        <div className="form-group">
          <label>Anything else we should know?</label>
          <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Free Assessment'}
        </button>
      </form>
    </main>
  )
}
