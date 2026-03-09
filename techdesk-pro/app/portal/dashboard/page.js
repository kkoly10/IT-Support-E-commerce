// File: app/portal/dashboard/page.js (replace existing)

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase/client'

export default function DashboardPage() {
  const [profile, setProfile] = useState(null)
  const [org, setOrg] = useState(null)
  const [stats, setStats] = useState({ open: 0, resolved: 0, used: 0, limit: 10 })
  const [recentTickets, setRecentTickets] = useState([])
  const [dueTraining, setDueTraining] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*, organizations(*)')
      .eq('id', user.id)
      .single()

    if (profileData) {
      setProfile(profileData)
      setOrg(profileData.organizations)

      // Ticket stats
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, status, title, created_at, priority, category')
        .eq('organization_id', profileData.organization_id)
        .order('created_at', { ascending: false })

      const open = tickets?.filter(t => t.status === 'open' || t.status === 'in_progress').length || 0
      const resolved = tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0

      setStats({
        open,
        resolved,
        used: profileData.organizations?.tickets_used_this_month || 0,
        limit: profileData.organizations?.monthly_ticket_limit || 10,
      })

      setRecentTickets((tickets || []).slice(0, 5))

      // Check for mandatory training due
      const { data: assignmentStatuses } = await supabase
        .from('training_assignment_status')
        .select('*, assignment:training_assignments(*, course:training_courses(id, title, icon, estimated_minutes))')
        .eq('user_id', user.id)
        .eq('status', 'pending')

      const due = (assignmentStatuses || []).filter(s => {
        return s.assignment?.is_mandatory
      }).map(s => ({
        ...s,
        course: s.assignment?.course,
        dueDate: s.assignment?.due_date,
        isOverdue: new Date(s.assignment?.due_date) < new Date(),
        message: s.assignment?.message,
      }))

      setDueTraining(due)
    }
    setLoading(false)
  }

  const statusColor = (status) => {
    const colors = {
      open: '#f59e0b', in_progress: '#3b82f6', waiting_client: '#8b5cf6',
      resolved: '#10b981', closed: '#6b7280',
    }
    return colors[status] || '#6b7280'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return <div className="portal-page-loading">Loading dashboard...</div>
  }

  return (
    <div>
      {/* Mandatory Training Banner */}
      {dueTraining.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {dueTraining.map((t, i) => (
            <a
              key={t.id || i}
              href={`/portal/training/${t.course?.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
                padding: '14px 20px', borderRadius: 10, marginBottom: 8,
                background: t.isOverdue ? '#fff5f5' : '#fffdf5',
                border: `1px solid ${t.isOverdue ? '#ffcccc' : '#ffeaa7'}`,
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>{t.isOverdue ? '🚨' : '📋'}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '0.9rem', fontWeight: 600,
                  color: t.isOverdue ? '#c0392b' : '#856404',
                }}>
                  {t.isOverdue ? 'OVERDUE: ' : ''}Required Training: {t.course?.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: 2 }}>
                  {t.message || 'This training is mandatory for all team members.'}
                  {' · Due: '}{formatDate(t.dueDate)}
                  {' · '}{t.course?.estimated_minutes} min
                </div>
              </div>
              <span style={{
                padding: '6px 14px', borderRadius: 6, fontSize: '0.82rem', fontWeight: 600,
                background: t.isOverdue ? '#e74c3c' : 'var(--teal)',
                color: 'white', whiteSpace: 'nowrap',
              }}>
                Start Now →
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Dashboard header */}
      <div className="dashboard-header">
        <div>
          <h1>Welcome back{org ? `, ${org.name}` : ''}</h1>
          <p>Here&apos;s what&apos;s happening with your support.</p>
        </div>
        <a href="/portal/tickets/new" className="dashboard-new-ticket">+ New Ticket</a>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: 'var(--teal)' }}>{stats.open}</div>
          <div className="stat-card-label">Open Tickets</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: 'var(--teal)' }}>{stats.resolved}</div>
          <div className="stat-card-label">Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">
            {stats.used}<span className="stat-card-limit">/{stats.limit}</span>
          </div>
          <div className="stat-card-label">Tickets This Month</div>
          <div className="stat-card-bar">
            <div className="stat-card-bar-fill" style={{ width: `${Math.min((stats.used / stats.limit) * 100, 100)}%` }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value stat-card-plan">{org?.plan || 'Starter'}</div>
          <div className="stat-card-label">Current Plan</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="dashboard-actions">
        <a href="/portal/tickets/new" className="action-card">
          <span className="action-icon">📮</span> New Ticket
        </a>
        <a href="/portal/documents" className="action-card">
          <span className="action-icon">📄</span> Upload Document
        </a>
        <a href="/portal/training" className="action-card">
          <span className="action-icon">🎓</span> Training Academy
        </a>
      </div>

      {/* Recent tickets */}
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
                  <span className="ticket-title">{ticket.title}</span>
                </div>
                <div className="ticket-row-right">
                  <span className="ticket-category">{ticket.category?.replace('_', ' ')}</span>
                  <span className="ticket-status" style={{
                    background: statusColor(ticket.status) + '20',
                    color: statusColor(ticket.status),
                  }}>
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