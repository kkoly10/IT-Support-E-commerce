'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { CATEGORY_LABELS, PRIORITY_COLORS, STATUS_COLORS, STATUS_LABELS, toLabel } from '../../../lib/support-ui'

const CLIENT_STATUS_LABELS = {
  lead: 'Lead',
  onboarding: 'Onboarding',
  active: 'Active',
  paused: 'Paused',
  former: 'Former',
}

const AGREEMENT_STATUS_LABELS = {
  none: 'Not started',
  pending: 'Pending review',
  sent: 'Sent',
  signed: 'Signed',
}

const PAYMENT_STATUS_LABELS = {
  none: 'Not started',
  pending: 'Pending setup',
  unpaid: 'Unpaid',
  paid: 'Paid',
  failed: 'Action required',
}

const ONBOARDING_STATUS_LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  blocked: 'Blocked',
  completed: 'Completed',
}

const asPct = (value) => (typeof value === 'number' ? `${Math.round(value * 100)}%` : '—')

const fmtDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

function StatusPill({ value, labels }) {
  return (
    <span
      className="ticket-status"
      style={{
        background: `${STATUS_COLORS[value] || '#6b7280'}1f`,
        color: STATUS_COLORS[value] || '#6b7280',
      }}
    >
      {toLabel(value, labels)}
    </span>
  )
}

export default function DashboardPage() {
  const [profile, setProfile] = useState(null)
  const [org, setOrg] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*, organizations(*)')
      .eq('id', user.id)
      .single()

    if (!profileData) {
      setLoading(false)
      return
    }

    setProfile(profileData)
    setOrg(profileData.organizations)

    const { data: ticketData } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        title,
        status,
        priority,
        category,
        created_at,
        ai_category,
        ai_priority_recommendation,
        ai_difficulty,
        ai_estimated_time,
        ai_access_needed,
        ai_can_auto_resolve,
        ai_confidence,
        ai_project_flag,
        ai_escalation_needed
      `)
      .eq('organization_id', profileData.organization_id)
      .order('created_at', { ascending: false })
      .limit(50)

    setTickets(ticketData || [])
    setLoading(false)
  }

  const lifecycle = org?.client_status || 'lead'

  const metrics = useMemo(() => {
    const openCount = tickets.filter((t) => t.status === 'open').length
    const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length
    const waitingCount = tickets.filter((t) => t.status === 'waiting_on_client').length
    const resolvedCount = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length
    const escalatedCount = tickets.filter((t) => t.ai_escalation_needed === true).length
    const autoResolveEligible = tickets.filter((t) => t.ai_can_auto_resolve === true).length

    return {
      openCount,
      inProgressCount,
      waitingCount,
      resolvedCount,
      escalatedCount,
      autoResolveEligible,
      monthlyUsed: org?.tickets_used_this_month || 0,
      monthlyLimit: org?.monthly_ticket_limit || 10,
    }
  }, [tickets, org])

  const recentTickets = useMemo(() => tickets.slice(0, 6), [tickets])

  const waitingOnClientTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'waiting_on_client').slice(0, 3),
    [tickets]
  )

  const staleOpenTickets = useMemo(() => {
    const now = Date.now()
    return tickets.filter((ticket) => {
      if (ticket.status !== 'open' && ticket.status !== 'in_progress') return false
      const ageHours = (now - new Date(ticket.created_at).getTime()) / 36e5
      return ageHours >= 72
    }).length
  }, [tickets])

  const onboardingChecks = [
    {
      label: 'Service agreement',
      value: org?.agreement_status || 'none',
      labels: AGREEMENT_STATUS_LABELS,
      done: org?.agreement_status === 'signed',
    },
    {
      label: 'Billing setup',
      value: org?.payment_status || 'none',
      labels: PAYMENT_STATUS_LABELS,
      done: org?.payment_status === 'paid',
    },
    {
      label: 'Onboarding progress',
      value: org?.onboarding_status || 'not_started',
      labels: ONBOARDING_STATUS_LABELS,
      done: org?.onboarding_status === 'completed',
    },
  ]

  const onboardingCompleted = onboardingChecks.filter((step) => step.done).length
  const onboardingPercent = Math.round((onboardingCompleted / onboardingChecks.length) * 100)

  if (loading) return <div className="portal-page-loading">Loading dashboard...</div>

  const renderLifecycleHeader = () => (
    <div className="dashboard-header">
      <div>
        <h1>{org?.name || 'Your Portal Dashboard'}</h1>
        <p>
          Lifecycle: <strong>{toLabel(lifecycle, CLIENT_STATUS_LABELS)}</strong> · Plan:{' '}
          <strong>{(org?.plan || 'starter').toUpperCase()}</strong>
        </p>
      </div>
      {lifecycle === 'active' ? (
        <a href="/portal/tickets/new" className="dashboard-new-ticket">
          + New Support Request
        </a>
      ) : (
        <a href="/portal/settings" className="dashboard-new-ticket">
          Review Account Settings
        </a>
      )}
    </div>
  )

  const renderStatusPanel = () => (
    <div className="dashboard-section" style={{ marginTop: 16 }}>
      <div className="dashboard-section-header">
        <h2>Account Status</h2>
      </div>
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-label">Agreement</div>
          <div className="stat-card-value" style={{ fontSize: '1.05rem' }}>
            {toLabel(org?.agreement_status || 'none', AGREEMENT_STATUS_LABELS)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Payment</div>
          <div className="stat-card-value" style={{ fontSize: '1.05rem' }}>
            {toLabel(org?.payment_status || 'none', PAYMENT_STATUS_LABELS)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Onboarding</div>
          <div className="stat-card-value" style={{ fontSize: '1.05rem' }}>
            {toLabel(org?.onboarding_status || 'not_started', ONBOARDING_STATUS_LABELS)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Review flag</div>
          <div className="stat-card-value" style={{ fontSize: '1.05rem', color: org?.needs_human_review ? '#e74c3c' : '#10b981' }}>
            {org?.needs_human_review ? 'Needs human review' : 'No review blockers'}
          </div>
        </div>
      </div>
    </div>
  )

  const renderLeadDashboard = () => (
    <>
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>What happens next</h2>
        </div>
        <div className="dashboard-empty" style={{ textAlign: 'left' }}>
          <p>Thanks for starting with TechDesk Pro. Your account is in lead intake while we prepare your support workspace.</p>
          <p style={{ marginTop: 10 }}>
            Next steps: finalize agreement, confirm billing setup, and complete onboarding details so your team can move to active remote IT support.
          </p>
        </div>
      </div>

      {renderStatusPanel()}

      <div className="dashboard-actions">
        <a href="/portal/documents" className="action-card"><span className="action-icon">📄</span>Upload onboarding documents</a>
        <a href="/portal/billing" className="action-card"><span className="action-icon">💳</span>Review billing setup</a>
        <a href="/portal/settings" className="action-card"><span className="action-icon">⚙️</span>Confirm company details</a>
      </div>
    </>
  )

  const renderOnboardingDashboard = () => (
    <>
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Onboarding readiness</h2>
        </div>
        <div className="stat-card" style={{ width: '100%' }}>
          <div className="stat-card-value">{onboardingPercent}%</div>
          <div className="stat-card-label">Readiness complete ({onboardingCompleted}/{onboardingChecks.length})</div>
          <div className="stat-card-bar">
            <div className="stat-card-bar-fill" style={{ width: `${onboardingPercent}%` }} />
          </div>
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {onboardingChecks.map((step) => (
              <div key={step.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="admin-table-muted">{step.label}</span>
                <span className="ticket-platform" style={{ background: step.done ? '#10b9811a' : '#f3f4f6', color: step.done ? '#10b981' : '#6b7280' }}>
                  {toLabel(step.value, step.labels)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {renderStatusPanel()}

      <div className="dashboard-actions">
        <a href="/portal/documents" className="action-card"><span className="action-icon">📄</span>Submit required docs</a>
        <a href="/portal/billing" className="action-card"><span className="action-icon">💳</span>Finish billing configuration</a>
        <a href="/portal/training" className="action-card"><span className="action-icon">🎓</span>Start onboarding training</a>
      </div>
    </>
  )

  const renderActiveDashboard = () => (
    <>
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: 'var(--teal)' }}>{metrics.openCount}</div>
          <div className="stat-card-label">Open requests</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: '#3b82f6' }}>{metrics.inProgressCount}</div>
          <div className="stat-card-label">In progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: '#8b5cf6' }}>{metrics.waitingCount}</div>
          <div className="stat-card-label">Waiting on your team</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: '#10b981' }}>{metrics.resolvedCount}</div>
          <div className="stat-card-label">Resolved recently</div>
        </div>
      </div>

      <div className="dashboard-stats" style={{ marginTop: 16 }}>
        <div className="stat-card">
          <div className="stat-card-value">{metrics.monthlyUsed}<span className="stat-card-limit">/{metrics.monthlyLimit}</span></div>
          <div className="stat-card-label">Requests used this month</div>
          <div className="stat-card-bar"><div className="stat-card-bar-fill" style={{ width: `${Math.min((metrics.monthlyUsed / Math.max(metrics.monthlyLimit, 1)) * 100, 100)}%` }} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: '#10b981' }}>{metrics.autoResolveEligible}</div>
          <div className="stat-card-label">Auto-resolve eligible</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: '#ef4444' }}>{metrics.escalatedCount}</div>
          <div className="stat-card-label">Escalation flagged</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value stat-card-plan">{(org?.plan || 'starter').toUpperCase()}</div>
          <div className="stat-card-label">Current plan</div>
        </div>
      </div>

      <div className="dashboard-section" style={{ marginTop: 16 }}>
        <div className="dashboard-section-header">
          <h2>Action needed from your team</h2>
        </div>
        {waitingOnClientTickets.length === 0 ? (
          <div className="dashboard-empty">
            <p>No support requests are currently waiting on your team. You’re clear to focus on new issues.</p>
          </div>
        ) : (
          <div className="ticket-list">
            {waitingOnClientTickets.map((ticket) => (
              <a key={ticket.id} href={`/portal/tickets/${ticket.id}`} className="ticket-row">
                <div className="ticket-row-left">
                  <span className="ticket-title">{ticket.title}</span>
                </div>
                <div className="ticket-row-right">
                  <span className="ticket-platform">Needs reply</span>
                  <StatusPill value={ticket.status} labels={STATUS_LABELS} />
                  <span className="ticket-date">{fmtDate(ticket.created_at)}</span>
                </div>
              </a>
            ))}
          </div>
        )}

        <div style={{ marginTop: 10 }}>
          <span className="ticket-platform" style={{ background: '#fff7ed', color: '#9a3412' }}>
            Open/In-progress older than 72h: {staleOpenTickets}
          </span>
        </div>
      </div>

      <div className="dashboard-actions">
        <a href="/portal/tickets/new" className="action-card"><span className="action-icon">🎫</span>Submit support request</a>
        <a href="/portal/atlas" className="action-card"><span className="action-icon">🧠</span>Ask Atlas Assistant</a>
        <a href="/portal/health" className="action-card"><span className="action-icon">🛡️</span>Check system health</a>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Recent support requests</h2>
          <a href="/portal/tickets" className="dashboard-see-all">View all →</a>
        </div>

        {recentTickets.length === 0 ? (
          <div className="dashboard-empty">
            <p>No support requests yet. Start by submitting your first IT request.</p>
            <a href="/portal/tickets/new" className="dashboard-empty-cta">Create Support Request →</a>
          </div>
        ) : (
          <div className="ticket-list">
            {recentTickets.map((ticket) => (
              <a key={ticket.id} href={`/portal/tickets/${ticket.id}`} className="ticket-row">
                <div className="ticket-row-left" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className="ticket-number">{ticket.ticket_number ? `TDP-${ticket.ticket_number}` : `#${ticket.id.slice(0, 8)}`}</span>
                    <span className="ticket-title">{ticket.title}</span>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="ticket-platform">Category: {toLabel(ticket.category, CATEGORY_LABELS)}</span>
                    <span className="ticket-platform">AI Category: {toLabel(ticket.ai_category, CATEGORY_LABELS)}</span>
                    <span className="ticket-platform">AI Confidence: {asPct(ticket.ai_confidence)}</span>
                    {ticket.ai_can_auto_resolve && <span className="ticket-status" style={{ background: '#10b9811f', color: '#10b981' }}>Auto-resolve eligible</span>}
                    {ticket.ai_escalation_needed && <span className="ticket-status" style={{ background: '#ef44441f', color: '#ef4444' }}>Escalation needed</span>}
                    {ticket.ai_project_flag && <span className="ticket-status" style={{ background: '#f59e0b1f', color: '#f59e0b' }}>Project / Scoped</span>}
                  </div>
                </div>

                <div className="ticket-row-right">
                  <span className="ticket-priority" style={{ color: PRIORITY_COLORS[ticket.priority] || '#6b7280' }}>
                    {toLabel(ticket.priority)}
                  </span>
                  <StatusPill value={ticket.status} labels={STATUS_LABELS} />
                  <span className="ticket-date">{fmtDate(ticket.created_at)}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  )

  const renderNonActiveState = () => (
    <div className="dashboard-section">
      <div className="dashboard-section-header">
        <h2>Support availability</h2>
      </div>
      <div className="dashboard-empty" style={{ textAlign: 'left' }}>
        <p>
          Your account is currently <strong>{toLabel(lifecycle, CLIENT_STATUS_LABELS).toLowerCase()}</strong>. Support request intake is limited until your account returns to active status.
        </p>
        <div className="dashboard-actions" style={{ marginTop: 12 }}>
          <a href="/portal/billing" className="action-card"><span className="action-icon">💳</span>Review billing</a>
          <a href="/portal/settings" className="action-card"><span className="action-icon">⚙️</span>Update account details</a>
          <a href="/portal/documents" className="action-card"><span className="action-icon">📄</span>View documents</a>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      {renderLifecycleHeader()}

      {(lifecycle === 'lead' || lifecycle === 'onboarding') && (
        <div style={{ marginBottom: 16 }}>
          <span className="ticket-platform" style={{ background: '#f0f7ff', color: '#2d6ea3' }}>
            Primary contact: {profile?.full_name || 'Client User'}
          </span>
        </div>
      )}

      {lifecycle === 'lead' && renderLeadDashboard()}
      {lifecycle === 'onboarding' && renderOnboardingDashboard()}
      {lifecycle === 'active' && renderActiveDashboard()}
      {(lifecycle === 'paused' || lifecycle === 'former') && (
        <>
          {renderStatusPanel()}
          {renderNonActiveState()}
        </>
      )}
    </div>
  )
}
