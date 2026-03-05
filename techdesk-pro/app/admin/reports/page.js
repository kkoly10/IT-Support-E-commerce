// File: app/admin/reports/page.js (new — mkdir -p app/admin/reports)

'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AdminReports() {
  const [orgs, setOrgs] = useState([])
  const [ratings, setRatings] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(null)
  const [reportData, setReportData] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [orgRes, ratingRes, reportRes] = await Promise.all([
      supabase.from('organizations').select('id, name, plan'),
      supabase.from('ticket_ratings').select('*, organization:organizations(name), user:profiles!ticket_ratings_rated_by_fkey(full_name)').order('created_at', { ascending: false }).limit(50),
      supabase.from('monthly_reports').select('*, organization:organizations(name)').order('report_month', { ascending: false }).limit(20),
    ])

    setOrgs(orgRes.data || [])
    setRatings(ratingRes.data || [])
    setReports(reportRes.data || [])
    setLoading(false)
  }

  async function generateReport(orgId) {
    setGenerating(orgId)
    setReportData(null)
    try {
      const res = await fetch('/api/ai/auto-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId }),
      })
      const data = await res.json()
      if (data.organization) {
        setReportData(data)
        loadData()
      }
    } catch (err) {
      console.error('Report error:', err)
    } finally {
      setGenerating(null)
    }
  }

  // CSAT stats
  const totalRatings = ratings.length
  const avgCSAT = totalRatings > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
    : '—'
  const fiveStars = ratings.filter(r => r.rating === 5).length
  const distribution = [1, 2, 3, 4, 5].map(n => ({
    star: n,
    count: ratings.filter(r => r.rating === n).length,
    pct: totalRatings > 0 ? Math.round((ratings.filter(r => r.rating === n).length / totalRatings) * 100) : 0,
  }))

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  if (loading) return <div className="admin-loading">Loading reports...</div>

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: '1.4rem' }}>📈</span>
            <h1 className="admin-page-title">Reports & Satisfaction</h1>
          </div>
          <p className="admin-page-desc">Client satisfaction scores and monthly report generation</p>
        </div>
      </div>

      {/* CSAT Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Avg CSAT Score</div>
          <div className="admin-stat-value" style={{ color: 'var(--teal)' }}>{avgCSAT}<span style={{ fontSize: '1rem', color: 'var(--ink-muted)' }}>/5</span></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Ratings</div>
          <div className="admin-stat-value">{totalRatings}</div>
        </div>
        <div className="admin-stat-card accent-green">
          <div className="admin-stat-label">5-Star Ratings</div>
          <div className="admin-stat-value">{fiveStars}</div>
        </div>
      </div>

      <div className="admin-grid-2col">
        {/* Rating distribution */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Rating Distribution</h3>
          </div>
          {distribution.reverse().map((d) => (
            <div key={d.star} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, width: 20, textAlign: 'right', color: 'var(--ink)' }}>{d.star}</span>
              <span style={{ fontSize: '0.85rem' }}>⭐</span>
              <div style={{ flex: 1, height: 8, background: '#f0ede8', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${d.pct}%`, background: '#f39c12', borderRadius: 100, transition: 'width 0.5s' }} />
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', width: 30, textAlign: 'right' }}>{d.count}</span>
            </div>
          ))}
        </div>

        {/* Generate report */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Generate Monthly Report</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {orgs.map((org) => (
              <div key={org.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: '1px solid #f0ede8',
              }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{org.name}</span>
                <button
                  onClick={() => generateReport(org.id)}
                  disabled={generating === org.id}
                  style={{
                    padding: '6px 14px', borderRadius: 6,
                    background: generating === org.id ? '#f0f2f5' : 'var(--teal)',
                    color: generating === org.id ? '#8a8a8a' : 'white',
                    border: 'none', fontSize: '0.78rem', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  {generating === org.id ? 'Generating...' : 'Generate'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generated report preview */}
      {reportData && (
        <div className="admin-card" style={{ marginTop: 20 }}>
          <div className="admin-card-header">
            <h3>📊 Report: {reportData.organization} — {reportData.report_month}</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#f8f9fa', padding: 14, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)' }}>{reportData.summary.total_tickets}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Total Tickets</div>
            </div>
            <div style={{ background: '#f8f9fa', padding: 14, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#27ae60' }}>{reportData.summary.resolved}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>Resolved</div>
            </div>
            <div style={{ background: '#f8f9fa', padding: 14, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--teal)' }}>{reportData.summary.sla_compliance}%</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>SLA Compliance</div>
            </div>
            <div style={{ background: '#f8f9fa', padding: 14, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f39c12' }}>{reportData.summary.satisfaction_rating || '—'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>CSAT Score</div>
            </div>
          </div>

          {reportData.recommendations?.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                AI Recommendations
              </h4>
              {reportData.recommendations.map((rec, i) => (
                <div key={i} style={{
                  padding: '8px 12px', background: '#e8f5f0', borderRadius: 6,
                  marginBottom: 6, fontSize: '0.88rem', color: 'var(--ink-light)',
                  display: 'flex', gap: 8,
                }}>
                  <span style={{ color: 'var(--teal)' }}>💡</span> {rec}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent ratings */}
      <div className="admin-card" style={{ padding: 0, marginTop: 20 }}>
        <div className="admin-card-header" style={{ padding: '16px 20px' }}>
          <h3>Recent Ratings</h3>
        </div>
        {ratings.length === 0 ? (
          <div className="admin-empty-text" style={{ padding: 30 }}>No ratings yet</div>
        ) : (
          <div>
            {ratings.slice(0, 15).map((r, i) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 20px',
                borderBottom: i < Math.min(ratings.length, 15) - 1 ? '1px solid #f0ede8' : 'none',
              }}>
                <span style={{ fontSize: '1rem' }}>{'⭐'.repeat(r.rating)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)' }}>
                    {r.user?.full_name || 'Unknown'} — {r.organization?.name}
                  </div>
                  {r.comment && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: 2 }}>
                      &ldquo;{r.comment}&rdquo;
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{formatDate(r.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}