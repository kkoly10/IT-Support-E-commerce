'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, clients: 0 })
  const [recentTickets, setRecentTickets] = useState([])
  const [recentClients, setRecentClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      // Ticket counts
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, status')

      const total = tickets?.length || 0
      const open = tickets?.filter(t => t.status === 'open').length || 0
      const inProgress = tickets?.filter(t => t.status === 'in_progress').length || 0
      const resolved = tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0

      // Client count
      const { count: clientCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })

      setStats({ total, open, inProgress, resolved, clients: clientCount || 0 })

      // Recent tickets with org name
      const { data: recent } = await supabase
        .from('tickets')
        .select('id, title, status, priority, category, created_at, organization:organizations(name)')
        .order('created_at', { ascending: false })
        .limit(8)

      setRecentTickets(recent || [])

      // Recent clients
      const { data: clients } = await supabase
        .from('organizations')
        .select('id, name, plan_tier, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentClients(clients || [])
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const statusColor = (status) => {
    const colors = {
      open: '#e74c3c',
      in_progress: '#f39c12',
      waiting_on_client: '#9b59b6',
      resolved: '#27ae60',
      closed: '#95a5a6',
    }
    return colors[status] || '#8a8a8a'
  }

  const priorityLabel = (p) => {
    const labels = { low: '🟢 Low', medium: '🟡 Medium', high: '🟠 High', urgent: '🔴 Urgent' }
    return labels[p] || p
  }

  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  if (loading) {
    return <div className="admin-loading">Loading dashboard...</div>
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-desc">Overview of all operations</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Tickets</div>
          <div className="admin-stat-value">{stats.total}</div>
        </div>
        <div className="admin-stat-card accent-red">
          <div className="admin-stat-label">Open</div>
          <div className="admin-stat-value">{stats.open}</div>
        </div>
        <div className="admin-stat-card accent-yellow">
          <div className="admin-stat-label">In Progress</div>
          <div className="admin-stat-value">{stats.inProgress}</div>
        </div>
        <div className="admin-stat-card accent-green">
          <div className="admin-stat-label">Resolved</div>
          <div className="admin-stat-value">{stats.resolved}</div>
        </div>
        <div className="admin-stat-card accent-teal">
          <div className="admin-stat-label">Clients</div>
          <div className="admin-stat-value">{stats.clients}</div>
        </div>
      </div>

      <div className="admin-grid-2col">
        {/* Recent tickets */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Recent Tickets</h3>
            <a href="/admin/tickets" className="admin-card-link">View all →</a>
          </div>
          {recentTickets.length === 0 ? (
            <p className="admin-empty-text">No tickets yet</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Client</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.map((ticket) => (
                    <tr key={ticket.id} onClick={() => window.location.href = `/admin/tickets/${ticket.id}`} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="admin-table-title">{ticket.title}</div>
                        <div className="admin-table-sub">{ticket.category}</div>
                      </td>
                      <td className="admin-table-muted">{ticket.organization?.name || '—'}</td>
                      <td><span className="admin-table-sm">{priorityLabel(ticket.priority)}</span></td>
                      <td>
                        <span
                          className="admin-status-badge"
                          style={{ background: statusColor(ticket.status) + '18', color: statusColor(ticket.status) }}
                        >
                          {ticket.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="admin-table-muted">{timeAgo(ticket.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div>
          {/* Quick actions */}
          <div className="admin-card" style={{ marginBottom: 20 }}>
            <div className="admin-card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="admin-quick-actions">
              <a href="/admin/tickets?status=open" className="admin-action-btn">
                <span>🎫</span> Open Tickets ({stats.open})
              </a>
              <a href="/admin/tickets?priority=urgent" className="admin-action-btn urgent">
                <span>🔴</span> Urgent Tickets
              </a>
              <a href="/admin/clients" className="admin-action-btn">
                <span>👥</span> Manage Clients
              </a>
            </div>
          </div>

          {/* Recent clients */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Recent Clients</h3>
              <a href="/admin/clients" className="admin-card-link">View all →</a>
            </div>
            {recentClients.length === 0 ? (
              <p className="admin-empty-text">No clients yet</p>
            ) : (
              <div className="admin-client-list">
                {recentClients.map((client) => (
                  <div key={client.id} className="admin-client-row">
                    <div className="admin-client-avatar">
                      {client.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="admin-client-name">{client.name}</div>
                      <div className="admin-client-meta">
                        {client.plan_tier} · Joined {new Date(client.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}