'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  DEFAULT_ONBOARDING_TEMPLATE,
  ONBOARDING_OWNER_LABELS,
  ONBOARDING_PHASE_LABELS,
  ONBOARDING_STATUS_LABELS,
  ONBOARDING_STATUS_STYLES,
  buildDefaultTaskRows,
  deriveOnboardingSummary,
  groupOnboardingTasks,
  sortOnboardingTasks,
} from '../../../lib/onboarding'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const CLIENT_STATUS_LABELS = {
  lead: 'Lead',
  onboarding: 'Onboarding',
  active: 'Active',
  paused: 'Paused',
  former: 'Former',
}

function fmtDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatusBadge({ status }) {
  const style = ONBOARDING_STATUS_STYLES[status] || ONBOARDING_STATUS_STYLES.not_started

  return (
    <span
      className="admin-status-badge"
      style={{
        background: style.bg,
        color: style.color,
      }}
    >
      {ONBOARDING_STATUS_LABELS[status] || status}
    </span>
  )
}

export default function AdminOnboardingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [organizations, setOrganizations] = useState([])
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [tasks, setTasks] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrgId) loadTasks(selectedOrgId)
  }, [selectedOrgId])

  async function loadOrganizations() {
    setLoading(true)

    try {
      const { data } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          client_status,
          onboarding_status,
          agreement_status,
          payment_status,
          support_ready,
          onboarding_blockers
        `)
        .in('client_status', ['lead', 'onboarding', 'active'])
        .order('created_at', { ascending: false })

      const nextOrgs = data || []
      setOrganizations(nextOrgs)

      if (!selectedOrgId && nextOrgs.length > 0) {
        setSelectedOrgId(nextOrgs[0].id)
      }
    } catch (err) {
      console.error('Load organizations error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadTasks(orgId) {
    try {
      const { data } = await supabase
        .from('onboarding_tasks')
        .select('*')
        .eq('organization_id', orgId)
        .order('sort_order', { ascending: true })

      setTasks(sortOnboardingTasks(data || []))
    } catch (err) {
      console.error('Load tasks error:', err)
      setTasks([])
    }
  }

  async function initializeChecklist() {
    if (!selectedOrgId) return

    setSaving(true)
    try {
      const rows = buildDefaultTaskRows(selectedOrgId)

      const { error } = await supabase
        .from('onboarding_tasks')
        .upsert(rows, {
          onConflict: 'organization_id,task_key',
          ignoreDuplicates: true,
        })

      if (error) throw error

      await loadTasks(selectedOrgId)
      await syncOrganizationFromTasks(selectedOrgId)
    } catch (err) {
      console.error('Initialize checklist error:', err)
      alert(err.message || 'Failed to initialize onboarding checklist')
    } finally {
      setSaving(false)
    }
  }

  async function updateTask(taskId, updates) {
    setSaving(true)

    try {
      const { error } = await supabase
        .from('onboarding_tasks')
        .update(updates)
        .eq('id', taskId)

      if (error) throw error

      await loadTasks(selectedOrgId)
      await syncOrganizationFromTasks(selectedOrgId)
    } catch (err) {
      console.error('Update task error:', err)
      alert(err.message || 'Failed to update onboarding task')
    } finally {
      setSaving(false)
    }
  }

  async function syncOrganizationFromTasks(orgId) {
    const { data: currentTasks } = await supabase
      .from('onboarding_tasks')
      .select('*')
      .eq('organization_id', orgId)

    const rows = currentTasks || []
    const blocked = rows.filter((task) => task.status === 'blocked')
    const done = rows.filter((task) => task.status === 'done').length
    const total = rows.length

    let onboardingStatus = 'not_started'
    if (blocked.length > 0) onboardingStatus = 'blocked'
    else if (done === total && total > 0) onboardingStatus = 'completed'
    else if (rows.some((task) => task.status === 'in_progress' || task.status === 'done')) onboardingStatus = 'in_progress'

    const blockers = blocked.map((task) => task.title)

    await supabase
      .from('organizations')
      .update({
        onboarding_status: onboardingStatus,
        onboarding_blockers: blockers,
      })
      .eq('id', orgId)

    await loadOrganizations()
  }

  const selectedOrg = useMemo(
    () => organizations.find((org) => org.id === selectedOrgId) || null,
    [organizations, selectedOrgId]
  )

  const summary = useMemo(() => deriveOnboardingSummary(tasks), [tasks])
  const grouped = useMemo(() => groupOnboardingTasks(tasks), [tasks])

  const filteredOrganizations = useMemo(() => {
    const q = search.trim().toLowerCase()

    return organizations.filter((org) => {
      if (statusFilter !== 'all' && org.client_status !== statusFilter) return false
      if (!q) return true
      return `${org.name} ${org.client_status} ${org.onboarding_status}`.toLowerCase().includes(q)
    })
  }, [organizations, statusFilter, search])

  if (loading) {
    return <div className="admin-loading">Loading onboarding console...</div>
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Onboarding</h1>
          <p className="admin-page-desc">
            Manage onboarding checklists, blockers, and transition progress from lead to active support.
          </p>
        </div>
      </div>

      <div className="admin-stats-row" style={{ marginBottom: 18 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Tracked organizations</div>
          <div className="admin-stat-value">{organizations.length}</div>
        </div>
        <div className="admin-stat-card accent-teal">
          <div className="admin-stat-label">Lead</div>
          <div className="admin-stat-value">
            {organizations.filter((org) => org.client_status === 'lead').length}
          </div>
        </div>
        <div className="admin-stat-card accent-yellow">
          <div className="admin-stat-label">Onboarding</div>
          <div className="admin-stat-value">
            {organizations.filter((org) => org.client_status === 'onboarding').length}
          </div>
        </div>
        <div className="admin-stat-card accent-red">
          <div className="admin-stat-label">Blocked checklists</div>
          <div className="admin-stat-value">
            {
              organizations.filter(
                (org) => Array.isArray(org.onboarding_blockers) && org.onboarding_blockers.length > 0
              ).length
            }
          </div>
        </div>
      </div>

      <div className="admin-grid-2col">
        <div>
          <div className="admin-card" style={{ marginBottom: 20 }}>
            <div className="admin-card-header">
              <h3>Organizations</h3>
            </div>

            <div className="admin-filters" style={{ marginTop: 0 }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search organizations..."
                className="admin-search-input"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="admin-filter-select"
              >
                <option value="all">All statuses</option>
                <option value="lead">Lead</option>
                <option value="onboarding">Onboarding</option>
                <option value="active">Active</option>
              </select>
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              {filteredOrganizations.map((org) => {
                const isSelected = org.id === selectedOrgId
                const blockers = Array.isArray(org.onboarding_blockers) ? org.onboarding_blockers.length : 0

                return (
                  <button
                    key={org.id}
                    onClick={() => setSelectedOrgId(org.id)}
                    style={{
                      textAlign: 'left',
                      background: isSelected ? '#f8fafc' : 'white',
                      border: isSelected ? '1px solid #0D7C66' : '1px solid var(--border)',
                      borderRadius: 12,
                      padding: '14px 16px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{org.name}</div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span className="admin-status-badge" style={{ background: '#eef4ff', color: '#1d4ed8' }}>
                        {CLIENT_STATUS_LABELS[org.client_status] || org.client_status}
                      </span>
                      <span className="admin-status-badge" style={{ background: '#f3f4f6', color: '#4b5563' }}>
                        {org.onboarding_status || 'not_started'}
                      </span>
                      <span
                        className="admin-status-badge"
                        style={{
                          background: blockers ? '#fef3f2' : '#ecfdf3',
                          color: blockers ? '#b42318' : '#067647',
                        }}
                      >
                        {blockers ? `${blockers} blocker${blockers > 1 ? 's' : ''}` : 'No blockers'}
                      </span>
                    </div>
                  </button>
                )
              })}

              {filteredOrganizations.length === 0 && (
                <div className="admin-empty-text">No organizations match these filters.</div>
              )}
            </div>
          </div>
        </div>

        <div>
          {!selectedOrg ? (
            <div className="admin-card">
              <div className="admin-empty-text">Select an organization to manage onboarding.</div>
            </div>
          ) : (
            <>
              <div className="admin-card" style={{ marginBottom: 20 }}>
                <div className="admin-card-header">
                  <h3>{selectedOrg.name}</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <a href="/admin/clients" className="admin-btn-small">
                      Open clients
                    </a>
                    <a href="/admin/document" className="admin-btn-small">
                      Review docs
                    </a>
                  </div>
                </div>

                <div className="admin-stats-row" style={{ marginBottom: 0 }}>
                  <div className="admin-stat-card">
                    <div className="admin-stat-label">Checklist progress</div>
                    <div className="admin-stat-value">{summary.percent}%</div>
                  </div>
                  <div className="admin-stat-card accent-green">
                    <div className="admin-stat-label">Done</div>
                    <div className="admin-stat-value">{summary.done}</div>
                  </div>
                  <div className="admin-stat-card accent-yellow">
                    <div className="admin-stat-label">In progress</div>
                    <div className="admin-stat-value">{summary.inProgress}</div>
                  </div>
                  <div className="admin-stat-card accent-red">
                    <div className="admin-stat-label">Blocked</div>
                    <div className="admin-stat-value">{summary.blocked}</div>
                  </div>
                </div>

                <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span className="admin-status-badge" style={{ background: '#eef4ff', color: '#1d4ed8' }}>
                    Client status: {CLIENT_STATUS_LABELS[selectedOrg.client_status] || selectedOrg.client_status}
                  </span>
                  <span className="admin-status-badge" style={{ background: '#f3f4f6', color: '#4b5563' }}>
                    Onboarding: {selectedOrg.onboarding_status || 'not_started'}
                  </span>
                  <span
                    className="admin-status-badge"
                    style={{
                      background: selectedOrg.support_ready ? '#ecfdf3' : '#fffaeb',
                      color: selectedOrg.support_ready ? '#067647' : '#b54708',
                    }}
                  >
                    Support ready: {selectedOrg.support_ready ? 'Yes' : 'No'}
                  </span>
                </div>

                <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={initializeChecklist}
                    className="admin-btn-small"
                    disabled={saving}
                  >
                    {saving ? 'Working...' : tasks.length ? 'Refresh template rows' : 'Initialize checklist'}
                  </button>

                  <button
                    onClick={() => syncOrganizationFromTasks(selectedOrg.id)}
                    className="admin-btn-small"
                    disabled={saving || !tasks.length}
                  >
                    Sync organization status
                  </button>
                </div>
              </div>

              {tasks.length === 0 ? (
                <div className="admin-card">
                  <div className="admin-empty-text">
                    No onboarding checklist exists yet for this organization. Initialize the template to start.
                  </div>
                </div>
              ) : (
                Object.entries(grouped).map(([phase, phaseTasks]) => (
                  <div key={phase} className="admin-card" style={{ marginBottom: 20 }}>
                    <div className="admin-card-header">
                      <h3>{ONBOARDING_PHASE_LABELS[phase] || phase}</h3>
                      <span className="admin-card-section-title" style={{ marginBottom: 0 }}>
                        {phaseTasks.filter((task) => task.status === 'done').length}/{phaseTasks.length} complete
                      </span>
                    </div>

                    <div style={{ display: 'grid', gap: 12 }}>
                      {phaseTasks.map((task) => (
                        <div
                          key={task.id}
                          style={{
                            background: '#fafaf8',
                            border: '1px solid var(--border)',
                            borderRadius: 12,
                            padding: '14px 16px',
                          }}
                        >
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1.3fr 160px 170px',
                              gap: 12,
                              alignItems: 'start',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{task.title}</div>
                              <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span className="ticket-platform">
                                  Owner: {ONBOARDING_OWNER_LABELS[task.owner_type] || task.owner_type}
                                </span>
                                <span className="ticket-platform">Due: {fmtDate(task.due_date)}</span>
                              </div>

                              {task.notes ? (
                                <div style={{ marginTop: 8, color: 'var(--ink-muted)', fontSize: '0.86rem' }}>
                                  {task.notes}
                                </div>
                              ) : null}

                              {task.blocker_reason ? (
                                <div
                                  style={{
                                    marginTop: 10,
                                    background: '#fff5f5',
                                    border: '1px solid #fecaca',
                                    color: '#991b1b',
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    fontSize: '0.84rem',
                                  }}
                                >
                                  {task.blocker_reason}
                                </div>
                              ) : null}
                            </div>

                            <div>
                              <label style={labelStyle}>Status</label>
                              <select
                                value={task.status || 'not_started'}
                                onChange={(e) =>
                                  updateTask(task.id, {
                                    status: e.target.value,
                                    blocker_reason: e.target.value === 'blocked' ? task.blocker_reason || '' : null,
                                  })
                                }
                                style={inputStyle}
                              >
                                <option value="not_started">Not Started</option>
                                <option value="in_progress">In Progress</option>
                                <option value="blocked">Blocked</option>
                                <option value="done">Done</option>
                                <option value="skipped">Skipped</option>
                              </select>

                              <div style={{ marginTop: 8 }}>
                                <StatusBadge status={task.status} />
                              </div>
                            </div>

                            <div>
                              <label style={labelStyle}>Blocker reason</label>
                              <textarea
                                defaultValue={task.blocker_reason || ''}
                                onBlur={(e) =>
                                  updateTask(task.id, {
                                    blocker_reason: e.target.value.trim() || null,
                                  })
                                }
                                rows={4}
                                placeholder="Only needed if this task is blocked"
                                style={{ ...inputStyle, resize: 'vertical' }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}

              <div className="admin-card">
                <div className="admin-card-header">
                  <h3>Default checklist included in this phase</h3>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {DEFAULT_ONBOARDING_TEMPLATE.map((task) => (
                    <div key={task.task_key} className="admin-table-muted">
                      {task.title} — {ONBOARDING_PHASE_LABELS[task.phase]} / {ONBOARDING_OWNER_LABELS[task.owner_type]}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: 'var(--ink-muted)',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: '0.84rem',
  fontFamily: 'Outfit, sans-serif',
}