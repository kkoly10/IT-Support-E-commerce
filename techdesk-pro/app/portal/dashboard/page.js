'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import {
  CATEGORY_LABELS,
  PRIORITY_COLORS,
  STATUS_COLORS,
  STATUS_LABELS,
  toLabel,
} from '../../../lib/support-ui'
import { deriveSupportReadiness } from '../../../lib/readiness'

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
  active: 'Active',
  past_due: 'Past Due',
}

const ONBOARDING_STATUS_LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  blocked: 'Blocked',
  completed: 'Completed',
}

const ACCESS_STATUS_LABELS = {
  not_started: 'Not started',
  waiting_on_client: 'Waiting on client',
  partially_received: 'Partially received',
  ready: 'Ready',
}

const DOCUMENTATION_STATUS_LABELS = {
  not_started: 'Not started',
  waiting_on_client: 'Waiting on client',
  partially_received: 'Partially received',
  complete: 'Complete',
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

function SoftPill({ children, bg = '#f3f4f6', color = '#4b5563' }) {
  return (
    <span
      className="ticket-platform"
      style={{
        background: bg,
        color,
      }}
    >
      {children}
    </span>
  )
}

export default function DashboardPage() {
  const [profile, setProfile] = useState(null)
  const [org, setOrg] = useState(null)
  const [tickets, setTickets] = useState([])
  const [contacts, setContacts] = useState([])
  const [accessRows, setAccessRows] = useState([])
  const [documents, setDocuments] = useState([])
  const [onboardingTasks, setOnboardingTasks] = useState([])
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

    const [ticketRes, contactRes, accessRes, docRes, taskRes] = await Promise.all([
      supabase
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
        .limit(50),

      supabase
        .from('organization_contacts')
        .select('*')
        .eq('organization_id', profileData.organization_id),

      supabase
        .from('organization_access_requests')
        .select('*')
        .eq('organization_id', profileData.organization_id),

      supabase
        .from('organization_documents')
        .select('*')
        .eq('organization_id', profileData.organization_id),

      supabase
        .from('onboarding_tasks')
        .select('*')
        .eq('organization_id', profileData.organization_id),
    ])

    setTickets(ticketRes.data || [])
    setContacts(contactRes.data || [])
    setAccessRows(accessRes.data || [])
    setDocuments(docRes.data || [])
    setOnboardingTasks(taskRes.data || [])
    setLoading(false)
  }

  const lifecycle = org?.client_status || 'lead'

  const readiness = useMemo(
    () =>
      deriveSupportReadiness({
        organization: org || {},
        tasks: onboardingTasks,
        contacts,
        accessRows,
        documents,
      }),
    [org, onboardingTasks, contacts, accessRows, documents]
  )

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

  if (loading) return <div className="portal-page-loading">Loading dashboard...</div>

  return (
    <div>
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
          <a href="/portal/onboarding" className="dashboard-new-ticket">
            Review Onboarding
          </a>
        )}
      </div>

      {(lifecycle === 'lead' || lifecycle === 'onboarding') && (
        <>
          <div className="dashboard-section" style={{ marginBottom: 16 }}>
            <div className="dashboard-section-header">
              <h2>Support-ready gate</h2>
            </div>

            <div className="stat-card" style={{ width: '100%' }}>
              <div className="stat-card-value">{readiness.percent}%</div>
              <div className="stat-card-label">
                {readiness.ready ? 'Ready for support' : 'Still in setup'}
              </div>
              <div className="stat-card-bar">
                <div className="stat-card-bar-fill" style={{ width: `${readiness.percent}%` }} />
              </div>

              <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
                {readiness.checks.map((check) => (
                  <div
                    key={check.key}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}
                  >
                    <span className="admin-table-muted">{check.label}</span>
                    <span
                      className="ticket-platform"
                      style={{
                        background: check.passed ? '#ecfdf3' : '#fef3f2',
                        color: check.passed ? '#067647' : '#b42318',
                      }}
                    >
                      {check.passed ? 'Done' : 'Missing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-actions" style={{ marginBottom: 20 }}>
            <a href="/portal/contacts" className="action-card">
              <span className="action-icon">👥</span>Contacts
            </a>
            <a href="/portal/access" className="action-card">
              <span className="action-icon">🔐</span>Access
            </a>
            <a href="/portal/documents" className="action-card">
              <span className="action-icon">📄</span>Documents
            </a>
            <a href="/portal/settings" className="action-card">
              <span className="action-icon">🧾</span>Discovery
            </a>
          </div>
        </>
      )}

      {lifecycle !== 'active' ? (
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2>Support availability</h2>
          </div>
          <div className="dashboard-empty" style={{ textAlign: 'left' }}>
            <p>
              Your account is in onboarding mode. Complete the remaining readiness items before full support goes live.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-card-value" style={{ color: 'var(--teal)' }}>
                {metrics.openCount}
              </div>
              <div className="stat-card-label">Open requests</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value" style={{ color: '#3b82f6' }}>
                {metrics.inProgressCount}
              </div>
              <div className="stat-card-label">In progress</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value" style={{ color: '#8b5cf6' }}>
                {metrics.waitingCount}
              </div>
              <div className="stat-card-label">Waiting on your team</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value" style={{ color: '#10b981' }}>
                {metrics.resolvedCount}
              </div>
              <div className="stat-card-label">Resolved recently</div>
            </div>
          </div>

          <div className="dashboard-section" style={{ marginTop: 16 }}>
            <div className="dashboard-section-header">
              <h2>Recent support requests</h2>
            </div>

            {recentTickets.length === 0 ? (
              <div className="dashboard-empty">
                <p>No support requests yet.</p>
              </div>
            ) : (
              <div className="ticket-list">
                {recentTickets.map((ticket) => (
                  <a key={ticket.id} href={`/portal/tickets/${ticket.id}`} className="ticket-row">
                    <div className="ticket-row-left" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span className="ticket-number">
                          {ticket.ticket_number ? `TDP-${ticket.ticket_number}` : `#${ticket.id.slice(0, 8)}`}
                        </span>
                        <span className="ticket-title">{ticket.title}</span>
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className="ticket-platform">
                          Category: {toLabel(ticket.category, CATEGORY_LABELS)}
                        </span>
                        <span className="ticket-platform">
                          AI Category: {toLabel(ticket.ai_category, CATEGORY_LABELS)}
                        </span>
                        <span className="ticket-platform">AI Confidence: {asPct(ticket.ai_confidence)}</span>
                      </div>
                    </div>

                    <div className="ticket-row-right">
                      <span
                        className="ticket-priority"
                        style={{ color: PRIORITY_COLORS[ticket.priority] || '#6b7280' }}
                      >
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
      )}
    </div>
  )
}