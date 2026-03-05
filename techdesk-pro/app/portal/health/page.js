// File: app/portal/health/page.js (new — mkdir -p app/portal/health)

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase/client'

export default function HealthPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [overallStatus, setOverallStatus] = useState('healthy')
  const supabase = createClient()

  useEffect(() => {
    loadHealth()
  }, [])

  async function loadHealth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) return

    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .eq('resource_type', 'sentinel_check')
      .order('created_at', { ascending: false })
      .limit(50)

    const items = data || []
    setEvents(items)

    // Determine overall status from latest checks
    if (items.length > 0) {
      const latest = items[0].created_at
      const cutoff = new Date(new Date(latest).getTime() - 5 * 60 * 1000).toISOString()
      const recentChecks = items.filter(e => e.created_at >= cutoff)
      const hasCritical = recentChecks.some(e => e.metadata?.severity === 'critical')
      const hasWarning = recentChecks.some(e => e.metadata?.severity === 'warning')
      setOverallStatus(hasCritical ? 'critical' : hasWarning ? 'warning' : 'healthy')
    }

    setLoading(false)
  }

  const statusConfig = {
    healthy: { icon: '✅', label: 'All Systems Operational', color: '#27ae60', bg: '#ecfdf5' },
    warning: { icon: '⚠️', label: 'Minor Issues Detected', color: '#f39c12', bg: '#fffdf5' },
    critical: { icon: '🚨', label: 'Issues Detected', color: '#e74c3c', bg: '#fff5f5' },
  }

  const config = statusConfig[overallStatus]

  const severityIcon = (severity) => {
    const icons = { info: '✅', warning: '⚠️', critical: '🚨' }
    return icons[severity] || '📋'
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    })
  }

  if (loading) {
    return <div style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: 60 }}>Loading health status...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: '1.3rem' }}>🛡️</span>
          <h1 style={{ fontSize: '1.6rem', margin: 0 }}>System Health</h1>
        </div>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem' }}>
          Sentinel AI monitors your services around the clock.
        </p>
      </div>

      {/* Overall status banner */}
      <div style={{
        background: config.bg, border: `1px solid ${config.color}30`,
        borderRadius: 12, padding: '20px 24px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <span style={{ fontSize: '1.5rem' }}>{config.icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: config.color }}>{config.label}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: 2 }}>
            Last checked: {events.length > 0 ? formatTime(events[0].created_at) : 'Never'}
          </div>
        </div>
      </div>

      {/* Events log */}
      {events.length === 0 ? (
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 12,
          padding: 40, textAlign: 'center'
        }}>
          <p style={{ color: 'var(--ink-muted)' }}>
            No monitoring data yet. Sentinel AI will begin monitoring your services automatically.
          </p>
        </div>
      ) : (
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 12,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px 20px', borderBottom: '1px solid var(--border)',
            fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em'
          }}>
            Recent Checks
          </div>
          {events.map((event, i) => {
            const meta = event.metadata || {}
            return (
              <div
                key={event.id || i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px',
                  borderBottom: i < events.length - 1 ? '1px solid #f0ede8' : 'none',
                }}
              >
                <span style={{ fontSize: '1rem' }}>{severityIcon(meta.severity)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', color: 'var(--ink)', fontWeight: 500 }}>
                    {meta.message}
                  </div>
                  {meta.response_time && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                      {meta.response_time}ms response time
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                  {formatTime(event.created_at)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}