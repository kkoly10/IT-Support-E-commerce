'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import {
  ACCESS_METHOD_LABELS,
  ACCESS_METHOD_OPTIONS,
  ACCESS_STATUS_LABELS,
  ACCESS_STATUS_STYLES,
  deriveAccessSummary,
} from '../../../lib/access'

const supabase = createClient()

export default function PortalAccessPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [orgId, setOrgId] = useState(null)
  const [profileId, setProfileId] = useState(null)
  const [rows, setRows] = useState([])
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const [platformName, setPlatformName] = useState('')
  const [accessMethod, setAccessMethod] = useState('delegated_admin')
  const [requestedRole, setRequestedRole] = useState('')
  const [clientNotes, setClientNotes] = useState('')
  const [secureInstructions, setSecureInstructions] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, organization_id')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      setProfileId(profileData.id)
      setOrgId(profileData.organization_id)

      const { data: accessRows } = await supabase
        .from('organization_access_requests')
        .select('*')
        .eq('organization_id', profileData.organization_id)
        .order('created_at', { ascending: false })

      setRows(accessRows || [])
    } catch (err) {
      console.error('Portal access load error:', err)
      setError(err.message || 'Failed to load access records.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!orgId || !profileId || !platformName.trim()) return

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const { error: insertError } = await supabase
        .from('organization_access_requests')
        .insert({
          organization_id: orgId,
          platform_name: platformName.trim(),
          access_method: accessMethod,
          requested_role: requestedRole.trim() || null,
          status: 'submitted',
          client_notes: clientNotes.trim() || null,
          secure_instructions: secureInstructions.trim() || null,
          submitted_by: profileId,
        })

      if (insertError) throw insertError

      setPlatformName('')
      setAccessMethod('delegated_admin')
      setRequestedRole('')
      setClientNotes('')
      setSecureInstructions('')
      setMessage('Access item submitted successfully.')
      await loadData()
    } catch (err) {
      console.error('Portal access submit error:', err)
      setError(err.message || 'Failed to submit access item.')
    } finally {
      setSaving(false)
    }
  }

  const summary = useMemo(() => deriveAccessSummary(rows), [rows])

  if (loading) {
    return <div className="portal-page-loading">Loading access workflow...</div>
  }

  return (
    <div>
      <div className="portal-page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Access</h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem' }}>
          Submit and track access items needed for onboarding and support validation.
        </p>
      </div>

      <div className="dashboard-stats" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-value">{summary.total}</div>
          <div className="stat-card-label">Total access items</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{summary.submitted}</div>
          <div className="stat-card-label">Submitted</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{summary.approved}</div>
          <div className="stat-card-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: summary.needsFollowup ? '#b42318' : 'var(--ink)' }}>
            {summary.needsFollowup}
          </div>
          <div className="stat-card-label">Needs follow-up</div>
        </div>
      </div>

      <div className="dashboard-section" style={{ marginBottom: 20 }}>
        <div className="dashboard-section-header">
          <h2>Access guidance</h2>
        </div>
        <div className="dashboard-empty" style={{ textAlign: 'left' }}>
          <p>
            Prefer delegated or least-privilege access where possible. Avoid sending permanent credentials in plain email.
          </p>
          <p style={{ marginTop: 10 }}>
            Use notes to explain what platform access is needed, what role should be granted, and any vendor-specific instructions.
          </p>
        </div>
      </div>

      {message && <div style={successStyle}>{message}</div>}
      {error && <div style={errorStyle}>{error}</div>}

      <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>Submit access item</h3>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Platform *</label>
              <input
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                placeholder="Microsoft 365, Google Workspace, VPN"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Access method</label>
              <select value={accessMethod} onChange={(e) => setAccessMethod(e.target.value)} style={inputStyle}>
                {ACCESS_METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Requested role</label>
              <input
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value)}
                placeholder="Helpdesk Admin, Global Reader, Vendor Admin"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Client notes</label>
            <textarea
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              rows={3}
              placeholder="What this access is for and any important constraints"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Secure instructions</label>
            <textarea
              value={secureInstructions}
              onChange={(e) => setSecureInstructions(e.target.value)}
              rows={3}
              placeholder="How Kocre IT should receive or activate this access safely"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <button type="submit" disabled={saving} style={primaryButtonStyle}>
            {saving ? 'Submitting...' : 'Submit Access Item'}
          </button>
        </form>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Access tracker</h2>
        </div>

        {rows.length === 0 ? (
          <div className="dashboard-empty" style={{ textAlign: 'left' }}>
            <p>No access items submitted yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {rows.map((row) => {
              const style = ACCESS_STATUS_STYLES[row.status] || ACCESS_STATUS_STYLES.requested

              return (
                <div
                  key={row.id}
                  style={{
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{row.platform_name}</div>
                  <div style={{ color: 'var(--ink-muted)', fontSize: '0.84rem', marginTop: 4 }}>
                    {ACCESS_METHOD_LABELS[row.access_method] || row.access_method}
                    {row.requested_role ? ` · ${row.requested_role}` : ''}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    <span className="ticket-platform" style={{ background: style.bg, color: style.color }}>
                      {ACCESS_STATUS_LABELS[row.status] || row.status}
                    </span>
                  </div>

                  {row.client_notes ? (
                    <div style={{ marginTop: 8, color: 'var(--ink-muted)', fontSize: '0.84rem' }}>
                      <strong>Client notes:</strong> {row.client_notes}
                    </div>
                  ) : null}

                  {row.admin_notes ? (
                    <div style={{ marginTop: 8, color: 'var(--ink-muted)', fontSize: '0.84rem' }}>
                      <strong>Kocre notes:</strong> {row.admin_notes}
                    </div>
                  ) : null}

                  {row.secure_instructions ? (
                    <div style={{ marginTop: 8, color: 'var(--ink-muted)', fontSize: '0.84rem' }}>
                      <strong>Secure instructions:</strong> {row.secure_instructions}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const cardStyle = {
  background: 'white',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 24,
  marginBottom: 20,
}

const sectionTitleStyle = {
  fontSize: '1rem',
  fontWeight: 600,
  marginBottom: 16,
}

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 500,
  marginBottom: 6,
  color: 'var(--ink-light)',
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: '0.9rem',
  fontFamily: 'Outfit, sans-serif',
}

const primaryButtonStyle = {
  marginTop: 18,
  background: 'var(--teal)',
  color: 'white',
  border: 'none',
  padding: '12px 22px',
  borderRadius: 8,
  fontWeight: 600,
  cursor: 'pointer',
}

const successStyle = {
  background: '#ecfdf5',
  border: '1px solid #a7f3d0',
  color: '#059669',
  padding: '12px 16px',
  borderRadius: 8,
  marginBottom: 16,
  fontSize: '0.88rem',
}

const errorStyle = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#b91c1c',
  padding: '12px 16px',
  borderRadius: 8,
  marginBottom: 16,
  fontSize: '0.88rem',
}