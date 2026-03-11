'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  ACCESS_METHOD_LABELS,
  ACCESS_STATUS_LABELS,
  ACCESS_STATUS_STYLES,
  deriveAccessSummary,
} from '../../../lib/access'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AdminAccessPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadRows()
  }, [])

  async function loadRows() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('organization_access_requests')
        .select(`
          *,
          organization:organizations(id, name, client_status, onboarding_status)
        `)
        .order('created_at', { ascending: false })

      setRows(data || [])
    } catch (err) {
      console.error('Admin access load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id, status) {
    try {
      const { error } = await supabase
        .from('organization_access_requests')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)))
    } catch (err) {
      console.error('Access status update error:', err)
      alert(err.message || 'Failed to update access status')
    }
  }

  async function updateAdminNotes(id, adminNotes) {
    try {
      const { error } = await supabase
        .from('organization_access_requests')
        .update({ admin_notes: adminNotes || null })
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      console.error('Access notes update error:', err)
      alert(err.message || 'Failed to save admin notes')
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (!q) return true

      const blob = [
        row.platform_name,
        row.requested_role,
        row.access_method,
        row.client_notes,
        row.admin_notes,
        row.organization?.name,
      ]
        .join(' ')
        .toLowerCase()

      return blob.includes(q)
    })
  }, [rows, search, statusFilter])

  const summary = useMemo(() => deriveAccessSummary(rows), [rows])

  if (loading) {
    return <div className="admin-loading">Loading access workflow...</div>
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Access</h1>
          <p className="admin-page-desc">
            Review, approve, and follow up on client access items for onboarding and support validation.
          </p>
        </div>
      </div>

      <div className="admin-stats-row" style={{ marginBottom: 18 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total</div>
          <div className="admin-stat-value">{summary.total}</div>
        </div>
        <div className="admin-stat-card accent-teal">
          <div className="admin-stat-label">Submitted</div>
          <div className="admin-stat-value">{summary.submitted}</div>
        </div>
        <div className="admin-stat-card accent-yellow">
          <div className="admin-stat-label">Under Review</div>
          <div className="admin-stat-value">{summary.underReview}</div>
        </div>
        <div className="admin-stat-card accent-green">
          <div className="admin-stat-label">Approved</div>
          <div className="admin-stat-value">{summary.approved}</div>
        </div>
        <div className="admin-stat-card accent-red">
          <div className="admin-stat-label">Needs Follow-up</div>
          <div className="admin-stat-value">{summary.needsFollowup}</div>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 18 }}>
        <div className="admin-filters" style={{ marginTop: 0 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, platform, role, or notes..."
            className="admin-search-input"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-filter-select"
          >
            <option value="all">All statuses</option>
            <option value="requested">Requested</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="needs_followup">Needs Follow-up</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty-text">No access items found.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filtered.map((row) => {
            const style = ACCESS_STATUS_STYLES[row.status] || ACCESS_STATUS_STYLES.requested

            return (
              <div key={row.id} className="admin-card">
                <div className="admin-card-header">
                  <h3>{row.platform_name}</h3>
                  <span className="admin-status-badge" style={{ background: style.bg, color: style.color }}>
                    {ACCESS_STATUS_LABELS[row.status] || row.status}
                  </span>
                </div>

                <div className="admin-table-sub" style={{ marginBottom: 12 }}>
                  {row.organization?.name || 'Unknown client'} · {ACCESS_METHOD_LABELS[row.access_method] || row.access_method}
                  {row.requested_role ? ` · ${row.requested_role}` : ''}
                </div>

                {row.client_notes ? (
                  <div className="admin-table-muted" style={{ marginBottom: 10 }}>
                    <strong style={{ color: '#111827' }}>Client notes:</strong> {row.client_notes}
                  </div>
                ) : null}

                {row.secure_instructions ? (
                  <div className="admin-table-muted" style={{ marginBottom: 10 }}>
                    <strong style={{ color: '#111827' }}>Secure instructions:</strong> {row.secure_instructions}
                  </div>
                ) : null}

                <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' }}>
                  <div>
                    <label className="admin-card-section-title" style={{ display: 'block', marginBottom: 8 }}>
                      Status
                    </label>
                    <select
                      value={row.status || 'requested'}
                      onChange={(e) => updateStatus(row.id, e.target.value)}
                      className="admin-filter-select"
                    >
                      <option value="requested">Requested</option>
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="approved">Approved</option>
                      <option value="needs_followup">Needs Follow-up</option>
                      <option value="revoked">Revoked</option>
                    </select>
                  </div>

                  <div>
                    <label className="admin-card-section-title" style={{ display: 'block', marginBottom: 8 }}>
                      Admin notes
                    </label>
                    <textarea
                      defaultValue={row.admin_notes || ''}
                      onBlur={(e) => updateAdminNotes(row.id, e.target.value.trim())}
                      rows={4}
                      placeholder="Review notes, next steps, follow-up needed"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: '0.86rem',
                        fontFamily: 'Outfit, sans-serif',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}