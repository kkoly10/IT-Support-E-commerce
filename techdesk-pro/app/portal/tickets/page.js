'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase/client'

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
  'portal_account',
  'billing_scope',
  'device_guidance',
  'other',
]

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

    if (!profile) {
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
        platform,
        created_at,
        ai_category,
        ai_confidence,
        ai_can_auto_resolve,
        ai_escalation_needed,
        ai_summary
      `)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    if (categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter)
    }

    const { data } = await query
    setTickets(data || [])
    setLoading(false)
  }

  const filteredTickets = tickets.filter((t) => {
    const q = searchQuery.toLowerCase()
    return (
      q === '' ||
      t.title?.toLowerCase().includes(q) ||
      `tdp-${t.ticket_number || ''}`.toLowerCase().includes(q) ||
      (t.ai_category || '').toLowerCase().includes(q)
    )
  })

  const statusColor = (status) => {
    const colors = {
      open: '#f59e0b',
      in_progress: '#3b82f6',
      waiting_on_client: '#8b5cf6',
      resolved: '#10b981',
      closed: '#6b7280',
    }
    return colors[status] || '#6b7280'
  }

  const priorityColor = (priority) => {
    const colors = {
      low: '#6b7280',
      medium: '#f59e0b',
      high: '#f97316',
      urgent: '#ef4444',
    }
    return colors[priority] || '#6b7280'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="tickets-page">
      <div className="tickets-header">
        <div>
          <h1>Support Requests</h1>
          <p>{tickets.length} total request{tickets.length !== 1 ? 's' : ''}</p>
        </div>
        <a href="/portal/tickets/new" className="dashboard-new-ticket">
          + New Request
        </a>
      </div>

      <div className="tickets-filters">
        <input
          type="text"
          placeholder="Search requests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="tickets-search"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="tickets-filter-select"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="tickets-filter-select"
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All Categories' : c.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="portal-page-loading">Loading requests...</div>
      ) : filteredTickets.length === 0 ? (
        <div className="dashboard-empty">
          <p>
            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'No requests match your filters.'
              : 'No support requests yet. Create your first one.'}
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
                  {ticket.ai_category && (
                    <span className="ticket-platform">
                      AI: {ticket.ai_category.replace(/_/g, ' ')}
                    </span>
                  )}

                  {typeof ticket.ai_confidence === 'number' && (
                    <span className="ticket-platform">
                      {Math.round(ticket.ai_confidence * 100)}% confidence
                    </span>
                  )}

                  {ticket.ai_can_auto_resolve === true && (
                    <span
                      className="ticket-status"
                      style={{ background: '#10b98120', color: '#10b981' }}
                    >
                      Auto-resolve eligible
                    </span>
                  )}

                  {ticket.ai_escalation_needed === true && (
                    <span
                      className="ticket-status"
                      style={{ background: '#ef444420', color: '#ef4444' }}
                    >
                      Escalation flagged
                    </span>
                  )}
                </div>
              </div>

              <div className="ticket-row-right">
                <span
                  className="ticket-priority"
                  style={{ color: priorityColor(ticket.priority) }}
                >
                  {ticket.priority}
                </span>

                <span className="ticket-category">
                  {(ticket.category || 'other').replace(/_/g, ' ')}
                </span>

                <span
                  className="ticket-status"
                  style={{
                    background: statusColor(ticket.status) + '20',
                    color: statusColor(ticket.status),
                  }}
                >
                  {ticket.status.replace(/_/g, ' ')}
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