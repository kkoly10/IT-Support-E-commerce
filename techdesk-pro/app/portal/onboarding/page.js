'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/client'
import {
  ONBOARDING_OWNER_LABELS,
  ONBOARDING_PHASE_LABELS,
  ONBOARDING_STATUS_LABELS,
  ONBOARDING_STATUS_STYLES,
  deriveOnboardingSummary,
  groupOnboardingTasks,
  sortOnboardingTasks,
} from '../../../lib/onboarding'
import { deriveContactMatrixSummary } from '../../../lib/contacts'
import { deriveAccessSummary } from '../../../lib/access'
import {
  deriveTransitionSummary,
  formatDateTime,
  HYPERCARE_STATUS_LABELS,
  KICKOFF_STATUS_LABELS,
} from '../../../lib/transition'

const supabase = createClient()

function fmtDate(date) {
  if (!date) return 'No due date'
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
      className="ticket-platform"
      style={{
        background: style.bg,
        color: style.color,
      }}
    >
      {ONBOARDING_STATUS_LABELS[status] || status}
    </span>
  )
}

export default function PortalOnboardingPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [org, setOrg] = useState(null)
  const [tasks, setTasks] = useState([])
  const [contacts, setContacts] = useState([])
  const [accessRows, setAccessRows] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('id', user.id)
        .single()

      if (!profileData) {
        setLoading(false)
        return
      }

      setProfile(profileData)
      setOrg(profileData.organizations)

      const [{ data: taskRows }, { data: contactRows }, { data: accessData }] = await Promise.all([
        supabase
          .from('onboarding_tasks')
          .select('*')
          .eq('organization_id', profileData.organization_id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('organization_contacts')
          .select('*')
          .eq('organization_id', profileData.organization_id)
          .order('created_at', { ascending: true }),
        supabase
          .from('organization_access_requests')
          .select('*')
          .eq('organization_id', profileData.organization_id)
          .order('created_at', { ascending: false }),
      ])

      setTasks(sortOnboardingTasks(taskRows || []))
      setContacts(contactRows || [])
      setAccessRows(accessData || [])
    } catch (err) {
      console.error('Portal onboarding load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const grouped = useMemo(() => groupOnboardingTasks(tasks), [tasks])
  const summary = useMemo(() => deriveOnboardingSummary(tasks), [tasks])
  const blockers = useMemo(
    () => tasks.filter((task) => task.status === 'blocked' && task.blocker_reason),
    [tasks]
  )

  const discoveryCompleted = !!org?.discovery_completed
  const discoveryReviewed = org?.discovery_review_status === 'reviewed'
  const contactSummary = useMemo(() => deriveContactMatrixSummary(contacts), [contacts])
  const accessSummary = useMemo(() => deriveAccessSummary(accessRows), [accessRows])
  const transition = useMemo(() => deriveTransitionSummary(org || {}), [org])

  if (loading) {
    return <div className="portal-page-loading">Loading onboarding checklist...</div>
  }

  return (
    <div>
      <div className="portal-page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Onboarding</h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem' }}>
          Track what your team needs to provide and what Kocre IT is completing before full support goes live.
        </p>
      </div>

      <div className="dashboard-stats" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-value">{summary.percent}%</div>
          <div className="stat-card-label">Checklist complete</div>
          <div className="stat-card-bar">
            <div className="stat-card-bar-fill" style={{ width: `${summary.percent}%` }} />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{summary.done}</div>
          <div className="stat-card-label">Completed tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: summary.blocked ? '#b42318' : 'var(--ink)' }}>
            {summary.blocked}
          </div>
          <div className="stat-card-label">Blocked tasks</div>
        </div>
        <div className="stat-card">
          <div
            className="stat-card-value"
            style={{ color: discoveryReviewed ? '#067647' : discoveryCompleted ? '#1d4ed8' : '#b54708' }}
          >
            {discoveryReviewed ? 'Reviewed' : discoveryCompleted ? 'Submitted' : 'Incomplete'}
          </div>
          <div className="stat-card-label">Discovery profile</div>
        </div>
      </div>

      <div className="dashboard-stats" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-value">{contactSummary.total}</div>
          <div className="stat-card-label">Contacts listed</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: contactSummary.hasPrimary ? '#067647' : '#b54708' }}>
            {contactSummary.hasPrimary ? 'Present' : 'Missing'}
          </div>
          <div className="stat-card-label">Primary contact</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{accessSummary.total}</div>
          <div className="stat-card-label">Access items</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: accessSummary.needsFollowup ? '#b42318' : 'var(--ink)' }}>
            {accessSummary.needsFollowup}
          </div>
          <div className="stat-card-label">Access follow-up</div>
        </div>
      </div>

      <div className="dashboard-section" style={{ marginBottom: 20 }}>
        <div className="dashboard-section-header">
          <h2>Kickoff and launch plan</h2>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-card-value" style={{ fontSize: '1rem' }}>
              {KICKOFF_STATUS_LABELS[org?.kickoff_status || 'not_scheduled']}
            </div>
            <div className="stat-card-label">Kickoff</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ fontSize: '1rem' }}>
              {transition.activated ? 'Live' : 'Pending'}
            </div>
            <div className="stat-card-label">Support activation</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ fontSize: '1rem' }}>
              {HYPERCARE_STATUS_LABELS[org?.hypercare_status || 'not_started']}
            </div>
            <div className="stat-card-label">Hypercare</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-value" style={{ fontSize: '1rem' }}>
              {transition.stageLabel}
            </div>
            <div className="stat-card-label">Current transition stage</div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
          <div className="admin-table-muted">
            <strong style={{ color: '#111827' }}>Kickoff scheduled:</strong>{' '}
            {formatDateTime(org?.kickoff_scheduled_for)}
          </div>
          <div className="admin-table-muted">
            <strong style={{ color: '#111827' }}>Kickoff completed:</strong>{' '}
            {formatDateTime(org?.kickoff_completed_at)}
          </div>
          <div className="admin-table-muted">
            <strong style={{ color: '#111827' }}>Support activated:</strong>{' '}
            {formatDateTime(org?.support_activated_at)}
          </div>
          <div className="admin-table-muted">
            <strong style={{ color: '#111827' }}>Hypercare start:</strong>{' '}
            {formatDateTime(org?.hypercare_start_at)}
          </div>
          <div className="admin-table-muted">
            <strong style={{ color: '#111827' }}>Hypercare end:</strong>{' '}
            {formatDateTime(org?.hypercare_end_at)}
          </div>
          <div className="admin-table-muted">
            <strong style={{ color: '#111827' }}>First review scheduled:</strong>{' '}
            {formatDateTime(org?.first_review_scheduled_for)}
          </div>
        </div>

        {org?.onboarding_handoff_notes ? (
          <div
            style={{
              marginTop: 14,
              background: '#fafaf8',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '14px 16px',
              color: 'var(--ink-muted)',
              fontSize: '0.88rem',
            }}
          >
            <strong style={{ color: '#111827' }}>Handoff notes:</strong> {org.onboarding_handoff_notes}
          </div>
        ) : null}
      </div>

      <div className="dashboard-section" style={{ marginBottom: 20 }}>
        <div className="dashboard-section-header">
          <h2>Onboarding overview</h2>
        </div>

        <div className="dashboard-empty" style={{ textAlign: 'left' }}>
          <p>
            Onboarding is a short setup project that prepares your account for reliable support. The checklist below shows which items are waiting on your team and which items Kocre IT is handling internally.
          </p>
          <p style={{ marginTop: 10 }}>
            Full support begins after contacts, discovery, access, documents, and readiness review are complete.
          </p>
        </div>

        <div className="dashboard-actions" style={{ marginTop: 16 }}>
          <Link href="/portal/contacts" className="action-card">
            <span className="action-icon">👥</span>Update contact matrix
          </Link>
          <Link href="/portal/access" className="action-card">
            <span className="action-icon">🔐</span>Submit access items
          </Link>
          <Link href="/portal/settings" className="action-card">
            <span className="action-icon">🧾</span>Complete discovery questionnaire
          </Link>
        </div>
      </div>

      {!contactSummary.hasPrimary && (
        <div className="dashboard-section" style={{ marginBottom: 20 }}>
          <div className="dashboard-section-header">
            <h2>Contact matrix needed</h2>
          </div>
          <div className="dashboard-empty" style={{ textAlign: 'left' }}>
            <p>Kocre IT still needs your primary support contact and escalation contacts before onboarding can be fully validated.</p>
          </div>
        </div>
      )}

      {!discoveryCompleted && (
        <div className="dashboard-section" style={{ marginBottom: 20 }}>
          <div className="dashboard-section-header">
            <h2>Discovery questionnaire needed</h2>
          </div>
          <div className="dashboard-empty" style={{ textAlign: 'left' }}>
            <p>Kocre IT still needs your structured environment details before support can be fully validated.</p>
          </div>
        </div>
      )}

      {accessSummary.total === 0 && (
        <div className="dashboard-section" style={{ marginBottom: 20 }}>
          <div className="dashboard-section-header">
            <h2>Access items needed</h2>
          </div>
          <div className="dashboard-empty" style={{ textAlign: 'left' }}>
            <p>Kocre IT still needs your platform access details before support reach can be validated.</p>
          </div>
        </div>
      )}

      {blockers.length > 0 && (
        <div className="dashboard-section" style={{ marginBottom: 20 }}>
          <div className="dashboard-section-header">
            <h2>Current blockers</h2>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {blockers.map((task) => (
              <div
                key={task.id}
                style={{
                  background: '#fff5f5',
                  border: '1px solid #fecaca',
                  borderRadius: 12,
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontWeight: 600, color: '#7f1d1d' }}>{task.title}</div>
                <div style={{ marginTop: 6, color: '#991b1b', fontSize: '0.88rem' }}>
                  {task.blocker_reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2>Checklist</h2>
          </div>
          <div className="dashboard-empty" style={{ textAlign: 'left' }}>
            <p>Your onboarding checklist has not been initialized yet. Kocre IT will set it up as part of your onboarding project.</p>
          </div>
        </div>
      ) : (
        Object.entries(grouped).map(([phase, phaseTasks]) => (
          <div key={phase} className="dashboard-section" style={{ marginBottom: 20 }}>
            <div className="dashboard-section-header">
              <h2>{ONBOARDING_PHASE_LABELS[phase] || phase}</h2>
              <span className="ticket-platform">
                {phaseTasks.filter((task) => task.status === 'done').length}/{phaseTasks.length} complete
              </span>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              {phaseTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    background: 'white',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '14px 16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{task.title}</div>
                      <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className="ticket-platform">
                          Owner: {ONBOARDING_OWNER_LABELS[task.owner_type] || task.owner_type}
                        </span>
                        <span className="ticket-platform">Due: {fmtDate(task.due_date)}</span>
                      </div>

                      {task.notes ? (
                        <div style={{ marginTop: 8, color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
                          {task.notes}
                        </div>
                      ) : null}

                      {task.status === 'blocked' && task.blocker_reason ? (
                        <div
                          style={{
                            marginTop: 10,
                            background: '#fff5f5',
                            border: '1px solid #fecaca',
                            color: '#991b1b',
                            padding: '10px 12px',
                            borderRadius: 8,
                            fontSize: '0.86rem',
                          }}
                        >
                          {task.blocker_reason}
                        </div>
                      ) : null}
                    </div>

                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {org?.support_ready ? (
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2>Support launch status</h2>
          </div>
          <div className="dashboard-empty" style={{ textAlign: 'left' }}>
            <p>Your account is marked support-ready. You can continue using the portal for tickets, documents, and account updates.</p>
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 10, color: 'var(--ink-muted)', fontSize: '0.82rem' }}>
        Viewing as {profile?.full_name || 'Client User'}.
      </div>
    </div>
  )
}
