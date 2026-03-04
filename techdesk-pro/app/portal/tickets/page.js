'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase/client'

const STATUS_OPTIONS = ['all', 'open', 'in_progress', 'waiting_client', 'resolved', 'closed']
const CATEGORY_OPTIONS = ['all', 'it_support', 'ecommerce', 'integration', 'document_processing']

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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) return

    let query = supabase
      .from('tickets')
      .select('*')
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

  const filteredTickets = tickets.filter(t =>
    searchQuery === '' ||
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `TDP-${t.ticket_number}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const statusColor = (status) => {
    const colors = {
      open: '#f59e0b', in_progress: '#3b82f6', waiting_client: '#8b5cf6',
      waiting_vendor: '#6b7280', resolved: '#10b981', closed: '#6b7280',
    }
    return colors[status] || '#6b7280'
  }

  const priorityColor = (priority) => {
    const colors = { low: '#6b7280', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' }
    return colors[priority] || '#6b7280'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    })
  }

  return (
    <div className="tickets-page">
      <div className="tickets-header">
        <div>
          <h1>Support Tickets</h1>
          <p>{tickets.length} total ticket{tickets.length !== 1 ? 's' : ''}</p>
        </div>
        <a href="/portal/tickets/new" className="dashboard-new-ticket">+ New Ticket</a>
      </div>

      {/* Filters */}
      <div className="tickets-filters">
        <input
          type="text"
          placeholder="Search tickets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="tickets-search"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="tickets-filter-select">
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace('_', ' ')}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="tickets-filter-select">
          {CATEGORY_OPTIONS.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      {/* Ticket List */}
      {loading ? (
        <div className="portal-page-loading">Loading tickets...</div>
      ) : filteredTickets.length === 0 ? (
        <div className="dashboard-empty">
          <p>{searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
            ? 'No tickets match your filters.'
            : 'No tickets yet. Create your first one!'}</p>
          <a href="/portal/tickets/new" className="dashboard-empty-cta">Create Ticket →</a>
        </div>
      ) : (
        <div className="ticket-list">
          {filteredTickets.map((ticket) => (
            <a key={ticket.id} href={`/portal/tickets/${ticket.id}`} className="ticket-row">
              <div className="ticket-row-left">
                <span className="ticket-number">TDP-{ticket.ticket_number}</span>
                <span className="ticket-title">{ticket.title}</span>
              </div>
              <div className="ticket-row-right">
                <span className="ticket-priority" style={{ color: priorityColor(ticket.priority) }}>
                  {ticket.priority}
                </span>
                <span className="ticket-category">{ticket.category.replace('_', ' ')}</span>
                <span className="ticket-status" style={{ background: statusColor(ticket.status) + '20', color: statusColor(ticket.status) }}>
                  {ticket.status.replace('_', ' ')}
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