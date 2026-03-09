'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { CATEGORY_LABELS as SUPPORT_CATEGORY_LABELS, PRIORITY_COLORS, STATUS_COLORS, STATUS_LABELS as SUPPORT_STATUS_LABELS, toLabel } from '../../../lib/support-ui'

const STATUS_OPTIONS = [
  'all',
  'open',
  'in_progress',
  'waiting_on_client',
  'resolved',
  'closed',
]

const CATEGORY_OPTIONS = [
  'all',
  'helpdesk',
  'accounts_access',
  'email_collaboration',
  'microsoft_365',
  'google_workspace',
  'saas_admin',
  'device_guidance',
  'security_review',
  'project_scoped',
  'portal_account',
  'billing_scope',
  'unknown',
  'other',
]

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
  open: '#f59e0b',
  in_progress: '#3b82f6',
  waiting_on_client: '#8b5cf6',
  resolved: '#10b981',
  closed: '#6b7280',
}

const priorityColor = {
  low: '#6b7280',
  medium: '#f59e0b',
  high: '#f97316',
  urgent: '#ef4444',
}

const humanize = (value, labels) => {
  if (!value) return '—'
  if (labels?.[value]) return labels[value]
  return value.replace(/_/g, ' ')
}

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

export default function TicketsPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadTickets()
  }, [statusFilter, categoryFilter])

  async function loadTickets() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      setLoading(false)
      return
    }

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
        ai_escalation_needed
      `)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (categoryFilter !== 'all') query = query.eq('category', categoryFilter)

    const { data } = await query
    setTickets(data || [])
    setLoading(false)
  }

  const filteredTickets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    return tickets.filter((ticket) => {
      if (!q) return true
      return (
        ticket.title?.toLowerCase().includes(q) ||
        `tdp-${ticket.ticket_number || ''}`.toLowerCase().includes(q) ||
        (ticket.ai_category || '').toLowerCase().includes(q) ||
        humanize(ticket.category, CATEGORY_LABELS).toLowerCase().includes(q)
      )
    })
  }, [tickets, searchQuery])

  return (
    <div className="tickets-page">
      <div className="tickets-header">
        <div>
          <h1>Support Requests</h1>
          <p>{filteredTickets.length} visible request{filteredTickets.length !== 1 ? 's' : ''}</p>
        </div>
        <a href="/portal/tickets/new" className="dashboard-new-ticket">
          + New Request
        </a>
      </div>

      <div className="tickets-filters">
        <input
          type="text"
          placeholder="Search by subject, ticket #, category, AI triage..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="tickets-search"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="tickets-filter-select"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status === 'all' ? 'All Statuses' : humanize(status, STATUS_LABELS)}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="tickets-filter-select"
        >
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>
              {category === 'all' ? 'All IT Categories' : humanize(category, CATEGORY_LABELS)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="portal-page-loading">Loading support requests...</div>
      ) : filteredTickets.length === 0 ? (
        <div className="dashboard-empty">
          <p>
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'No support requests matched your current filters.'
              : 'No support requests yet. Create your first request.'}
          </p>
          <a href="/portal/tickets/new" className="dashboard-empty-cta">
            Create Request →
          </a>
        </div>
      ) : (
        <div className="ticket-list">
          {filteredTickets.map((ticket) => (
            <a key={ticket.id} href={`/portal/tickets/${ticket.id}`} className="ticket-row">
              <div className="ticket-row-left" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                  <span className="ticket-number">
                    {ticket.ticket_number ? `TDP-${ticket.ticket_number}` : `#${ticket.id.slice(0, 8)}`}
                  </span>
                  <span className="ticket-title">{ticket.title}</span>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  <span className="ticket-platform">Category: {humanize(ticket.category, CATEGORY_LABELS)}</span>

                  <span className="ticket-platform">
                    AI: {ticket.ai_category ? humanize(ticket.ai_category, CATEGORY_LABELS) : 'Not triaged'}
                  </span>

                  {typeof ticket.ai_confidence === 'number' && (
                    <span className="ticket-platform">Confidence: {Math.round(ticket.ai_confidence * 100)}%</span>
                  )}

                  {ticket.ai_can_auto_resolve === true && (
                    <span className="ticket-status" style={{ background: '#10b98120', color: '#10b981' }}>
                      Auto-resolve eligible
                    </span>
                  )}

                  {ticket.ai_escalation_needed === true && (
                    <span className="ticket-status" style={{ background: '#ef444420', color: '#ef4444' }}>
                      Escalation needed
                    </span>
                  )}
                </div>
              </div>

              <div className="ticket-row-right">
                <span className="ticket-priority" style={{ color: priorityColor[ticket.priority] || '#6b7280' }}>
                  {humanize(ticket.priority)}
                </span>

                <span
                  className="ticket-status"
                  style={{
                    background: `${statusColor[ticket.status] || '#6b7280'}20`,
                    color: statusColor[ticket.status] || '#6b7280',
                  }}
                >
                  {humanize(ticket.status, STATUS_LABELS)}
                </span>

                <span className="ticket-date">{formatDate(ticket.created_at)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
