// File: app/admin/sentinel/page.js (new — mkdir -p app/admin/sentinel)

'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function SentinelDashboard() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [stats, setStats] = useState({ healthy: 0, warnings: 0, errors: 0 })
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadEvents()
  }, [filter])

  async function loadEvents() {
    setLoading(true)
    try {
      let query = supabase
        .from('activity_log')
        .select('*, organization:organizations(name)')
        .eq('resource_type', 'sentinel_check')
        .order('created_at', { ascending: false })
        .limit(100)

      if (filter !== 'all') {
        query = query.eq('metadata->>severity', filter)
      }

      const { data } = await query
      const items = data || []
      setEvents(items)

      // Calculate stats from latest checks only (last run)
      const latestRun = items.length > 0 ? items[0].created_at : null
      if (latestRun) {
        const cutoff = new Date(new Date(latestRun).getTime() - 5 * 60 * 1000).toISOString()
        const latest = items.filter(e => e.created_at >= cutoff)
        setStats({
          healthy: latest.filter(e => e.metadata?.severity === 'info').length,
          warnings: latest.filter(e => e.metadata?.severity === 'warning').length,
          errors: latest.filter(e => e.metadata?.severity === 'critical').length,
        })
      }
    } catch (err) {
      console.error('Error loading events:', err)
    } finally {
      setLoading(false)
    }
  }

  async function runManualCheck() {
    setRunning(true)
    try {
      const res = await fetch('/api/ai/sentinel')
      const data = await res.json()
      console.log('Sentinel result:', data)
      loadEvents()
    } catch (err) {
      console.error('Manual check error:', err)
    } finally {
      setRunning(false)
    }
  }

  const severityColor = (severity) => {
    const colors = { info: '#27ae60', warning: '#f39c12', critical: '#e74c3c' }
    return colors[severity] || '#8a8a8a'
  }

  const severityIcon = (severity) => {
    const icons = { info: '✅', warning: '⚠️', critical: '🚨' }
    return icons[severity] || '📋'
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    })
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: '1.4rem' }}>🛡️</span>
            <h1 className="admin-page-title">Sentinel AI</h1>
          </div>
          <p className="admin-page-desc">Proactive monitoring &amp; auto-healing</p>
        </div>
        <button
          onClick={runManualCheck}
          disabled={running}
          style={{
            padding: '10px 20px', borderRadius: 8,
            background: running ? '#f0f2f5' : 'var(--teal)', color: running ? '#8a8a8a' : 'white',
            border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            fontFamily: 'Outfit, sans-serif'
          }}
        >
          {running ? '⏳ Running...' : '▶ Run Check Now'}
        </button>
      </div>

      {/* Status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="admin-stat-card accent-green">
          <div className="admin-stat-label">Healthy</div>
          <div className="admin-stat-value" style={{ color: '#27ae60' }}>{stats.healthy}</div>
        </div>
        <div className="admin-stat-card accent-yellow">
          <div className="admin-stat-label">Warnings</div>
          <div className="admin-stat-value" style={{ color: '#f39c12' }}>{stats.warnings}</div>
        </div>
        <div className="admin-stat-card accent-red">
          <div className="admin-stat-label">Critical</div>
          <div className="admin-stat-value" style={{ color: '#e74c3c' }}>{stats.errors}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="admin-filter-select"
        >
          <option value="all">All Events</option>
          <option value="critical">Critical Only</option>
          <option value="warning">Warnings Only</option>
          <option value="info">Healthy Only</option>
        </select>
      </div>

      {/* Events list */}
      <div className="admin-card" style={{ padding: 0 }}>
        {loading ? (
          <div className="admin-loading" style={{ padding: 40 }}>Loading events...</div>
        ) : events.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <p className="admin-empty-text">No monitoring events yet</p>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.85rem', marginTop: 8 }}>
              Click "Run Check Now" to run your first health check, or wait for the hourly cron job.
            </p>
          </div>
        ) : (
          <div>
            {events.map((event, i) => {
              const meta = event.metadata || {}
              return (
                <div
                  key={event.id || i}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '14px 20px',
                    borderBottom: i < events.length - 1 ? '1px solid #f0ede8' : 'none',
                    background: meta.severity === 'critical' ? '#fff5f5' : meta.severity === 'warning' ? '#fffdf5' : 'transparent',
                  }}
                >
                  <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: 2 }}>
                    {severityIcon(meta.severity)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink)' }}>
                        {event.organization?.name || 'System'}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 100, fontSize: '0.68rem', fontWeight: 700,
                        background: severityColor(meta.severity) + '18', color: severityColor(meta.severity),
                        textTransform: 'uppercase'
                      }}>
                        {meta.severity}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 600,
                        background: '#f0f2f5', color: '#4a4a4a', textTransform: 'uppercase'
                      }}>
                        {meta.type}
                      </span>
                      {meta.auto_healed && (
                        <span style={{
                          padding: '2px 8px', borderRadius: 100, fontSize: '0.68rem', fontWeight: 700,
                          background: '#0D7C6618', color: '#0D7C66'
                        }}>
                          AUTO-HEALED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--ink-light)', lineHeight: 1.5 }}>
                      {meta.message}
                    </div>
                    {meta.response_time && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                        Response: {meta.response_time}ms
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {formatTime(event.created_at)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}