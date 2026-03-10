'use client'

import { Fragment, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

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

export default function AdminAssessmentsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
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

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Free Assessments</h1>
          <p className="admin-page-desc">Track intake submissions and move them into onboarding.</p>
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        {loading ? (
          <div className="admin-loading" style={{ padding: 32 }}>Loading assessments...</div>
        ) : items.length === 0 ? (
          <div className="admin-empty-text" style={{ padding: 32 }}>No assessment submissions yet.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Contact</th>
                  <th>Team</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Ghost</th>
                  <th>Convert</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const review = reviewById[item.id]
                  const fitStyle = FIT_STYLES[review?.fit_label] || FIT_STYLES.unclear_fit
                  const flagStyle = REVIEW_FLAG_STYLES[review?.review_flag] || REVIEW_FLAG_STYLES.human_review

                  return (
                    <Fragment key={item.id}>
                      <tr>
                        <td>
                          <div className="admin-table-title">{item.business_name}</div>
                          <div className="admin-table-sub">{item.environment || 'No environment provided'}</div>
                        </td>
                        <td className="admin-table-muted">
                          {item.full_name}<br />{item.email}
                        </td>
                        <td className="admin-table-muted">{item.team_size_range || '—'}</td>
                        <td className="admin-table-muted">{item.urgency || '—'}</td>
                        <td>
                          <select value={item.status || 'new'} onChange={(e) => updateStatus(item.id, e.target.value)} className="admin-filter-select">
                            {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </td>
                        <td className="admin-table-muted">{new Date(item.created_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            type="button"
                            className="admin-btn-small"
                            onClick={() => runGhostReview(item.id)}
                            disabled={reviewLoadingById[item.id]}
                          >
                            {reviewLoadingById[item.id] ? 'Reviewing...' : review ? 'Refresh Review' : 'Ghost Review'}
                          </button>
                        </td>
                        <td>
                          <a href={`/signup?assessment=${item.id}&email=${encodeURIComponent(item.email || '')}&company=${encodeURIComponent(item.business_name || '')}&name=${encodeURIComponent(item.full_name || '')}`} className="admin-btn-small">
                            Open Signup
                          </a>
                        </td>
                      </tr>

                      {review && (
                        <tr>
                          <td colSpan={8} style={{ background: '#fafaf8' }}>
                            <div style={{ padding: '16px 20px', display: 'grid', gap: 12 }}>
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

                                <span className="admin-status-badge" style={{ background: '#f0f2f5', color: '#4a4a4a' }}>
                                  Urgency: {review.urgency_signal}
                                </span>

                                <span className="admin-status-badge" style={{ background: '#e8f5f0', color: '#0D7C66' }}>
                                  {review.onboarding_readiness}
                                </span>
                              </div>

                              <div className="admin-table-muted" style={{ lineHeight: 1.7 }}>
                                <strong style={{ color: '#111827' }}>Ghost summary:</strong> {review.qualification_summary}
                              </div>

                              <div className="admin-table-muted" style={{ lineHeight: 1.7 }}>
                                <strong style={{ color: '#111827' }}>Recommended next action:</strong> {review.recommended_next_action}
                              </div>

                              <div className="admin-table-muted" style={{ lineHeight: 1.7 }}>
                                <strong style={{ color: '#111827' }}>Suggested status:</strong> {review.recommended_status}
                              </div>

                              <div
                                style={{
                                  padding: '10px 12px',
                                  borderRadius: 8,
                                  border: '1px solid #f8d4d4',
                                  background: '#fff5f5',
                                  color: '#b42318',
                                  fontSize: '0.86rem',
                                }}
                              >
                                <strong>Operator warning:</strong> {review.operator_warning}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
