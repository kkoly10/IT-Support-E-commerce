'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import {
  deriveLaunchSummary,
  formatLaunchDateTime,
  LAUNCH_PACK_STATUS_LABELS,
  OFFBOARDING_PLAN_STATUS_LABELS,
  QBR_CADENCE_LABELS,
} from '../../../lib/launch'
import {
  deriveTransitionSummary,
  HYPERCARE_STATUS_LABELS,
  KICKOFF_STATUS_LABELS,
} from '../../../lib/transition'

const supabase = createClient()

export default function PortalLaunchPage() {
  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState(null)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

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
        .select('organization_id, organizations(*)')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      setOrg(profileData.organizations || null)
    } catch (err) {
      console.error('Launch page load error:', err)
      setError(err.message || 'Failed to load launch pack.')
    } finally {
      setLoading(false)
    }
  }

  async function acknowledge(fields) {
    if (!org?.id) return

    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('organizations')
        .update(fields)
        .eq('id', org.id)

      if (updateError) throw updateError

      setMessage('Acknowledgement saved.')
      await loadData()
    } catch (err) {
      console.error('Launch acknowledgement error:', err)
      setError(err.message || 'Failed to save acknowledgement.')
    } finally {
      setSaving(false)
    }
  }

  const launch = useMemo(() => deriveLaunchSummary(org || {}), [org])
  const transition = useMemo(() => deriveTransitionSummary(org || {}), [org])

  if (loading) {
    return <div className="portal-page-loading">Loading launch pack...</div>
  }

  return (
    <div>
      <div className="portal-page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Launch Pack</h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem' }}>
          Your support launch summary, operating expectations, security rules, and next review plan.
        </p>
      </div>

      <div className="dashboard-stats" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-value">{launch.percent}%</div>
          <div className="stat-card-label">Launch pack complete</div>
          <div className="stat-card-bar">
            <div className="stat-card-bar-fill" style={{ width: `${launch.percent}%` }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ fontSize: '1rem' }}>
            {LAUNCH_PACK_STATUS_LABELS[org?.launch_pack_status || 'not_delivered']}
          </div>
          <div className="stat-card-label">Launch pack status</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ fontSize: '1rem' }}>
            {transition.stageLabel}
          </div>
          <div className="stat-card-label">Transition stage</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ fontSize: '1rem' }}>
            {QBR_CADENCE_LABELS[org?.qbr_cadence || 'quarterly']}
          </div>
          <div className="stat-card-label">Review cadence</div>
        </div>
      </div>

      {message && <div style={successStyle}>{message}</div>}
      {error && <div style={errorStyle}>{error}</div>}

      <div className="dashboard-section" style={{ marginBottom: 20 }}>
        <div className="dashboard-section-header">
          <h2>Launch and transition</h2>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <div className="admin-table-muted">
            <strong style={{ color: '#111827' }}>Kickoff:</strong> {KICKOFF_STATUS_LABELS[org?.kickoff_status || 'not_scheduled']}
          </div>
          <div className="admin-table-muted">
            <strong style={{ color: '#111827' }}>Kickoff scheduled:</strong> {formatLaunchDateTime(org?.kickoff_scheduled_for)}
          </div>
          <div className="admin-table-muted">
            <strong style={{ color: '#111827' }}>Kickoff completed:</strong> {formatLaunchDateTime(org?.kickoff_completed_at)}
          </div>
          <div className="admin-table-muted">
            <strong style={{ color: '#111827' }}>Support activated:</strong> {formatLaunchDateTime(org?.support_activated_at)}
          </div>
          <div className="admin-table-muted">
            <strong style={{ color: '#111827' }}>Hypercare:</strong> {HYPERCARE_STATUS_LABELS[org?.hypercare_status || 'not_started']}
          </div>
          <div className="admin-table-muted">
            <strong style={{ color: '#111827' }}>Next review / QBR:</strong> {formatLaunchDateTime(org?.next_qbr_scheduled_for)}
          </div>
        </div>

        {org?.launch_pack_notes ? (
          <div
            style={{
              marginTop: 14,
              background: '#fafaf8',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '14px 16px',
              color: 'var(--ink-muted)',
              fontSize: '0.88rem',
            }}
          >
            <strong style={{ color: '#111827' }}>Launch notes:</strong> {org.launch_pack_notes}
          </div>
        ) : null}
      </div>

      <div className="dashboard-section" style={{ marginBottom: 20 }}>
        <div className="dashboard-section-header">
          <h2>Operating expectations</h2>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {launch.checks.map((check) => (
            <div
              key={check.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '12px 14px',
              }}
            >
              <span>{check.label}</span>
              <span
                className="ticket-platform"
                style={{
                  background: check.passed ? '#ecfdf3' : '#fff7ed',
                  color: check.passed ? '#067647' : '#b54708',
                }}
              >
                {check.passed ? 'Complete' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-section" style={{ marginBottom: 20 }}>
        <div className="dashboard-section-header">
          <h2>Security and support rules</h2>
        </div>

        <div className="dashboard-empty" style={{ textAlign: 'left' }}>
          <p>Use approved requesters for support changes, prefer delegated or least-privilege access, and avoid sharing permanent credentials in plain email.</p>
          <p style={{ marginTop: 10 }}>Security-sensitive issues should go through the designated security contacts and approved access process.</p>
          <p style={{ marginTop: 10 }}>Offboarding should include access revocation, documentation return, and review of remaining admin permissions.</p>
        </div>

        <div className="dashboard-actions" style={{ marginTop: 16 }}>
          <button
            onClick={() =>
              acknowledge({
                client_guide_acknowledged_at: new Date().toISOString(),
                launch_pack_status: 'acknowledged',
              })
            }
            disabled={saving}
            className="action-card"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            <span className="action-icon">✅</span>Acknowledge client guide
          </button>

          <button
            onClick={() =>
              acknowledge({
                security_policy_acknowledged_at: new Date().toISOString(),
              })
            }
            disabled={saving}
            className="action-card"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            <span className="action-icon">🛡️</span>Acknowledge security rules
          </button>
        </div>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Offboarding plan</h2>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <div className="admin-table-muted">
            <strong style={{ color: '#111827' }}>Status:</strong> {OFFBOARDING_PLAN_STATUS_LABELS[org?.offboarding_plan_status || 'not_defined']}
          </div>
          <div className="admin-table-muted">
            <strong style={{ color: '#111827' }}>Notes:</strong> {org?.offboarding_notes || 'Not documented yet'}
          </div>
        </div>
      </div>
    </div>
  )
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