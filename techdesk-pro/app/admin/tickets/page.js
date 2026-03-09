'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { CATEGORY_LABELS, STATUS_COLORS, STATUS_LABELS, toLabel } from '../../../lib/support-ui'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_on_client: 'Waiting on Client',
  resolved: 'Resolved',
  closed: 'Closed',
}

const CATEGORY_LABELS = {
  helpdesk: 'General Helpdesk',
  accounts_access: 'Accounts & Access',
  email_collaboration: 'Email & Collaboration',
  microsoft_365: 'Microsoft 365',
  google_workspace: 'Google Workspace',
  saas_admin: 'SaaS Admin',
  device_guidance: 'Device Guidance',
  security_review: 'Security Review',
  project_scoped: 'Project Scoped',
  portal_account: 'Portal Account',
  billing_scope: 'Billing & Scope',
  unknown: 'Needs Review',
  other: 'Other',
}

const statusColor = {
  open: '#e74c3c',
  in_progress: '#f39c12',
  waiting_on_client: '#9b59b6',
  resolved: '#27ae60',
  closed: '#95a5a6',
}

const priorityLabel = {
  low: '🟢',
  medium: '🟡',
  high: '🟠',
  urgent: '🔴',
}

const humanize = (value, labels) => {
  if (!value) return '—'
  if (labels?.[value]) return labels[value]
  return value.replace(/_/g, ' ')
}

function AdminTicketsContent() {
  const searchParams = useSearchParams()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || 'all')

  useEffect(() => {
    loadTickets()
  }, [statusFilter, priorityFilter])

  async function loadTickets() {
    setLoading(true)

    try {
      let query = supabase
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
          ai_confidence,
          ai_can_auto_resolve,
          ai_escalation_needed,
          ai_project_flag,
          organization:organizations(name),
          assigned_agent:profiles!tickets_assigned_to_fkey(full_name)
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') query = query.eq('status', statusFilter)
      if (priorityFilter !== 'all') query = query.eq('priority', priorityFilter)

      const { data, error } = await query
      if (error) throw error

      setTickets(data || [])
    } catch (err) {
      console.error('Error loading tickets:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()

    return tickets.filter((ticket) => {
      if (!q) return true
      return (
        ticket.title?.toLowerCase().includes(q) ||
        ticket.organization?.name?.toLowerCase().includes(q) ||
        (ticket.ai_category || '').toLowerCase().includes(q) ||
        humanize(ticket.ai_category, CATEGORY_LABELS).toLowerCase().includes(q) ||
        humanize(ticket.category, CATEGORY_LABELS).toLowerCase().includes(q) ||
        `tdp-${ticket.ticket_number || ''}`.toLowerCase().includes(q)
      )
    })
  }, [tickets, search])

  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Support Requests</h1>
          <p className="admin-page-desc">{filtered.length} request{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search by ticket, client, category, or AI triage..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search-input"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-filter-select"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_on_client">Waiting on Client</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="admin-filter-select"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        {loading ? (
          <div className="admin-loading" style={{ padding: 40 }}>
            Loading support requests...
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty-text" style={{ padding: 40 }}>
            No support requests found
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Client</th>
                  <th>Category</th>
                  <th>AI Triage</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => (window.location.href = `/admin/tickets/${ticket.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="admin-table-title">
                        {ticket.ticket_number ? `TDP-${ticket.ticket_number}` : `#${ticket.id.slice(0, 8)}`}
                      </div>
                      <div className="admin-table-sub">{ticket.title}</div>
                    </td>

                    <td className="admin-table-muted">{ticket.organization?.name || '—'}</td>

                    <td className="admin-table-muted">{humanize(ticket.category, CATEGORY_LABELS)}</td>

                    <td>
                      <div className="admin-table-title" style={{ fontSize: '0.82rem' }}>
                        {ticket.ai_category ? humanize(ticket.ai_category, CATEGORY_LABELS) : 'Not triaged'}
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                        {typeof ticket.ai_confidence === 'number' && (
                          <span className="admin-status-badge" style={{ background: '#f0f2f5', color: '#4a4a4a' }}>
                            {Math.round(ticket.ai_confidence * 100)}%
                          </span>
                        )}

                        {ticket.ai_can_auto_resolve === true && (
                          <span className="admin-status-badge" style={{ background: '#27ae6018', color: '#27ae60' }}>
                            Auto-resolve eligible
                          </span>
                        )}

                        {ticket.ai_escalation_needed === true && (
                          <span className="admin-status-badge" style={{ background: '#e74c3c18', color: '#e74c3c' }}>
                            Escalation needed
                          </span>
                        )}

                        {ticket.ai_project_flag === true && (
                          <span className="admin-status-badge" style={{ background: '#f39c1218', color: '#f39c12' }}>
                            Project / Scoped
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="admin-table-sm">
                        {priorityLabel[ticket.priority] || ''} {humanize(ticket.priority)}
                      </span>
                    </td>

                    <td>
                      <span
                        className="admin-status-badge"
                        style={{
                          background: `${statusColor[ticket.status] || '#8a8a8a'}18`,
                          color: statusColor[ticket.status] || '#8a8a8a',
                        }}
                      >
                        {humanize(ticket.status, STATUS_LABELS)}
                      </span>
                    </td>

                    <td className="admin-table-muted">{ticket.assigned_agent?.full_name || 'Unassigned'}</td>

                    <td className="admin-table-muted">{timeAgo(ticket.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminTickets() {
  return (
    <Suspense fallback={<div className="admin-loading">Loading support requests...</div>}>
      <AdminTicketsContent />
    </Suspense>
  )
}
