'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { CATEGORY_LABELS, STATUS_COLORS, STATUS_LABELS, toLabel } from '../../../lib/support-ui'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const priorityLabel = {
  low: '🟢 Low',
  medium: '🟡 Medium',
  high: '🟠 High',
  urgent: '🔴 Urgent',
}

function timeAgo(date) {
  const mins = Math.floor((Date.now() - new Date(date)) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function ageHours(date) {
  return (Date.now() - new Date(date).getTime()) / 36e5
}

function formatDateTime(date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getLogHref(log) {
  if (!log?.entity_type || !log?.entity_id) return null

  if (log.entity_type === 'ticket') return `/admin/tickets/${log.entity_id}`
  if (log.entity_type === 'organization') return '/admin/clients'
  if (log.entity_type === 'assessment') return '/admin/assessments'
  if (log.entity_type === 'search') return '/admin/ghost/search'

  return null
}

function OutcomeBadge({ value }) {
  const isError = value === 'error'
  return (
    <span
      className="admin-status-badge"
      style={{
        background: isError ? '#fef3f2' : '#ecfdf3',
        color: isError ? '#b42318' : '#067647',
      }}
    >
      {isError ? 'Error' : 'Success'}
    </span>
  )
}

export default function GhostOperationsPage() {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [assessments, setAssessments] = useState([])
  const [kbDrafts, setKbDrafts] = useState([])
  const [logs, setLogs] = useState([])

  const [entityFilter, setEntityFilter] = useState('all')
  const [outcomeFilter, setOutcomeFilter] = useState('all')
  const [logSearch, setLogSearch] = useState('')

  useEffect(() => {
    loadGhostOps()
  }, [])

  async function loadGhostOps() {
    setLoading(true)
    try {
      const [ticketsRes, orgsRes, assessmentsRes, kbRes, logsRes] = await Promise.all([
        supabase
          .from('tickets')
          .select(`
            id,
            ticket_number,
            title,
            status,
            priority,
            category,
            ai_category,
            ai_summary,
            ai_project_flag,
            ai_escalation_needed,
            ai_can_auto_resolve,
            created_at,
            updated_at,
            organization:organizations(name)
          `)
          .order('created_at', { ascending: false }),

        supabase
          .from('organizations')
          .select(`
            id,
            name,
            client_status,
            onboarding_status,
            agreement_status,
            payment_status,
            needs_human_review,
            created_at
          `)
          .order('created_at', { ascending: false }),

        supabase
          .from('assessment_submissions')
          .select(`
            id,
            business_name,
            full_name,
            email,
            status,
            urgency,
            created_at,
            linked_organization_id
          `)
          .order('created_at', { ascending: false }),

        supabase
          .from('kb_sop_drafts')
          .select('id, ticket_id, title, created_at')
          .order('created_at', { ascending: false }),

        supabase
          .from('ghost_activity_logs')
          .select(`
            id,
            entity_type,
            entity_id,
            action_type,
            route_name,
            outcome_status,
            summary,
            created_at
          `)
          .order('created_at', { ascending: false })
          .limit(250),
      ])

      setTickets(ticketsRes.data || [])
      setOrganizations(orgsRes.data || [])
      setAssessments(assessmentsRes.data || [])
      setKbDrafts(kbRes.data || [])
      setLogs(logsRes.data || [])
    } catch (err) {
      console.error('Ghost operations load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const derived = useMemo(() => {
    const kbTicketIds = new Set((kbDrafts || []).map((item) => item.ticket_id).filter(Boolean))

    const urgentQueue = tickets.filter(
      (t) =>
        (t.status === 'open' || t.status === 'in_progress') &&
        (t.priority === 'urgent' || t.ai_escalation_needed === true)
    )

    const blockedQueue = tickets.filter((t) => {
      if (!(t.status === 'open' || t.status === 'in_progress')) return false
      return ageHours(t.created_at) >= 72
    })

    const waitingOnClient = tickets.filter(
      (t) => t.status === 'waiting_on_client' && ageHours(t.updated_at || t.created_at) >= 48
    )

    const leadsNeedingReview = organizations.filter(
      (org) => org.client_status === 'lead' && org.needs_human_review === true
    )

    const onboardingBlockers = organizations.filter((org) => {
      if (org.client_status !== 'onboarding') return false
      const onboardingDone = ['complete', 'completed'].includes(org.onboarding_status || '')
      const agreementDone = org.agreement_status === 'signed'
      const paymentDone = org.payment_status === 'active'
      return !onboardingDone || !agreementDone || !paymentDone
    })

    const freshAssessments = assessments.filter((item) =>
      ['new', 'contacted', 'qualified'].includes(item.status || 'new')
    )

    const kbOpportunities = tickets
      .filter((t) => {
        const resolvedLike = t.status === 'resolved' || t.status === 'closed'
        if (!resolvedLike) return false
        if (kbTicketIds.has(t.id)) return false
        return true
      })
      .slice(0, 8)

    const last24h = logs.filter(
      (log) => Date.now() - new Date(log.created_at).getTime() <= 24 * 60 * 60 * 1000
    )

    const last24hErrors = last24h.filter((log) => log.outcome_status === 'error')
    const searchRuns = logs.filter((log) => log.action_type === 'ghost_search')
    const ticketActions = logs.filter((log) =>
      [
        'waiting_on_client_followup',
        'request_access_details',
        'resolve_and_publish',
        'suggest_reply',
        'generate_followup_draft',
        'generate_kb_draft',
        'ghost_context',
      ].includes(log.action_type)
    )

    return {
      urgentQueue,
      blockedQueue,
      waitingOnClient,
      leadsNeedingReview,
      onboardingBlockers,
      freshAssessments,
      kbOpportunities,
      last24hCount: last24h.length,
      last24hErrors: last24hErrors.length,
      searchRuns: searchRuns.length,
      ticketActions: ticketActions.length,
    }
  }, [tickets, organizations, assessments, kbDrafts, logs])

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase()

    return logs.filter((log) => {
      if (entityFilter !== 'all' && log.entity_type !== entityFilter) return false
      if (outcomeFilter !== 'all' && log.outcome_status !== outcomeFilter) return false

      if (!q) return true

      const blob = [
        log.entity_type,
        log.entity_id,
        log.action_type,
        log.route_name,
        log.summary,
        log.outcome_status,
      ]
        .join(' ')
        .toLowerCase()

      return blob.includes(q)
    })
  }, [logs, entityFilter, outcomeFilter, logSearch])

  if (loading) return <div className="admin-loading">Loading Ghost operations...</div>

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Ghost Operations</h1>
          <p className="admin-page-desc">
            Internal operator view of queue health, lifecycle pressure, Ghost activity, and knowledge opportunities.
          </p>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div className="admin-card-header">
          <h3>Ghost Tools</h3>
        </div>

        <div className="admin-quick-actions">
          <a href="/admin/ghost/search" className="admin-action-btn">
            <span>🔎</span> Ask Ghost Across All Records
          </a>
          <a href="/admin/kb" className="admin-action-btn">
            <span>📚</span> Review Knowledge Drafts
          </a>
          <a href="/admin/dashboard" className="admin-action-btn">
            <span>📊</span> Return to Main Dashboard
          </a>
        </div>
      </div>

      <div className="admin-stats-row">
        <div className="admin-stat-card accent-red">
          <div className="admin-stat-label">Urgent Queue</div>
          <div className="admin-stat-value">{derived.urgentQueue.length}</div>
        </div>
        <div className="admin-stat-card accent-yellow">
          <div className="admin-stat-label">Blocked &gt; 72h</div>
          <div className="admin-stat-value">{derived.blockedQueue.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Waiting on Client &gt; 48h</div>
          <div className="admin-stat-value">{derived.waitingOnClient.length}</div>
        </div>
        <div className="admin-stat-card accent-teal">
          <div className="admin-stat-label">Leads Needing Review</div>
          <div className="admin-stat-value">{derived.leadsNeedingReview.length}</div>
        </div>
        <div className="admin-stat-card accent-green">
          <div className="admin-stat-label">KB Opportunities</div>
          <div className="admin-stat-value">{derived.kbOpportunities.length}</div>
        </div>
      </div>

      <div className="admin-stats-row" style={{ marginTop: 14 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Ghost Events (24h)</div>
          <div className="admin-stat-value">{derived.last24hCount}</div>
        </div>
        <div className="admin-stat-card accent-red">
          <div className="admin-stat-label">Ghost Errors (24h)</div>
          <div className="admin-stat-value">{derived.last24hErrors}</div>
        </div>
        <div className="admin-stat-card accent-teal">
          <div className="admin-stat-label">Ghost Searches</div>
          <div className="admin-stat-value">{derived.searchRuns}</div>
        </div>
        <div className="admin-stat-card accent-green">
          <div className="admin-stat-label">Ticket-Side Ghost Actions</div>
          <div className="admin-stat-value">{derived.ticketActions}</div>
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 20, marginBottom: 20 }}>
        <div className="admin-card-header">
          <h3>Ghost Activity Log</h3>
          <span className="admin-card-section-title" style={{ marginBottom: 0 }}>
            Live audit trail for Ghost reasoning and actions
          </span>
        </div>

        <div className="admin-filters" style={{ marginTop: 12 }}>
          <input
            type="text"
            placeholder="Search action, route, entity, or summary..."
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            className="admin-search-input"
          />

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="admin-filter-select"
          >
            <option value="all">All Entities</option>
            <option value="ticket">Tickets</option>
            <option value="organization">Organizations</option>
            <option value="assessment">Assessments</option>
            <option value="search">Search</option>
          </select>

          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="admin-filter-select"
          >
            <option value="all">All Outcomes</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
        </div>

        {filteredLogs.length === 0 ? (
          <p className="admin-empty-text" style={{ marginTop: 18 }}>
            No Ghost activity matches these filters.
          </p>
        ) : (
          <div className="admin-table-wrap" style={{ marginTop: 18 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Entity</th>
                  <th>Action</th>
                  <th>Outcome</th>
                  <th>Summary</th>
                  <th>Route</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.slice(0, 100).map((log) => {
                  const href = getLogHref(log)

                  return (
                    <tr key={log.id}>
                      <td className="admin-table-muted">
                        <div>{timeAgo(log.created_at)}</div>
                        <div style={{ fontSize: '0.75rem', marginTop: 4 }}>
                          {formatDateTime(log.created_at)}
                        </div>
                      </td>

                      <td>
                        <div className="admin-table-title" style={{ fontSize: '0.82rem' }}>
                          {log.entity_type || '—'}
                        </div>
                        <div className="admin-table-sub">{log.entity_id || '—'}</div>
                      </td>

                      <td>
                        <span
                          className="admin-status-badge"
                          style={{ background: '#f0f2f5', color: '#4a4a4a' }}
                        >
                          {log.action_type}
                        </span>
                      </td>

                      <td>
                        <OutcomeBadge value={log.outcome_status} />
                      </td>

                      <td className="admin-table-muted" style={{ maxWidth: 360 }}>
                        {log.summary || '—'}
                      </td>

                      <td className="admin-table-muted" style={{ maxWidth: 260 }}>
                        {log.route_name || '—'}
                      </td>

                      <td>
                        {href ? (
                          <a href={href} className="admin-btn-small">
                            Open
                          </a>
                        ) : (
                          <span className="admin-table-muted">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-grid-2col">
        <div>
          <div className="admin-card" style={{ marginBottom: 20 }}>
            <div className="admin-card-header">
              <h3>Urgent Support Items</h3>
              <a href="/admin/tickets?priority=urgent" className="admin-card-link">
                View queue →
              </a>
            </div>

            {derived.urgentQueue.length === 0 ? (
              <p className="admin-empty-text">No urgent support items right now.</p>
            ) : (
              <div className="admin-client-list">
                {derived.urgentQueue.slice(0, 8).map((ticket) => (
                  <a
                    key={ticket.id}
                    href={`/admin/tickets/${ticket.id}`}
                    className="admin-action-btn"
                    style={{ alignItems: 'flex-start' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div className="admin-table-title">{ticket.title}</div>
                      <div className="admin-table-sub">
                        {ticket.organization?.name || 'Unknown client'} ·{' '}
                        {priorityLabel[ticket.priority] || toLabel(ticket.priority)}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        <span
                          className="admin-status-badge"
                          style={{
                            background: `${STATUS_COLORS[ticket.status] || '#8a8a8a'}18`,
                            color: STATUS_COLORS[ticket.status] || '#8a8a8a',
                          }}
                        >
                          {toLabel(ticket.status, STATUS_LABELS)}
                        </span>
                        {ticket.ai_escalation_needed === true && (
                          <span
                            className="admin-status-badge"
                            style={{ background: '#ef444418', color: '#ef4444' }}
                          >
                            Escalation
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="admin-table-muted">{timeAgo(ticket.created_at)}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="admin-card" style={{ marginBottom: 20 }}>
            <div className="admin-card-header">
              <h3>Blocked Requests</h3>
              <span className="admin-card-section-title" style={{ marginBottom: 0 }}>
                Open or in progress ≥ 72h
              </span>
            </div>

            {derived.blockedQueue.length === 0 ? (
              <p className="admin-empty-text">No blocked support requests detected.</p>
            ) : (
              <div className="admin-client-list">
                {derived.blockedQueue.slice(0, 8).map((ticket) => (
                  <a
                    key={ticket.id}
                    href={`/admin/tickets/${ticket.id}`}
                    className="admin-action-btn"
                    style={{ alignItems: 'flex-start' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div className="admin-table-title">{ticket.title}</div>
                      <div className="admin-table-sub">
                        {ticket.organization?.name || 'Unknown client'} ·{' '}
                        {toLabel(ticket.category, CATEGORY_LABELS)}
                      </div>
                      {ticket.ai_summary && (
                        <div className="admin-table-muted" style={{ marginTop: 4 }}>
                          {ticket.ai_summary}
                        </div>
                      )}
                    </div>
                    <span className="admin-table-muted">{timeAgo(ticket.created_at)}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Waiting on Client</h3>
              <a href="/admin/tickets?status=waiting_on_client" className="admin-card-link">
                Review follow-ups →
              </a>
            </div>

            {derived.waitingOnClient.length === 0 ? (
              <p className="admin-empty-text">No aged waiting-on-client requests right now.</p>
            ) : (
              <div className="admin-client-list">
                {derived.waitingOnClient.slice(0, 8).map((ticket) => (
                  <a
                    key={ticket.id}
                    href={`/admin/tickets/${ticket.id}`}
                    className="admin-action-btn"
                    style={{ alignItems: 'flex-start' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div className="admin-table-title">{ticket.title}</div>
                      <div className="admin-table-sub">
                        {ticket.organization?.name || 'Unknown client'} · waiting on client
                      </div>
                    </div>
                    <span className="admin-table-muted">
                      {timeAgo(ticket.updated_at || ticket.created_at)}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="admin-card" style={{ marginBottom: 20 }}>
            <div className="admin-card-header">
              <h3>Lead / Review Pressure</h3>
              <a href="/admin/clients" className="admin-card-link">
                Open clients →
              </a>
            </div>

            {derived.leadsNeedingReview.length === 0 ? (
              <p className="admin-empty-text">No leads currently flagged for human review.</p>
            ) : (
              <div className="admin-client-list">
                {derived.leadsNeedingReview.slice(0, 8).map((org) => (
                  <a key={org.id} href="/admin/clients" className="admin-action-btn">
                    <span>⚠️</span>
                    <div style={{ flex: 1 }}>
                      <div className="admin-table-title">{org.name}</div>
                      <div className="admin-table-sub">
                        Lead · onboarding {org.onboarding_status || 'not started'}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="admin-card" style={{ marginBottom: 20 }}>
            <div className="admin-card-header">
              <h3>Onboarding Blockers</h3>
              <span className="admin-card-section-title" style={{ marginBottom: 0 }}>
                Agreement / payment / onboarding gaps
              </span>
            </div>

            {derived.onboardingBlockers.length === 0 ? (
              <p className="admin-empty-text">No onboarding blockers detected.</p>
            ) : (
              <div className="admin-client-list">
                {derived.onboardingBlockers.slice(0, 8).map((org) => (
                  <a key={org.id} href="/admin/clients" className="admin-action-btn">
                    <span>🧩</span>
                    <div style={{ flex: 1 }}>
                      <div className="admin-table-title">{org.name}</div>
                      <div className="admin-table-sub">
                        Agreement: {org.agreement_status || 'none'} · Payment:{' '}
                        {org.payment_status || 'none'} · Onboarding:{' '}
                        {org.onboarding_status || 'not started'}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="admin-card" style={{ marginBottom: 20 }}>
            <div className="admin-card-header">
              <h3>Fresh Assessments</h3>
              <a href="/admin/assessments" className="admin-card-link">
                Open assessments →
              </a>
            </div>

            {derived.freshAssessments.length === 0 ? (
              <p className="admin-empty-text">No fresh assessment submissions right now.</p>
            ) : (
              <div className="admin-client-list">
                {derived.freshAssessments.slice(0, 8).map((item) => (
                  <a key={item.id} href="/admin/assessments" className="admin-action-btn">
                    <span>📝</span>
                    <div style={{ flex: 1 }}>
                      <div className="admin-table-title">{item.business_name}</div>
                      <div className="admin-table-sub">
                        {item.status || 'new'} · urgency: {item.urgency || '—'} · {item.full_name}
                      </div>
                    </div>
                    <span className="admin-table-muted">{timeAgo(item.created_at)}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3>KB/SOP Opportunities</h3>
              <a href="/admin/kb" className="admin-card-link">
                Open knowledge →
              </a>
            </div>

            {derived.kbOpportunities.length === 0 ? (
              <p className="admin-empty-text">No KB/SOP gaps detected right now.</p>
            ) : (
              <div className="admin-client-list">
                {derived.kbOpportunities.map((ticket) => (
                  <a
                    key={ticket.id}
                    href={`/admin/tickets/${ticket.id}`}
                    className="admin-action-btn"
                    style={{ alignItems: 'flex-start' }}
                  >
                    <div style={{ flex: 1 }}>
                      <div className="admin-table-title">{ticket.title}</div>
                      <div className="admin-table-sub">
                        {ticket.organization?.name || 'Unknown client'} ·{' '}
                        {toLabel(ticket.category, CATEGORY_LABELS)}
                      </div>
                    </div>
                    <span className="admin-table-muted">
                      {timeAgo(ticket.updated_at || ticket.created_at)}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}