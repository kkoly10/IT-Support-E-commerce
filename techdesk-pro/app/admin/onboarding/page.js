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
import { deriveContactMatrixSummary } from '../../../lib/contacts'
import { deriveAccessSummary } from '../../../lib/access'
import { deriveSupportReadiness } from '../../../lib/readiness'
import {
  deriveTransitionSummary,
  formatDateTime,
  HYPERCARE_STATUS_LABELS,
  KICKOFF_STATUS_LABELS,
  toLocalInputValue,
} from '../../../lib/transition'

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
  const [contacts, setContacts] = useState([])
  const [accessRows, setAccessRows] = useState([])
  const [documents, setDocuments] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadOrganizations()
  }, [])

  useEffect(() => {
    if (selectedOrgId) loadContext(selectedOrgId)
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
          onboarding_blockers,
          discovery_profile,
          discovery_completed,
          discovery_review_status,
          discovery_reviewed_at,
          discovery_review_notes,
          kickoff_status,
          kickoff_scheduled_for,
          kickoff_completed_at,
          support_activated_at,
          hypercare_status,
          hypercare_start_at,
          hypercare_end_at,
          first_review_scheduled_for,
          onboarding_handoff_notes
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

  async function loadContext(orgId) {
    try {
      const [{ data: taskRows }, { data: contactRows }, { data: accessData }, { data: docRows }] =
        await Promise.all([
          supabase
            .from('onboarding_tasks')
            .select('*')
            .eq('organization_id', orgId)
            .order('sort_order', { ascending: true }),
          supabase
            .from('organization_contacts')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: true }),
          supabase
            .from('organization_access_requests')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false }),
          supabase
            .from('organization_documents')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false }),
        ])

      setTasks(sortOnboardingTasks(taskRows || []))
      setContacts(contactRows || [])
      setAccessRows(accessData || [])
      setDocuments(docRows || [])
    } catch (err) {
      console.error('Load context error:', err)
      setTasks([])
      setContacts([])
      setAccessRows([])
      setDocuments([])
    }
  }

  async function initializeChecklist() {
    if (!selectedOrgId) return

    setSaving(true)
    try {
      const rows = buildDefaultTaskRows(selectedOrgId)

      const { error } = await supabase
        .from('onboarding_tasks')
        .upsert(rows, { onConflict: 'organization_id,task_key' })

      if (error) throw error

      await loadContext(selectedOrgId)
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
      const { error } = await supabase.from('onboarding_tasks').update(updates).eq('id', taskId)
      if (error) throw error

      await loadContext(selectedOrgId)
      await syncOrganizationFromTasks(selectedOrgId)
    } catch (err) {
      console.error('Update task error:', err)
      alert(err.message || 'Failed to update onboarding task')
    } finally {
      setSaving(false)
    }
  }

  async function updateOrganizationFields(orgId, updates) {
    setSaving(true)
    try {
      const { error } = await supabase.from('organizations').update(updates).eq('id', orgId)
      if (error) throw error
      await loadOrganizations()
    } catch (err) {
      console.error('Update organization fields error:', err)
      alert(err.message || 'Failed to update organization')
    } finally {
      setSaving(false)
    }
  }

  async function syncOrganizationFromTasks(orgId) {
    const selected = organizations.find((org) => org.id === orgId) || {}
    const readiness = deriveSupportReadiness({
      organization: selected,
      tasks,
      contacts,
      accessRows,
      documents,
    })

    const blocked = tasks.filter((task) => task.status === 'blocked')
    const done = tasks.filter((task) => task.status === 'done').length
    const total = tasks.length

    let onboardingStatus = 'not_started'
    if (blocked.length > 0) onboardingStatus = 'blocked'
    else if (done === total && total > 0) onboardingStatus = 'completed'
    else if (tasks.some((task) => task.status === 'in_progress' || task.status === 'done')) {
      onboardingStatus = 'in_progress'
    }

    const primaryContactConfirmed = contacts.some((c) => c.is_primary_contact)
    const approvedAccess = accessRows.filter((row) => row.status === 'approved').length
    const reviewedDocs = documents.filter((doc) => doc.status === 'reviewed').length

    let accessStatus = 'not_started'
    if (accessRows.length > 0 && approvedAccess === 0) accessStatus = 'partially_received'
    if (approvedAccess > 0) accessStatus = 'ready'

    let documentationStatus = 'not_started'
    if (documents.length > 0 && reviewedDocs === 0) documentationStatus = 'partially_received'
    if (reviewedDocs > 0) documentationStatus = 'complete'

    await supabase
      .from('organizations')
      .update({
        onboarding_status: onboardingStatus,
        onboarding_blockers: readiness.blockers,
        support_ready: readiness.ready,
        primary_contact_confirmed: primaryContactConfirmed,
        access_status: accessStatus,
        documentation_status: documentationStatus,
      })
      .eq('id', orgId)

    await loadOrganizations()
  }

  async function updateDiscoveryReview(orgId, status) {
    setSaving(true)
    try {
      const payload = {
        discovery_review_status: status,
        discovery_reviewed_at: status === 'reviewed' ? new Date().toISOString() : null,
      }

      const { error } = await supabase.from('organizations').update(payload).eq('id', orgId)
      if (error) throw error
      await loadOrganizations()
    } catch (err) {
      console.error('Update discovery review error:', err)
      alert(err.message || 'Failed to update discovery review status')
    } finally {
      setSaving(false)
    }
  }

  async function updateDiscoveryNotes(orgId, notes) {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ discovery_review_notes: notes || null })
        .eq('id', orgId)

      if (error) throw error
      await loadOrganizations()
    } catch (err) {
      console.error('Update discovery notes error:', err)
      alert(err.message || 'Failed to save discovery review notes')
    }
  }

  const selectedOrg = useMemo(
    () => organizations.find((org) => org.id === selectedOrgId) || null,
    [organizations, selectedOrgId]
  )

  const summary = useMemo(() => deriveOnboardingSummary(tasks), [tasks])
  const grouped = useMemo(() => groupOnboardingTasks(tasks), [tasks])
  const contactSummary = useMemo(() => deriveContactMatrixSummary(contacts), [contacts])
  const accessSummary = useMemo(() => deriveAccessSummary(accessRows), [accessRows])
  const readiness = useMemo(
    () =>
      deriveSupportReadiness({
        organization: selectedOrg || {},
        tasks,
        contacts,
        accessRows,
        documents,
      }),
    [selectedOrg, tasks, contacts, accessRows, documents]
  )
  const transition = useMemo(() => deriveTransitionSummary(selectedOrg || {}), [selectedOrg])

  const filteredOrganizations = useMemo(() => {
    const q = search.trim().toLowerCase()

    return organizations.filter((org) => {
      if (statusFilter !== 'all' && org.client_status !== statusFilter) return false
      if (!q) return true
      return `${org.name} ${org.client_status} ${org.onboarding_status}`.toLowerCase().includes(q)
    })
  }, [organizations, statusFilter, search])

  const discovery = selectedOrg?.discovery_profile || {}

  if (loading) {
    return <div className="admin-loading">Loading onboarding console...</div>
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Onboarding</h1>
          <p className="admin-page-desc">
            Manage onboarding checklists, discovery review, contacts, access, blockers, and transition progress from lead to active support.
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
                          background: org.support_ready ? '#ecfdf3' : '#fffaeb',
                          color: org.support_ready ? '#067647' : '#b54708',
                        }}
                      >
                        {org.support_ready ? 'Support ready' : 'Not ready'}
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
                    <a href="/admin/access" className="admin-btn-small">
                      Open access
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
                      background: readiness.ready ? '#ecfdf3' : '#fffaeb',
                      color: readiness.ready ? '#067647' : '#b54708',
                    }}
                  >
                    Readiness: {readiness.percent}%
                  </span>
                </div>

                <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={initializeChecklist} className="admin-btn-small" disabled={saving}>
                    {saving ? 'Working...' : tasks.length ? 'Refresh template rows' : 'Initialize checklist'}
                  </button>

                  <button
                    onClick={() => syncOrganizationFromTasks(selectedOrg.id)}
                    className="admin-btn-small"
                    disabled={saving}
                  >
                    Sync readiness + organization status
                  </button>
                </div>
              </div>

              <div className="admin-card" style={{ marginBottom: 20 }}>
                <div className="admin-card-header">
                  <h3>Kickoff / handoff / hypercare</h3>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span className="admin-status-badge" style={{ background: '#eef4ff', color: '#1d4ed8' }}>
                    Kickoff: {KICKOFF_STATUS_LABELS[selectedOrg.kickoff_status || 'not_scheduled']}
                  </span>
                  <span
                    className="admin-status-badge"
                    style={{
                      background: selectedOrg.support_activated_at ? '#ecfdf3' : '#fffaeb',
                      color: selectedOrg.support_activated_at ? '#067647' : '#b54708',
                    }}
                  >
                    Support: {selectedOrg.support_activated_at ? 'Activated' : 'Not activated'}
                  </span>
                  <span className="admin-status-badge" style={{ background: '#f3f4f6', color: '#4b5563' }}>
                    Hypercare: {HYPERCARE_STATUS_LABELS[selectedOrg.hypercare_status || 'not_started']}
                  </span>
                  <span
                    className="admin-status-badge"
                    style={{
                      background: transition.stageLabel.includes('Complete') || transition.stageLabel.includes('Active')
                        ? '#ecfdf3'
                        : '#f3f4f6',
                      color:
                        transition.stageLabel.includes('Complete') || transition.stageLabel.includes('Active')
                          ? '#067647'
                          : '#4b5563',
                    }}
                  >
                    Stage: {transition.stageLabel}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Kickoff scheduled for</label>
                    <input
                      type="datetime-local"
                      defaultValue={toLocalInputValue(selectedOrg.kickoff_scheduled_for)}
                      onBlur={(e) =>
                        updateOrganizationFields(selectedOrg.id, {
                          kickoff_scheduled_for: e.target.value ? new Date(e.target.value).toISOString() : null,
                          kickoff_status: e.target.value ? 'scheduled' : 'not_scheduled',
                        })
                      }
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>First review scheduled for</label>
                    <input
                      type="datetime-local"
                      defaultValue={toLocalInputValue(selectedOrg.first_review_scheduled_for)}
                      onBlur={(e) =>
                        updateOrganizationFields(selectedOrg.id, {
                          first_review_scheduled_for: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null,
                        })
                      }
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
                  <div className="admin-table-muted">
                    <strong style={{ color: '#111827' }}>Kickoff completed:</strong>{' '}
                    {formatDateTime(selectedOrg.kickoff_completed_at)}
                  </div>
                  <div className="admin-table-muted">
                    <strong style={{ color: '#111827' }}>Support activated:</strong>{' '}
                    {formatDateTime(selectedOrg.support_activated_at)}
                  </div>
                  <div className="admin-table-muted">
                    <strong style={{ color: '#111827' }}>Hypercare start:</strong>{' '}
                    {formatDateTime(selectedOrg.hypercare_start_at)}
                  </div>
                  <div className="admin-table-muted">
                    <strong style={{ color: '#111827' }}>Hypercare end:</strong>{' '}
                    {formatDateTime(selectedOrg.hypercare_end_at)}
                  </div>
                </div>

                <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() =>
                      updateOrganizationFields(selectedOrg.id, {
                        kickoff_status: 'scheduled',
                        kickoff_scheduled_for:
                          selectedOrg.kickoff_scheduled_for || new Date().toISOString(),
                      })
                    }
                    className="admin-btn-small"
                    disabled={saving}
                  >
                    Mark kickoff scheduled
                  </button>

                  <button
                    onClick={() =>
                      updateOrganizationFields(selectedOrg.id, {
                        kickoff_status: 'completed',
                        kickoff_completed_at: new Date().toISOString(),
                      })
                    }
                    className="admin-btn-small"
                    disabled={saving}
                  >
                    Mark kickoff complete
                  </button>

                  <button
                    onClick={() =>
                      updateOrganizationFields(selectedOrg.id, {
                        client_status: 'active',
                        onboarding_status: 'completed',
                        support_ready: true,
                        support_activated_at: new Date().toISOString(),
                        hypercare_status: 'active',
                        hypercare_start_at: new Date().toISOString(),
                      })
                    }
                    className="admin-btn-small"
                    disabled={saving || !readiness.ready}
                  >
                    Activate support + start hypercare
                  </button>

                  <button
                    onClick={() =>
                      updateOrganizationFields(selectedOrg.id, {
                        hypercare_status: 'completed',
                        hypercare_end_at: new Date().toISOString(),
                      })
                    }
                    className="admin-btn-small"
                    disabled={saving}
                  >
                    Complete hypercare
                  </button>
                </div>

                <div style={{ marginTop: 14 }}>
                  <label style={labelStyle}>Onboarding handoff notes</label>
                  <textarea
                    defaultValue={selectedOrg.onboarding_handoff_notes || ''}
                    onBlur={(e) =>
                      updateOrganizationFields(selectedOrg.id, {
                        onboarding_handoff_notes: e.target.value.trim() || null,
                      })
                    }
                    rows={4}
                    placeholder="Key handoff notes, launch caveats, first-week focus, known risks"
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className="admin-card" style={{ marginBottom: 20 }}>
                <div className="admin-card-header">
                  <h3>Support-ready gate</h3>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <span
                    className="admin-status-badge"
                    style={{
                      background: readiness.ready ? '#ecfdf3' : '#fffaeb',
                      color: readiness.ready ? '#067647' : '#b54708',
                    }}
                  >
                    {readiness.ready ? 'Ready for support' : 'Not ready for support'}
                  </span>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  {readiness.checks.map((check) => (
                    <div key={check.key} className="admin-table-muted">
                      <strong style={{ color: check.passed ? '#067647' : '#b42318' }}>
                        {check.passed ? '✓' : '✗'}
                      </strong>{' '}
                      {check.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-card" style={{ marginBottom: 20 }}>
                <div className="admin-card-header">
                  <h3>Contacts matrix</h3>
                  <a href="/admin/contacts" className="admin-btn-small">
                    Manage contacts
                  </a>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span
                    className="admin-status-badge"
                    style={{
                      background: contactSummary.hasPrimary ? '#ecfdf3' : '#fffaeb',
                      color: contactSummary.hasPrimary ? '#067647' : '#b54708',
                    }}
                  >
                    Primary: {contactSummary.hasPrimary ? contactSummary.primaryName : 'Missing'}
                  </span>
                  <span className="admin-status-badge" style={{ background: '#f3f4f6', color: '#4b5563' }}>
                    Authorized: {contactSummary.authorizedCount}
                  </span>
                  <span className="admin-status-badge" style={{ background: '#f3f4f6', color: '#4b5563' }}>
                    Billing: {contactSummary.billingCount}
                  </span>
                  <span className="admin-status-badge" style={{ background: '#fff7ed', color: '#9a3412' }}>
                    Security: {contactSummary.securityCount}
                  </span>
                  <span className="admin-status-badge" style={{ background: '#fef3f2', color: '#b42318' }}>
                    Emergency: {contactSummary.emergencyCount}
                  </span>
                </div>
              </div>

              <div className="admin-card" style={{ marginBottom: 20 }}>
                <div className="admin-card-header">
                  <h3>Access workflow</h3>
                  <a href="/admin/access" className="admin-btn-small">
                    Manage access
                  </a>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span className="admin-status-badge" style={{ background: '#f3f4f6', color: '#4b5563' }}>
                    Total: {accessSummary.total}
                  </span>
                  <span className="admin-status-badge" style={{ background: '#eef4ff', color: '#1d4ed8' }}>
                    Submitted: {accessSummary.submitted}
                  </span>
                  <span className="admin-status-badge" style={{ background: '#fff7ed', color: '#9a3412' }}>
                    Under review: {accessSummary.underReview}
                  </span>
                  <span className="admin-status-badge" style={{ background: '#ecfdf3', color: '#067647' }}>
                    Approved: {accessSummary.approved}
                  </span>
                  <span className="admin-status-badge" style={{ background: '#fef3f2', color: '#b42318' }}>
                    Follow-up: {accessSummary.needsFollowup}
                  </span>
                </div>
              </div>

              <div className="admin-card" style={{ marginBottom: 20 }}>
                <div className="admin-card-header">
                  <h3>Discovery profile</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => updateDiscoveryReview(selectedOrg.id, 'in_review')}
                      className="admin-btn-small"
                      disabled={saving || !selectedOrg.discovery_completed}
                    >
                      Mark In Review
                    </button>
                    <button
                      onClick={() => updateDiscoveryReview(selectedOrg.id, 'reviewed')}
                      className="admin-btn-small"
                      disabled={saving || !selectedOrg.discovery_completed}
                    >
                      Mark Reviewed
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <div className="admin-table-muted">
                    <strong style={{ color: '#111827' }}>Users:</strong> {discovery.user_count || '—'}
                  </div>
                  <div className="admin-table-muted">
                    <strong style={{ color: '#111827' }}>Devices:</strong> {discovery.device_count || '—'}
                  </div>
                  <div className="admin-table-muted">
                    <strong style={{ color: '#111827' }}>Locations:</strong> {discovery.location_count || '—'}
                  </div>
                  <div className="admin-table-muted">
                    <strong style={{ color: '#111827' }}>Email platform:</strong> {discovery.email_platform || '—'}
                  </div>
                  <div className="admin-table-muted">
                    <strong style={{ color: '#111827' }}>Identity provider:</strong> {discovery.identity_provider || '—'}
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <label style={labelStyle}>Discovery review notes</label>
                  <textarea
                    defaultValue={selectedOrg.discovery_review_notes || ''}
                    onBlur={(e) => updateDiscoveryNotes(selectedOrg.id, e.target.value.trim())}
                    rows={4}
                    placeholder="Operator notes after reviewing the discovery questionnaire"
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
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