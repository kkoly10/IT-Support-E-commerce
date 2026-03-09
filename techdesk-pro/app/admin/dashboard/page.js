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

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, waiting: 0, resolved: 0, clients: 0 })
  const [recentTickets, setRecentTickets] = useState([])
  const [recentClients, setRecentClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, status, created_at, priority, category, title, organization:organizations(name)')

      const all = tickets || []
      const total = all.length
      const open = all.filter((t) => t.status === 'open').length
      const inProgress = all.filter((t) => t.status === 'in_progress').length
      const waiting = all.filter((t) => t.status === 'waiting_on_client').length
      const resolved = all.filter((t) => t.status === 'resolved' || t.status === 'closed').length

      const { count: clientCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })

      setStats({ total, open, inProgress, waiting, resolved, clients: clientCount || 0 })

      const recent = [...all]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 8)

      setRecentTickets(recent)

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

  const opsSignals = useMemo(() => {
    const now = Date.now()

    const waitingOver2d = recentTickets.filter((t) => {
      if (t.status !== 'waiting_on_client') return false
      const ageHours = (now - new Date(t.created_at).getTime()) / 36e5
      return ageHours >= 48
    }).length

    const openOver3d = recentTickets.filter((t) => {
      if (t.status !== 'open' && t.status !== 'in_progress') return false
      const ageHours = (now - new Date(t.created_at).getTime()) / 36e5
      return ageHours >= 72
    }).length

    const urgentOpen = recentTickets.filter((t) => t.priority === 'urgent' && (t.status === 'open' || t.status === 'in_progress')).length

    return { waitingOver2d, openOver3d, urgentOpen }
  }, [recentTickets])

  const timeAgo = (date) => {
    const mins = Math.floor((Date.now() - new Date(date)) / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  if (loading) return <div className="admin-loading">Loading dashboard...</div>

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-desc">Founder view of support operations and queue health</p>
        </div>
      </div>

      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Support Requests</div>
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
        <div className="admin-stat-card">
          <div className="admin-stat-label">Waiting on Client</div>
          <div className="admin-stat-value">{stats.waiting}</div>
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
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Recent Support Requests</h3>
            <a href="/admin/tickets" className="admin-card-link">View all →</a>
          </div>
          {recentTickets.length === 0 ? (
            <p className="admin-empty-text">No support requests yet</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Support Request</th>
                    <th>Client</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.map((ticket) => (
                    <tr key={ticket.id} onClick={() => (window.location.href = `/admin/tickets/${ticket.id}`)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="admin-table-title">{ticket.title}</div>
                        <div className="admin-table-sub">{toLabel(ticket.category, CATEGORY_LABELS)}</div>
                      </td>
                      <td className="admin-table-muted">{ticket.organization?.name || '—'}</td>
                      <td><span className="admin-table-sm">{priorityLabel[ticket.priority] || toLabel(ticket.priority)}</span></td>
                      <td>
                        <span
                          className="admin-status-badge"
                          style={{
                            background: `${STATUS_COLORS[ticket.status] || '#8a8a8a'}18`,
                            color: STATUS_COLORS[ticket.status] || '#8a8a8a',
                          }}
                        >
                          {toLabel(ticket.status, STATUS_LABELS)}
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

        <div>
          <div className="admin-card" style={{ marginBottom: 20 }}>
            <div className="admin-card-header">
              <h3>Operational Signals</h3>
            </div>
            <div className="admin-quick-actions">
              <a href="/admin/tickets?status=waiting_on_client" className="admin-action-btn">
                <span>🟣</span> Waiting on client ≥ 2d ({opsSignals.waitingOver2d})
              </a>
              <a href="/admin/tickets?status=open" className="admin-action-btn">
                <span>⏱️</span> Open/In-progress ≥ 3d ({opsSignals.openOver3d})
              </a>
              <a href="/admin/tickets?priority=urgent" className="admin-action-btn urgent">
                <span>🔴</span> Urgent open queue ({opsSignals.urgentOpen})
              </a>
            </div>
          </div>

          <div className="admin-card" style={{ marginBottom: 20 }}>
            <div className="admin-card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="admin-quick-actions">
              <a href="/admin/tickets?status=open" className="admin-action-btn">
                <span>🎫</span> Open Support Requests ({stats.open})
              </a>
              <a href="/admin/tickets?status=waiting_on_client" className="admin-action-btn">
                <span>📬</span> Review client follow-ups
              </a>
              <a href="/admin/clients" className="admin-action-btn">
                <span>👥</span> Manage Clients
              </a>
            </div>
          </div>

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
                    <div className="admin-client-avatar">{client.name?.charAt(0) || '?'}</div>
                    <div>
                      <div className="admin-client-name">{client.name}</div>
                      <div className="admin-client-meta">{client.plan_tier} · Joined {new Date(client.created_at).toLocaleDateString()}</div>
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
