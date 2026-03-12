'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  buildOperatorTalkTrack,
  deriveRecommendedPlan,
} from '../../../lib/assessment-commercial'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'converted', 'archived']

const FIT_STYLES = {
  strong_fit: { bg: '#ecfdf3', color: '#067647', label: 'Strong Fit' },
  possible_fit: { bg: '#fffaeb', color: '#b54708', label: 'Possible Fit' },
  unclear_fit: { bg: '#fef3f2', color: '#b42318', label: 'Unclear Fit' },
  poor_fit: { bg: '#fef2f2', color: '#b91c1c', label: 'Poor Fit' },
}

const REVIEW_FLAG_STYLES = {
  none: { bg: '#ecfdf3', color: '#067647', label: 'No Flag' },
  human_review: { bg: '#fef3f2', color: '#b42318', label: 'Needs Human Review' },
  scope_watch: { bg: '#fffaeb', color: '#b54708', label: 'Watch Scope' },
}

function urgencyStyles(value = '') {
  const urgency = String(value).toLowerCase()
  if (urgency.includes('urgent')) return { bg: '#fef2f2', color: '#b91c1c' }
  if (urgency.includes('soon')) return { bg: '#fff7ed', color: '#b45309' }
  return { bg: '#eef4ff', color: '#1d4ed8' }
}

export default function AdminAssessmentsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [reviewById, setReviewById] = useState({})
  const [reviewLoadingById, setReviewLoadingById] = useState({})

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    setLoading(true)
    const { data, error } = await supabase
      .from('assessment_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setItems(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    await supabase.from('assessment_submissions').update({ status }).eq('id', id)
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
  }

  async function runGhostReview(itemId) {
    setReviewLoadingById((prev) => ({ ...prev, [itemId]: true }))
    try {
      const response = await fetch('/api/ai/ghost-assessment-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: itemId }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ghost review failed')

      setReviewById((prev) => ({ ...prev, [itemId]: data.review }))
    } catch (err) {
      console.error('Ghost assessment review error:', err)
      alert(err.message || 'Failed to run Ghost review')
    } finally {
      setReviewLoadingById((prev) => ({ ...prev, [itemId]: false }))
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return items.filter((item) => {
      if (statusFilter !== 'all' && (item.status || 'new') !== statusFilter) return false
      if (!q) return true

      const blob = [
        item.business_name,
        item.full_name,
        item.email,
        item.team_size_range,
        item.current_tools,
        item.environment,
        item.pain_points,
        item.urgency,
      ]
        .join(' ')
        .toLowerCase()

      return blob.includes(q)
    })
  }, [items, search, statusFilter])

  const stats = useMemo(() => {
    return {
      total: items.length,
      fresh: items.filter((item) => (item.status || 'new') === 'new').length,
      qualified: items.filter((item) => item.status === 'qualified').length,
      converted: items.filter((item) => item.status === 'converted').length,
    }
  }, [items])

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Free Assessments</h1>
          <p className="admin-page-desc">
            Review fit, guide commercial next steps, and move good leads into signup and onboarding.
          </p>
        </div>
      </div>

      <div className="admin-stats-row" style={{ marginBottom: 18 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total submissions</div>
          <div className="admin-stat-value">{stats.total}</div>
        </div>
        <div className="admin-stat-card accent-yellow">
          <div className="admin-stat-label">New</div>
          <div className="admin-stat-value">{stats.fresh}</div>
        </div>
        <div className="admin-stat-card accent-green">
          <div className="admin-stat-label">Qualified</div>
          <div className="admin-stat-value">{stats.qualified}</div>
        </div>
        <div className="admin-stat-card accent-teal">
          <div className="admin-stat-label">Converted</div>
          <div className="admin-stat-value">{stats.converted}</div>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 18 }}>
        <div className="admin-filters" style={{ marginTop: 0 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search business, contact, environment, or pain point..."
            className="admin-search-input"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-filter-select"
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading assessments...</div>
      ) : filtered.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty-text">No assessment submissions match these filters.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 18 }}>
          {filtered.map((item) => {
            const review = reviewById[item.id]
            const fitStyle = FIT_STYLES[review?.fit_label] || FIT_STYLES.unclear_fit
            const flagStyle = REVIEW_FLAG_STYLES[review?.review_flag] || REVIEW_FLAG_STYLES.human_review
            const urgencyStyle = urgencyStyles(item.urgency)
            const plan = deriveRecommendedPlan(item, review || {})
            const talkTrack = buildOperatorTalkTrack(item, review || {})

            return (
              <div key={item.id} className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h3 style={{ marginBottom: 6 }}>{item.business_name}</h3>
                    <div className="admin-table-sub">
                      {item.full_name} · {item.email} · Submitted{' '}
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      className="admin-status-badge"
                      style={{ background: urgencyStyle.bg, color: urgencyStyle.color }}
                    >
                      Urgency: {item.urgency || '—'}
                    </span>

                    <select
                      value={item.status || 'new'}
                      onChange={(e) => updateStatus(item.id, e.target.value)}
                      className="admin-filter-select"
                      style={{ minWidth: 140 }}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.1fr 0.9fr',
                    gap: 18,
                    alignItems: 'start',
                  }}
                >
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div className="admin-table-muted">
                      <strong style={{ color: '#111827' }}>Team size:</strong> {item.team_size_range || '—'}
                    </div>

                    <div className="admin-table-muted">
                      <strong style={{ color: '#111827' }}>Current tools:</strong>{' '}
                      {item.current_tools || '—'}
                    </div>

                    <div className="admin-table-muted">
                      <strong style={{ color: '#111827' }}>Environment:</strong>{' '}
                      {item.environment || '—'}
                    </div>

                    <div className="admin-table-muted">
                      <strong style={{ color: '#111827' }}>Pain points:</strong>{' '}
                      {item.pain_points || '—'}
                    </div>

                    <div className="admin-table-muted">
                      <strong style={{ color: '#111827' }}>Internal IT:</strong>{' '}
                      {item.has_internal_it || 'unknown'}
                    </div>

                    {item.notes ? (
                      <div className="admin-table-muted">
                        <strong style={{ color: '#111827' }}>Extra notes:</strong> {item.notes}
                      </div>
                    ) : null}
                  </div>

                  <div
                    style={{
                      background: '#fafaf8',
                      border: '1px solid var(--border)',
                      borderRadius: 14,
                      padding: 16,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 12 }}>Commercial next step</div>

                    <div className="admin-table-muted" style={{ lineHeight: 1.7 }}>
                      <strong style={{ color: '#111827' }}>Recommended path:</strong> {plan.name}
                    </div>

                    <div className="admin-table-muted" style={{ lineHeight: 1.7, marginTop: 8 }}>
                      <strong style={{ color: '#111827' }}>Why:</strong> {plan.commercialReason}
                    </div>

                    <div className="admin-table-muted" style={{ lineHeight: 1.7, marginTop: 8 }}>
                      <strong style={{ color: '#111827' }}>Path:</strong> {plan.path}
                    </div>

                    <div className="admin-table-muted" style={{ lineHeight: 1.7, marginTop: 8 }}>
                      <strong style={{ color: '#111827' }}>Follow-up window:</strong>{' '}
                      {plan.responseWindow === 'same_day'
                        ? 'Same business day'
                        : plan.responseWindow === 'one_business_day'
                        ? 'Within 1 business day'
                        : 'Within 2 business days'}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                      <button
                        type="button"
                        className="admin-btn-small"
                        onClick={() => runGhostReview(item.id)}
                        disabled={reviewLoadingById[item.id]}
                      >
                        {reviewLoadingById[item.id]
                          ? 'Reviewing...'
                          : review
                          ? 'Refresh Ghost Review'
                          : 'Run Ghost Review'}
                      </button>

                      {review?.recommended_status ? (
                        <button
                          type="button"
                          className="admin-btn-small"
                          onClick={() => updateStatus(item.id, review.recommended_status)}
                        >
                          Apply Suggested Status
                        </button>
                      ) : null}

                      <a
                        href={`/signup?assessment=${item.id}&email=${encodeURIComponent(
                          item.email || ''
                        )}&company=${encodeURIComponent(
                          item.business_name || ''
                        )}&name=${encodeURIComponent(item.full_name || '')}`}
                        className="admin-btn-small"
                      >
                        Open Signup
                      </a>
                    </div>
                  </div>
                </div>

                {review ? (
                  <div
                    style={{
                      marginTop: 18,
                      paddingTop: 16,
                      borderTop: '1px solid var(--border)',
                      display: 'grid',
                      gap: 14,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        className="admin-status-badge"
                        style={{ background: fitStyle.bg, color: fitStyle.color }}
                      >
                        {fitStyle.label} · {review.fit_score}/100
                      </span>

                      <span
                        className="admin-status-badge"
                        style={{ background: flagStyle.bg, color: flagStyle.color }}
                      >
                        {flagStyle.label}
                      </span>

                      <span
                        className="admin-status-badge"
                        style={{ background: '#eef4ff', color: '#1d4ed8' }}
                      >
                        Onboarding: {review.onboarding_readiness}
                      </span>

                      <span
                        className="admin-status-badge"
                        style={{ background: '#f3f4f6', color: '#4b5563' }}
                      >
                        Suggested status: {review.recommended_status}
                      </span>
                    </div>

                    <div className="admin-table-muted" style={{ lineHeight: 1.75 }}>
                      <strong style={{ color: '#111827' }}>Ghost summary:</strong>{' '}
                      {review.qualification_summary}
                    </div>

                    <div className="admin-table-muted" style={{ lineHeight: 1.75 }}>
                      <strong style={{ color: '#111827' }}>Recommended next action:</strong>{' '}
                      {review.recommended_next_action}
                    </div>

                    <div className="admin-table-muted" style={{ lineHeight: 1.75 }}>
                      <strong style={{ color: '#111827' }}>Operator warning:</strong>{' '}
                      {review.operator_warning}
                    </div>

                    <div>
                      <div
                        className="admin-card-section-title"
                        style={{ display: 'block', marginBottom: 8 }}
                      >
                        Suggested operator talk track
                      </div>
                      <textarea
                        readOnly
                        value={talkTrack}
                        rows={5}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          fontSize: '0.86rem',
                          fontFamily: 'Outfit, sans-serif',
                          resize: 'vertical',
                          background: '#fff',
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}