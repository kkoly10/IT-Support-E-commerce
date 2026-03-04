'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase/client'

export default function DashboardPage() {
  const [stats, setStats] = useState({ open: 0, resolved: 0, used: 0, limit: 10 })
  const [recentTickets, setRecentTickets] = useState([])
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get profile + org
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('id', user.id)
        .single()

      if (profile?.organizations) {
        const org = profile.organizations
        setOrg(org)

        // Get ticket counts
        const { count: openCount } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .in('status', ['open', 'in_progress', 'waiting_client', 'waiting_vendor'])

        const { count: resolvedCount } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .in('status', ['resolved', 'closed'])

        setStats({
          open: openCount || 0,
          resolved: resolvedCount || 0,
          used: org.tickets_used_this_month || 0,
          limit: org.monthly_ticket_limit || 10,
        })

        // Get recent tickets
        const { data: tickets } = await supabase
          .from('tickets')
          .select('*')
          .eq('organization_id', org.id)
          .order('created_at', { ascending: false })
          .limit(5)

        setRecentTickets(tickets || [])
      }
      setLoading(false)
    }
    loadDashboard()
  }, [])

  const statusColor = (status) => {
    const colors = {
      open: '#f59e0b',
      in_progress: '#3b82f6',
      waiting_client: '#8b5cf6',
      waiting_vendor: '#6b7280',
      resolved: '#10b981',
      closed: '#6b7280',
    }
    return colors[status] || '#6b7280'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    })
  }

  if (loading) {
    return <div className="portal-page-loading">Loading dashboard...</div>
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back{org ? `, ${org.name}` : ''}</h1>
          <p>Here&apos;s what&apos;s happening with your support.</p>
        </div>
        <a href="/portal/tickets/new" className="dashboard-new-ticket">
          + New Ticket
        </a>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: '#f59e0b' }}>{stats.open}</div>
          <div className="stat-card-label">Open Tickets</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: '#10b981' }}>{stats.resolved}</div>
          <div className="stat-card-label">Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: '#3b82f6' }}>
            {stats.used}<span className="stat-card-limit">/{stats.limit === -1 ? '∞' : stats.limit}</span>
          </div>
          <div className="stat-card-label">Tickets This Month</div>
          <div className="stat-card-bar">
            <div
              className="stat-card-bar-fill"
              style={{ width: stats.limit === -1 ? '10%' : `${Math.min((stats.used / stats.limit) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value stat-card-plan">{org?.plan || 'starter'}</div>
          <div className="stat-card-label">Current Plan</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-actions">
        <a href="/portal/tickets/new" className="action-card">
          <span className="action-icon">🎫</span>
          <span className="action-label">New Ticket</span>
        </a>
        <a href="/portal/documents" className="action-card">
          <span className="action-icon">📄</span>
          <span className="action-label">Upload Document</span>
        </a>
        <a href="/portal/billing" className="action-card">
          <span className="action-icon">📊</span>
          <span className="action-label">View Reports</span>
        </a>
      </div>

      {/* Recent Tickets */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Recent Tickets</h2>
          <a href="/portal/tickets" className="dashboard-see-all">View all →</a>
        </div>

        {recentTickets.length === 0 ? (
          <div className="dashboard-empty">
            <p>No tickets yet. Submit your first ticket to get started!</p>
            <a href="/portal/tickets/new" className="dashboard-empty-cta">Create First Ticket →</a>
          </div>
        ) : (
          <div className="ticket-list">
            {recentTickets.map((ticket) => (
              <a key={ticket.id} href={`/portal/tickets/${ticket.id}`} className="ticket-row">
                <div className="ticket-row-left">
                  <span className="ticket-number">TDP-{ticket.ticket_number}</span>
                  <span className="ticket-title">{ticket.title}</span>
                </div>
                <div className="ticket-row-right">
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
    </div>
  )
}