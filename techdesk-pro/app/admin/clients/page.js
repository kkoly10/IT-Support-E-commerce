'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const STATUS_COLORS = {
  lead: '#f39c12',
  onboarding: '#3498db',
  active: '#27ae60',
  paused: '#95a5a6',
  former: '#e74c3c',
}

const STATUS_LABELS = {
  lead: 'Lead',
  onboarding: 'Onboarding',
  active: 'Active',
  paused: 'Paused',
  former: 'Former',
}

const SERVICE_LABELS = {
  it: 'IT Support',
}

const AGREEMENT_STATUS_LABELS = {
  none: 'Not started',
  sent: 'Sent',
  signed: 'Signed',
  expired: 'Expired',
}

const PAYMENT_STATUS_LABELS = {
  none: 'Not started',
  pending: 'Pending',
  active: 'Active',
  past_due: 'Past Due',
  cancelled: 'Cancelled',
}

const ONBOARDING_STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
}

const ACCESS_STATUS_LABELS = {
  not_started: 'Not Started',
  waiting_on_client: 'Waiting on Client',
  partially_received: 'Partially Received',
  ready: 'Ready',
}

const DOCUMENTATION_STATUS_LABELS = {
  not_started: 'Not Started',
  waiting_on_client: 'Waiting on Client',
  partially_received: 'Partially Received',
  complete: 'Complete',
}

const READINESS_STYLES = {
  not_ready: { bg: '#fef3f2', color: '#b42318', label: 'Not Ready' },
  needs_work: { bg: '#fffaeb', color: '#b54708', label: 'Needs Work' },
  almost_ready: { bg: '#eef4ff', color: '#1d4ed8', label: 'Almost Ready' },
  ready: { bg: '#ecfdf3', color: '#067647', label: 'Ready' },
}

function parseCommaList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function joinList(value) {
  return Array.isArray(value) ? value.join(', ') : ''
}

function buildLifecycleHints(org) {
  const hints = []

  if (org.needs_human_review) hints.push('Needs human review')
  if (org.agreement_status !== 'signed') hints.push('Agreement not signed')
  if (org.payment_status !== 'active') hints.push('Payment not active')
  if (!org.primary_contact_confirmed) hints.push('Primary contact not confirmed')
  if (org.access_status !== 'ready') hints.push('Access not ready')
  if (org.documentation_status !== 'complete') hints.push('Docs incomplete')
  if (!org.support_ready) hints.push('Not support-ready')

  return hints.slice(0, 5)
}

function readinessPercent(org) {
  const checks = [
    org.agreement_status === 'signed',
    org.payment_status === 'active',
    org.primary_contact_confirmed === true,
    org.access_status === 'ready',
    org.documentation_status === 'complete',
    org.onboarding_status === 'completed',
    org.support_ready === true,
  ]

  const done = checks.filter(Boolean).length
  return Math.round((done / checks.length) * 100)
}

export default function AdminClients() {
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingOrg, setEditingOrg] = useState(null)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [reviewByOrgId, setReviewByOrgId] = useState({})
  const [reviewLoadingByOrgId, setReviewLoadingByOrgId] = useState({})

  useEffect(() => {
    loadOrgs()
  }, [statusFilter])

  async function loadOrgs() {
    setLoading(true)

    let query = supabase
      .from('organizations')
      .select('*, profiles(id, full_name, email, role, is_primary_contact)')
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('client_status', statusFilter)
    }

    const { data } = await query
    setOrgs(data || [])
    setLoading(false)
  }

  async function handleSave(orgId, updates) {
    setSaving(true)
    try {
      const { error } = await supabase.from('organizations').update(updates).eq('id', orgId)

      if (error) throw error
      setEditingOrg(null)
      loadOrgs()
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function runGhostLifecycleReview(orgId) {
    setReviewLoadingByOrgId((prev) => ({ ...prev, [orgId]: true }))
    try {
      const response = await fetch('/api/ai/ghost-onboarding-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ghost lifecycle review failed')

      setReviewByOrgId((prev) => ({ ...prev, [orgId]: data.review }))
    } catch (err) {
      console.error('Ghost lifecycle review error:', err)
      alert(err.message || 'Failed to run Ghost lifecycle review')
    } finally {
      setReviewLoadingByOrgId((prev) => ({ ...prev, [orgId]: false }))
    }
  }

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

  const totalOrgs = orgs.length
  const activeCount = orgs.filter((o) => o.client_status === 'active').length
  const leadCount = orgs.filter((o) => o.client_status === 'lead').length
  const onboardingCount = orgs.filter((o) => o.client_status === 'onboarding').length
  const needsReview = orgs.filter((o) => o.needs_human_review).length

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Clients</h1>
          <p className="admin-page-desc">
            {totalOrgs} organization{totalOrgs !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { label: 'Active', val: activeCount, color: '#27ae60' },
          { label: 'Onboarding', val: onboardingCount, color: '#3498db' },
          { label: 'Leads', val: leadCount, color: '#f39c12' },
          { label: 'Total', val: totalOrgs, color: 'var(--ink)' },
          { label: 'Needs Review', val: needsReview, color: '#e74c3c' },
        ].map((s, i) => (
          <div key={i} className="admin-stat-card">
            <div className="admin-stat-label">{s.label}</div>
            <div className="admin-stat-value" style={{ color: s.color }}>
              {s.val}
            </div>
          </div>
        ))}
      </div>

      <div className="admin-filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-filter-select"
        >
          <option value="all">All Statuses</option>
          <option value="lead">Leads</option>
          <option value="onboarding">Onboarding</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="former">Former</option>
        </select>
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        {loading ? (
          <div className="admin-loading" style={{ padding: 40 }}>
            Loading clients...
          </div>
        ) : orgs.length === 0 ? (
          <div className="admin-empty-text" style={{ padding: 40 }}>
            No organizations found
          </div>
        ) : (
          <div>
            {orgs.map((org, i) => {
              const isEditing = editingOrg === org.id
              const memberCount = org.profiles?.length || 0
              const review = reviewByOrgId[org.id]
              const readiness = READINESS_STYLES[review?.readiness_label] || READINESS_STYLES.needs_work
              const lifecycleHints = buildLifecycleHints(org)
              const readinessPct = readinessPercent(org)

              return (
                <Fragment key={org.id}>
                  <div
                    style={{
                      padding: '16px 20px',
                      borderBottom: i < orgs.length - 1 ? '1px solid #f0ede8' : 'none',
                      background: org.needs_human_review ? '#fffdf5' : 'transparent',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 16,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <div
                            className="admin-client-avatar"
                            style={{ width: 32, height: 32, fontSize: '0.8rem' }}
                          >
                            {org.name?.charAt(0)}
                          </div>
                          <div>
                            <div className="admin-client-name" style={{ fontSize: '0.95rem' }}>
                              {org.name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                              {memberCount} member{memberCount !== 1 ? 's' : ''} · Since{' '}
                              {formatDate(org.created_at)}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          <span
                            className="admin-status-badge"
                            style={{
                              background: (STATUS_COLORS[org.client_status] || '#8a8a8a') + '18',
                              color: STATUS_COLORS[org.client_status] || '#8a8a8a',
                            }}
                          >
                            {STATUS_LABELS[org.client_status] || org.client_status}
                          </span>

                          <span
                            className="admin-status-badge"
                            style={{ background: '#0D7C6618', color: '#0D7C66' }}
                          >
                            {org.plan || 'starter'}
                          </span>

                          {(org.service_types || []).map((st) => (
                            <span
                              key={st}
                              className="admin-status-badge"
                              style={{ background: '#f0f2f5', color: '#4a4a4a' }}
                            >
                              {SERVICE_LABELS[st] || st}
                            </span>
                          ))}

                          {org.needs_human_review && (
                            <span
                              className="admin-status-badge"
                              style={{ background: '#e74c3c18', color: '#e74c3c' }}
                            >
                              ⚠️ Needs Review
                            </span>
                          )}

                          <span
                            className="admin-status-badge"
                            style={{ background: '#eef4ff', color: '#1d4ed8' }}
                          >
                            Readiness {readinessPct}%
                          </span>

                          {lifecycleHints.map((hint) => (
                            <span
                              key={hint}
                              className="admin-status-badge"
                              style={{ background: '#fffaeb', color: '#b54708' }}
                            >
                              {hint}
                            </span>
                          ))}
                        </div>

                        <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span className="ticket-platform">
                            Access: {ACCESS_STATUS_LABELS[org.access_status] || org.access_status || 'Not Started'}
                          </span>
                          <span className="ticket-platform">
                            Docs:{' '}
                            {DOCUMENTATION_STATUS_LABELS[org.documentation_status] ||
                              org.documentation_status ||
                              'Not Started'}
                          </span>
                          <span className="ticket-platform">
                            Primary contact: {org.primary_contact_confirmed ? 'Confirmed' : 'Pending'}
                          </span>
                          <span className="ticket-platform">
                            Support ready: {org.support_ready ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => runGhostLifecycleReview(org.id)}
                          className="admin-btn-small"
                          disabled={reviewLoadingByOrgId[org.id]}
                        >
                          {reviewLoadingByOrgId[org.id]
                            ? 'Reviewing...'
                            : review
                            ? 'Refresh Ghost Review'
                            : 'Ghost Review'}
                        </button>

                        <button
                          onClick={() => setEditingOrg(isEditing ? null : org.id)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                            background: 'white',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'Outfit, sans-serif',
                          }}
                        >
                          {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                      </div>
                    </div>

                    {isEditing && (
                      <EditPanel
                        org={org}
                        saving={saving}
                        onSave={(updates) => handleSave(org.id, updates)}
                      />
                    )}
                  </div>

                  {review && (
                    <div
                      style={{
                        padding: '16px 20px',
                        borderBottom: i < orgs.length - 1 ? '1px solid #f0ede8' : 'none',
                        background: '#fafaf8',
                      }}
                    >
                      <div style={{ display: 'grid', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span
                            className="admin-status-badge"
                            style={{ background: readiness.bg, color: readiness.color }}
                          >
                            {readiness.label}
                          </span>
                          <span
                            className="admin-status-badge"
                            style={{ background: '#eef4ff', color: '#1d4ed8' }}
                          >
                            Suggested client status: {review.recommended_client_status}
                          </span>
                          <span
                            className="admin-status-badge"
                            style={{ background: '#e8f5f0', color: '#0D7C66' }}
                          >
                            Suggested onboarding: {review.recommended_onboarding_status}
                          </span>
                        </div>

                        <div className="admin-table-muted" style={{ lineHeight: 1.7 }}>
                          <strong style={{ color: '#111827' }}>Ghost summary:</strong>{' '}
                          {review.lifecycle_summary}
                        </div>

                        <div className="admin-table-muted" style={{ lineHeight: 1.7 }}>
                          <strong style={{ color: '#111827' }}>Recommended next action:</strong>{' '}
                          {review.recommended_next_action}
                        </div>

                        {Array.isArray(review.blockers) && review.blockers.length > 0 && (
                          <div>
                            <div className="admin-card-section-title" style={{ marginBottom: 8 }}>
                              Blockers
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {review.blockers.map((blocker) => (
                                <span
                                  key={blocker}
                                  className="admin-status-badge"
                                  style={{ background: '#fef3f2', color: '#b42318' }}
                                >
                                  {blocker}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: 8,
                            border: '1px solid #f8d4d4',
                            background: '#fff5f5',
                            color: '#b42318',
                            fontSize: '0.86rem',
                          }}
                        >
                          <strong>Operator warning:</strong> {review.operator_warning}
                        </div>
                      </div>
                    </div>
                  )}
                </Fragment>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function EditPanel({ org, saving, onSave }) {
  const [primaryService, setPrimaryService] = useState(org.primary_service || 'it')
  const [serviceTypes, setServiceTypes] = useState(org.service_types || ['it'])
  const [clientStatus, setClientStatus] = useState(org.client_status || 'lead')
  const [plan, setPlan] = useState(org.plan || 'starter')
  const [teamSize, setTeamSize] = useState(org.team_size || '')
  const [industry, setIndustry] = useState(org.industry || '')
  const [agreementStatus, setAgreementStatus] = useState(org.agreement_status || 'none')
  const [paymentStatus, setPaymentStatus] = useState(org.payment_status || 'none')
  const [onboardingStatus, setOnboardingStatus] = useState(org.onboarding_status || 'not_started')
  const [needsReview, setNeedsReview] = useState(org.needs_human_review || false)

  const [accessStatus, setAccessStatus] = useState(org.access_status || 'not_started')
  const [documentationStatus, setDocumentationStatus] = useState(
    org.documentation_status || 'not_started'
  )
  const [primaryContactConfirmed, setPrimaryContactConfirmed] = useState(
    org.primary_contact_confirmed || false
  )
  const [environmentSummary, setEnvironmentSummary] = useState(org.environment_summary || '')
  const [supportedPlatforms, setSupportedPlatforms] = useState(joinList(org.supported_platforms))
  const [onboardingBlockers, setOnboardingBlockers] = useState(joinList(org.onboarding_blockers))
  const [supportReady, setSupportReady] = useState(org.support_ready || false)

  function toggleService(svc) {
    setServiceTypes((prev) => (prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]))
  }

  function handleSubmit() {
    onSave({
      primary_service: primaryService,
      service_types: serviceTypes,
      client_status: clientStatus,
      plan,
      team_size: teamSize || null,
      industry: industry || null,
      agreement_status: agreementStatus,
      payment_status: paymentStatus,
      onboarding_status: onboardingStatus,
      needs_human_review: needsReview,
      access_status: accessStatus,
      documentation_status: documentationStatus,
      primary_contact_confirmed: primaryContactConfirmed,
      environment_summary: environmentSummary || null,
      supported_platforms: parseCommaList(supportedPlatforms),
      onboarding_blockers: parseCommaList(onboardingBlockers),
      support_ready: supportReady,
    })
  }

  const fieldStyle = { marginBottom: 14 }
  const labelStyle = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--ink-muted)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }
  const selectStyle = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid var(--border)',
    borderRadius: 6,
    fontSize: '0.85rem',
    fontFamily: 'Outfit, sans-serif',
  }
  const inputStyle = { ...selectStyle }
  const textareaStyle = {
    ...selectStyle,
    minHeight: 92,
    resize: 'vertical',
  }

  return (
    <div
      style={{
        marginTop: 16,
        padding: 20,
        background: '#fafaf8',
        borderRadius: 10,
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Client Status</label>
          <select value={clientStatus} onChange={(e) => setClientStatus(e.target.value)} style={selectStyle}>
            <option value="lead">Lead</option>
            <option value="onboarding">Onboarding</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="former">Former</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Plan</label>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} style={selectStyle}>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="scale">Scale</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Primary Service</label>
          <select value={primaryService} onChange={(e) => setPrimaryService(e.target.value)} style={selectStyle}>
            <option value="it">IT Support</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Service Types</label>
          <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
            {['it'].map((svc) => (
              <label
                key={svc}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={serviceTypes.includes(svc)}
                  onChange={() => toggleService(svc)}
                />
                {SERVICE_LABELS[svc]}
              </label>
            ))}
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Team Size</label>
          <input
            type="number"
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
            placeholder="e.g. 12"
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Industry</label>
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. Legal, Retail"
            style={inputStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Agreement</label>
          <select value={agreementStatus} onChange={(e) => setAgreementStatus(e.target.value)} style={selectStyle}>
            <option value="none">None</option>
            <option value="sent">Sent</option>
            <option value="signed">Signed</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Payment</label>
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={selectStyle}>
            <option value="none">None</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="past_due">Past Due</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Onboarding</label>
          <select value={onboardingStatus} onChange={(e) => setOnboardingStatus(e.target.value)} style={selectStyle}>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Access Status</label>
          <select value={accessStatus} onChange={(e) => setAccessStatus(e.target.value)} style={selectStyle}>
            <option value="not_started">Not Started</option>
            <option value="waiting_on_client">Waiting on Client</option>
            <option value="partially_received">Partially Received</option>
            <option value="ready">Ready</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Documentation Status</label>
          <select
            value={documentationStatus}
            onChange={(e) => setDocumentationStatus(e.target.value)}
            style={selectStyle}
          >
            <option value="not_started">Not Started</option>
            <option value="waiting_on_client">Waiting on Client</option>
            <option value="partially_received">Partially Received</option>
            <option value="complete">Complete</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Supported Platforms</label>
          <input
            type="text"
            value={supportedPlatforms}
            onChange={(e) => setSupportedPlatforms(e.target.value)}
            placeholder="Microsoft 365, Google Workspace, Slack"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Environment Summary</label>
          <textarea
            value={environmentSummary}
            onChange={(e) => setEnvironmentSummary(e.target.value)}
            placeholder="Small law office using Microsoft 365, shared inboxes, and remote staff laptops..."
            style={textareaStyle}
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Onboarding Blockers</label>
          <textarea
            value={onboardingBlockers}
            onChange={(e) => setOnboardingBlockers(e.target.value)}
            placeholder="Need delegated admin, waiting on signed agreement, missing VPN details"
            style={textareaStyle}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 8, marginBottom: 14 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={primaryContactConfirmed}
            onChange={(e) => setPrimaryContactConfirmed(e.target.checked)}
          />
          Primary contact confirmed
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={supportReady} onChange={(e) => setSupportReady(e.target.checked)} />
          Support ready
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={needsReview} onChange={(e) => setNeedsReview(e.target.checked)} />
          Needs human review
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8 }}>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            padding: '8px 20px',
            background: 'var(--teal)',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif',
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}