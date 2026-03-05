// File: app/admin/compliance/page.js (new — mkdir -p app/admin/compliance)

'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function ComplianceDashboard() {
  const [assignments, setAssignments] = useState([])
  const [statuses, setStatuses] = useState([])
  const [orgs, setOrgs] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  // Form state
  const [selectedOrg, setSelectedOrg] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isRecurring, setIsRecurring] = useState(true)
  const [isMandatory, setIsMandatory] = useState(true)
  const [assignMessage, setAssignMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUser(user)

    const [assignRes, statusRes, orgRes, courseRes] = await Promise.all([
      supabase.from('training_assignments').select('*, course:training_courses(title, icon), organization:organizations(name)').order('due_date', { ascending: true }),
      supabase.from('training_assignment_status').select('*, user:profiles!training_assignment_status_user_id_fkey(full_name, email), organization:organizations(name)'),
      supabase.from('organizations').select('id, name'),
      supabase.from('training_courses').select('id, title, icon, category').eq('is_published', true).order('sort_order'),
    ])

    setAssignments(assignRes.data || [])
    setStatuses(statusRes.data || [])
    setOrgs(orgRes.data || [])
    setCourses(courseRes.data || [])
    setLoading(false)
  }

  async function handleAssign(e) {
    e.preventDefault()
    if (!selectedOrg || !selectedCourse || !dueDate) return

    setAssigning(true)
    try {
      const res = await fetch('/api/ai/assign-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: selectedOrg,
          courseId: selectedCourse,
          dueDate,
          isRecurring,
          isMandatory,
          message: assignMessage,
          assignedBy: currentUser?.id,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowAssignForm(false)
        setSelectedOrg('')
        setSelectedCourse('')
        setDueDate('')
        setAssignMessage('')
        loadData()
      }
    } catch (err) {
      console.error('Assign error:', err)
    } finally {
      setAssigning(false)
    }
  }

  // Calculate stats
  const totalAssigned = statuses.length
  const completed = statuses.filter(s => s.status === 'completed').length
  const overdue = statuses.filter(s => {
    if (s.status === 'completed') return false
    const assignment = assignments.find(a => a.id === s.assignment_id)
    return assignment && new Date(assignment.due_date) < new Date()
  }).length
  const complianceRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0

  // Group by org for compliance overview
  const orgCompliance = orgs.map(org => {
    const orgStatuses = statuses.filter(s => s.organization_id === org.id)
    const orgCompleted = orgStatuses.filter(s => s.status === 'completed').length
    const orgTotal = orgStatuses.length
    const orgOverdue = orgStatuses.filter(s => {
      if (s.status === 'completed') return false
      const assignment = assignments.find(a => a.id === s.assignment_id)
      return assignment && new Date(assignment.due_date) < new Date()
    }).length
    return {
      ...org,
      total: orgTotal,
      completed: orgCompleted,
      overdue: orgOverdue,
      rate: orgTotal > 0 ? Math.round((orgCompleted / orgTotal) * 100) : null,
    }
  }).filter(o => o.total > 0)

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  if (loading) return <div className="admin-loading">Loading compliance data...</div>

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: '1.4rem' }}>📋</span>
            <h1 className="admin-page-title">Training Compliance</h1>
          </div>
          <p className="admin-page-desc">Assign mandatory training and track completion across all clients</p>
        </div>
        <button
          onClick={() => setShowAssignForm(!showAssignForm)}
          style={{
            padding: '10px 20px', borderRadius: 8,
            background: showAssignForm ? '#f0f2f5' : 'var(--teal)',
            color: showAssignForm ? 'var(--ink)' : 'white',
            border: 'none', fontWeight: 600, fontSize: '0.85rem',
            cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
          }}
        >
          {showAssignForm ? 'Cancel' : '+ Assign Training'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Overall Compliance</div>
          <div className="admin-stat-value" style={{ color: complianceRate >= 80 ? '#27ae60' : complianceRate >= 50 ? '#f39c12' : '#e74c3c' }}>
            {complianceRate}%
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Assigned</div>
          <div className="admin-stat-value">{totalAssigned}</div>
        </div>
        <div className="admin-stat-card accent-green">
          <div className="admin-stat-label">Completed</div>
          <div className="admin-stat-value">{completed}</div>
        </div>
        <div className="admin-stat-card accent-red">
          <div className="admin-stat-label">Overdue</div>
          <div className="admin-stat-value">{overdue}</div>
        </div>
      </div>

      {/* Assign form */}
      {showAssignForm && (
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Assign Training</h3>
          <form onSubmit={handleAssign}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--ink-light)' }}>
                  Organization *
                </label>
                <select
                  value={selectedOrg}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                  required
                  className="admin-filter-select"
                  style={{ width: '100%' }}
                >
                  <option value="">Select organization</option>
                  <option value="all">All Organizations</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--ink-light)' }}>
                  Course *
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  required
                  className="admin-filter-select"
                  style={{ width: '100%' }}
                >
                  <option value="">Select course</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.icon} {c.title}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--ink-light)' }}>
                  Due Date *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="admin-search-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', paddingTop: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isMandatory} onChange={(e) => setIsMandatory(e.target.checked)} />
                  Mandatory
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
                  Monthly recurring
                </label>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--ink-light)' }}>
                Message to employees (optional)
              </label>
              <input
                type="text"
                value={assignMessage}
                onChange={(e) => setAssignMessage(e.target.value)}
                placeholder="e.g. Complete this training as part of our Q1 security review"
                className="admin-search-input"
                style={{ width: '100%' }}
              />
            </div>
            <button
              type="submit"
              disabled={assigning || !selectedOrg || !selectedCourse || !dueDate}
              style={{
                padding: '10px 24px', background: 'var(--teal)', color: 'white',
                border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.88rem',
                cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                opacity: assigning ? 0.5 : 1,
              }}
            >
              {assigning ? 'Assigning...' : 'Assign to All Members'}
            </button>
          </form>
        </div>
      )}

      <div className="admin-grid-2col">
        {/* Org compliance table */}
        <div className="admin-card" style={{ padding: 0 }}>
          <div className="admin-card-header" style={{ padding: '16px 20px' }}>
            <h3>Client Compliance</h3>
          </div>
          {orgCompliance.length === 0 ? (
            <div className="admin-empty-text" style={{ padding: 30 }}>No training assigned yet</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Compliance</th>
                    <th>Done</th>
                    <th>Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {orgCompliance.map((org) => (
                    <tr key={org.id}>
                      <td className="admin-table-title">{org.name}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 6, background: '#f0ede8', borderRadius: 100, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: 100,
                              width: `${org.rate}%`,
                              background: org.rate >= 80 ? '#27ae60' : org.rate >= 50 ? '#f39c12' : '#e74c3c',
                            }} />
                          </div>
                          <span style={{
                            fontSize: '0.82rem', fontWeight: 600,
                            color: org.rate >= 80 ? '#27ae60' : org.rate >= 50 ? '#f39c12' : '#e74c3c',
                          }}>
                            {org.rate}%
                          </span>
                        </div>
                      </td>
                      <td className="admin-table-muted">{org.completed}/{org.total}</td>
                      <td>
                        {org.overdue > 0 ? (
                          <span style={{ color: '#e74c3c', fontWeight: 600 }}>{org.overdue}</span>
                        ) : (
                          <span className="admin-table-muted">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Overdue employees */}
        <div className="admin-card" style={{ padding: 0 }}>
          <div className="admin-card-header" style={{ padding: '16px 20px' }}>
            <h3>Overdue Employees</h3>
          </div>
          {(() => {
            const overdueList = statuses.filter(s => {
              if (s.status === 'completed') return false
              const assignment = assignments.find(a => a.id === s.assignment_id)
              return assignment && new Date(assignment.due_date) < new Date()
            }).map(s => {
              const assignment = assignments.find(a => a.id === s.assignment_id)
              return { ...s, assignment }
            })

            if (overdueList.length === 0) {
              return <div className="admin-empty-text" style={{ padding: 30 }}>No overdue training — great!</div>
            }

            return (
              <div>
                {overdueList.map((item, i) => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 20px',
                    borderBottom: i < overdueList.length - 1 ? '1px solid #f0ede8' : 'none',
                    background: '#fff5f5',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--ink)' }}>
                        {item.user?.full_name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                        {item.organization?.name} · {item.assignment?.course?.title}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#e74c3c', fontWeight: 600 }}>
                      Due {item.assignment ? formatDate(item.assignment.due_date) : ''}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      </div>

      {/* Recent assignments */}
      <div className="admin-card" style={{ padding: 0, marginTop: 20 }}>
        <div className="admin-card-header" style={{ padding: '16px 20px' }}>
          <h3>Training Assignments</h3>
        </div>
        {assignments.length === 0 ? (
          <div className="admin-empty-text" style={{ padding: 30 }}>No assignments yet. Click "Assign Training" to get started.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Organization</th>
                  <th>Due Date</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => {
                  const aStatuses = statuses.filter(s => s.assignment_id === a.id)
                  const aDone = aStatuses.filter(s => s.status === 'completed').length
                  const aTotal = aStatuses.length
                  const isOverdue = new Date(a.due_date) < new Date() && aDone < aTotal
                  return (
                    <tr key={a.id}>
                      <td>
                        <span className="admin-table-title">{a.course?.icon} {a.course?.title}</span>
                      </td>
                      <td className="admin-table-muted">{a.organization?.name}</td>
                      <td>
                        <span style={{ color: isOverdue ? '#e74c3c' : 'var(--ink-muted)', fontWeight: isOverdue ? 600 : 400, fontSize: '0.85rem' }}>
                          {formatDate(a.due_date)}
                        </span>
                      </td>
                      <td>
                        <span className="admin-status-badge" style={{
                          background: a.is_mandatory ? '#e74c3c18' : '#f39c1218',
                          color: a.is_mandatory ? '#e74c3c' : '#f39c12',
                        }}>
                          {a.is_mandatory ? 'Mandatory' : 'Optional'}
                        </span>
                        {a.is_recurring && (
                          <span style={{ marginLeft: 6, fontSize: '0.72rem', color: 'var(--ink-muted)' }}>🔄 Monthly</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: aDone === aTotal && aTotal > 0 ? '#27ae60' : 'var(--ink)' }}>
                          {aDone}/{aTotal} complete
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}