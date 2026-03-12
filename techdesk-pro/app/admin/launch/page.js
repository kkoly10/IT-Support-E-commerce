'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  deriveLaunchSummary,
  formatLaunchDateTime,
  LAUNCH_PACK_STATUS_LABELS,
  OFFBOARDING_PLAN_STATUS_LABELS,
  QBR_CADENCE_LABELS,
  toLaunchInputValue,
} from '../../../lib/launch'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AdminLaunchPage() {
  const [loading, setLoading] = useState(true)
  const [organizations, setOrganizations] = useState([])
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadOrganizations()
  }, [])

  async function loadOrganizations() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          client_status,
          support_ready,
          launch_pack_status,
          launch_pack_delivered_at,
          launch_pack_notes,
          client_guide_acknowledged_at,
          security_policy_acknowledged_at,
          qbr_cadence,
          next_qbr_scheduled_for,
          offboarding_plan_status,
          offboarding_notes,
          support_activated_at,
          hypercare_status
        `)
        .in('client_status', ['onboarding', 'active', 'paused'])
        .order('created_at', { ascending: false })

      const rows = data || []
      setOrganizations(rows)
      if (!selectedOrgId && rows.length) setSelectedOrgId(rows[0].id)
    } catch (err) {
      console.error('Admin launch load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateOrganization(updates) {
    if (!selectedOrgId) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', selectedOrgId)

      if (error) throw error
      await loadOrganizations()
    } catch (err) {
      console.error('Admin launch update error:', err)
      alert(err.message || 'Failed to update launch data')
    } finally {
      setSaving(false)
    }
  }

  const selectedOrg = useMemo(
    () => organizations.find((org) => org.id === selectedOrgId) || null,
    [organizations, selectedOrgId]
  )

  const summary = useMemo(() => deriveLaunchSummary(selectedOrg || {}), [selectedOrg])

  if (loading) {
    return <div className="admin-loading">Loading launch console...</div>
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Launch Pack</h1>
          <p className="admin-page-desc">
            Manage launch delivery, client acknowledgements, review cadence, and offboarding planning.
          </p>
        </div>
      </div>

      <div className="admin-grid-2col">
        <div>
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Organizations</h3>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrgId(org.id)}
                  style={{
                    textAlign: 'left',
                    background: org.id === selectedOrgId ? '#f8fafc' : 'white',
                    border: org.id === selectedOrgId ? '1px solid #0D7C66' : '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '14px 16px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{org.name}</div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="admin-status-badge" style={{ background: '#eef4ff', color: '#1d4ed8' }}>
                      {org.client_status}
                    </span>
                    <span
                      className="admin-status-badge"
                      style={{
                        background: org.support_ready ? '#ecfdf3' : '#fffaeb',
                        color: org.support_ready ? '#067647' : '#b54708',
                      }}
                    >
                      {org.support_ready ? 'Support ready' : 'Not ready'}
                    </span>
                    <span className="admin-status-badge" style={{ background: '#f3f4f6', color: '#4b5563' }}>
                      {LAUNCH_PACK_STATUS_LABELS[org.launch_pack_status || 'not_delivered']}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          {!selectedOrg ? (
            <div className="admin-card">
              <div className="admin-empty-text">Select an organization.</div>
            </div>
          ) : (
            <>
              <div className="admin-card" style={{ marginBottom: 20 }}>
                <div className="admin-card-header">
                  <h3>{selectedOrg.name}</h3>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span className="admin-status-badge" style={{ background: '#f3f4f6', color: '#4b5563' }}>
                    Launch pack: {LAUNCH_PACK_STATUS_LABELS[selectedOrg.launch_pack_status || 'not_delivered']}
                  </span>
                  <span
                    className="admin-status-badge"
                    style={{
                      background: selectedOrg.client_guide_acknowledged_at ? '#ecfdf3' : '#fffaeb',
                      color: selectedOrg.client_guide_acknowledged_at ? '#067647' : '#b54708',
                    }}
                  >
                    Guide: {selectedOrg.client_guide_acknowledged_at ? 'Acknowledged' : 'Pending'}
                  </span>
                  <span
                    className="admin-status-badge"
                    style={{
                      background: selectedOrg.security_policy_acknowledged_at ? '#ecfdf3' : '#fffaeb',
                      color: selectedOrg.security_policy_acknowledged_at ? '#067647' : '#b54708',
                    }}
                  >
                    Security: {selectedOrg.security_policy_acknowledged_at ? 'Acknowledged' : 'Pending'}
                  </span>
                </div>

                <div className="admin-table-muted" style={{ marginBottom: 8 }}>
                  <strong style={{ color: '#111827' }}>Launch pack delivered:</strong>{' '}
                  {formatLaunchDateTime(selectedOrg.launch_pack_delivered_at)}
                </div>
                <div className="admin-table-muted" style={{ marginBottom: 8 }}>
                  <strong style={{ color: '#111827' }}>Next review / QBR:</strong>{' '}
                  {formatLaunchDateTime(selectedOrg.next_qbr_scheduled_for)}
                </div>
                <div className="admin-table-muted">
                  <strong style={{ color: '#111827' }}>Offboarding plan:</strong>{' '}
                  {OFFBOARDING_PLAN_STATUS_LABELS[selectedOrg.offboarding_plan_status || 'not_defined']}
                </div>
              </div>

              <div className="admin-card" style={{ marginBottom: 20 }}>
                <div className="admin-card-header">
                  <h3>Launch delivery</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="admin-card-section-title" style={{ display: 'block', marginBottom: 8 }}>
                      Launch pack status
                    </label>
                    <select
                      value={selectedOrg.launch_pack_status || 'not_delivered'}
                      onChange={(e) => updateOrganization({ launch_pack_status: e.target.value })}
                      className="admin-filter-select"
                      disabled={saving}
                    >
                      <option value="not_delivered">Not Delivered</option>
                      <option value="delivered">Delivered</option>
                      <option value="acknowledged">Acknowledged</option>
                    </select>
                  </div>

                  <div>
                    <label className="admin-card-section-title" style={{ display: 'block', marginBottom: 8 }}>
                      Next QBR
                    </label>
                    <input
                      type="datetime-local"
                      defaultValue={toLaunchInputValue(selectedOrg.next_qbr_scheduled_for)}
                      onBlur={(e) =>
                        updateOrganization({
                          next_qbr_scheduled_for: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null,
                        })
                      }
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <label className="admin-card-section-title" style={{ display: 'block', marginBottom: 8 }}>
                    Review cadence
                  </label>
                  <select
                    value={selectedOrg.qbr_cadence || 'quarterly'}
                    onChange={(e) => updateOrganization({ qbr_cadence: e.target.value })}
                    className="admin-filter-select"
                    disabled={saving}
                  >
                    <option value="monthly">{QBR_CADENCE_LABELS.monthly}</option>
                    <option value="quarterly">{QBR_CADENCE_LABELS.quarterly}</option>
                    <option value="semiannual">{QBR_CADENCE_LABELS.semiannual}</option>
                    <option value="annual">{QBR_CADENCE_LABELS.annual}</option>
                  </select>
                </div>

                <div style={{ marginTop: 16 }}>
                  <label className="admin-card-section-title" style={{ display: 'block', marginBottom: 8 }}>
                    Launch pack notes
                  </label>
                  <textarea
                    defaultValue={selectedOrg.launch_pack_notes || ''}
                    onBlur={(e) => updateOrganization({ launch_pack_notes: e.target.value.trim() || null })}
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    placeholder="Support expectations, first-week focus, escalation reminders, launch notes"
                  />
                </div>

                <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() =>
                      updateOrganization({
                        launch_pack_status: 'delivered',
                        launch_pack_delivered_at: new Date().toISOString(),
                      })
                    }
                    className="admin-btn-small"
                    disabled={saving}
                  >
                    Mark delivered
                  </button>
                </div>
              </div>

              <div className="admin-card" style={{ marginBottom: 20 }}>
                <div className="admin-card-header">
                  <h3>Offboarding and security</h3>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <span
                    className="admin-status-badge"
                    style={{
                      background: summary.ready ? '#ecfdf3' : '#fffaeb',
                      color: summary.ready ? '#067647' : '#b54708',
                    }}
                  >
                    Launch discipline: {summary.percent}%
                  </span>
                </div>

                <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                  {summary.checks.map((check) => (
                    <div key={check.key} className="admin-table-muted">
                      <strong style={{ color: check.passed ? '#067647' : '#b42318' }}>
                        {check.passed ? '✓' : '✗'}
                      </strong>{' '}
                      {check.label}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="admin-card-section-title" style={{ display: 'block', marginBottom: 8 }}>
                    Offboarding plan status
                  </label>
                  <select
                    value={selectedOrg.offboarding_plan_status || 'not_defined'}
                    onChange={(e) => updateOrganization({ offboarding_plan_status: e.target.value })}
                    className="admin-filter-select"
                    disabled={saving}
                  >
                    <option value="not_defined">Not Defined</option>
                    <option value="documented">Documented</option>
                    <option value="reviewed">Reviewed</option>
                  </select>
                </div>

                <div style={{ marginTop: 16 }}>
                  <label className="admin-card-section-title" style={{ display: 'block', marginBottom: 8 }}>
                    Offboarding notes
                  </label>
                  <textarea
                    defaultValue={selectedOrg.offboarding_notes || ''}
                    onBlur={(e) => updateOrganization({ offboarding_notes: e.target.value.trim() || null })}
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    placeholder="Access revocation plan, delegated admin removal, documentation return/export"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: '0.86rem',
  fontFamily: 'Outfit, sans-serif',
}