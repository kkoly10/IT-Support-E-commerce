'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { deriveHealthState, getCheckTimestamp } from '../../../lib/health-status.mjs'

const supabase = createClient()

const STATUS_CONFIG = {
  loading: { icon: '…', label: 'Loading monitoring checks', color: '#475569', bg: '#f8fafc' },
  error: { icon: '⚠️', label: 'Monitoring data unavailable', color: '#b42318', bg: '#fff5f5' },
  unknown: { icon: '?', label: 'Monitoring status unknown', color: '#475569', bg: '#f8fafc' },
  stale: { icon: '◷', label: 'Monitoring data is stale', color: '#92400e', bg: '#fffbeb' },
  current: { icon: '✓', label: 'Latest recorded checks passed', color: '#166534', bg: '#ecfdf5' },
  warning: { icon: '⚠️', label: 'Latest checks reported a warning', color: '#92400e', bg: '#fffbeb' },
  critical: { icon: '!', label: 'Latest checks reported an issue', color: '#b42318', bg: '#fff5f5' },
}

export default function HealthPage() {
  const [events, setEvents] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [error, setError] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  const loadHealth = useCallback(async () => {
    setLoadState('loading')
    setError(null)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('Your sign-in could not be verified. Sign in again to view monitoring checks.')
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) throw new Error('Your workspace could not be loaded. Please try refreshing.')
      if (!profile?.organization_id) {
        throw new Error('No workspace is linked to this account. Contact Kocre IT for setup help.')
      }

      const { data, error: checksError } = await supabase
        .from('activity_log')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('resource_type', 'sentinel_check')
        .order('created_at', { ascending: false })
        .limit(50)

      if (checksError) throw new Error('Monitoring checks could not be loaded. Please try refreshing.')

      setEvents(data || [])
      setLoadState('loaded')
    } catch (err) {
      setError(err.message || 'Monitoring checks could not be loaded. Please try refreshing.')
      setLoadState('error')
    } finally {
      setNow(Date.now())
    }
  }, [])

  useEffect(() => {
    loadHealth()
  }, [loadHealth])

  // A page left open must age into a stale state even without another fetch.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const health = deriveHealthState({ events, loadState, now })
  const config = STATUS_CONFIG[health.status]
  const loading = loadState === 'loading'

  const severityIcon = (severity) => {
    const icons = { info: '✅', warning: '⚠️', critical: '🚨' }
    return icons[severity] || '📋'
  }

  const formatTime = (value) => new Date(value).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    hour12: true, timeZoneName: 'short',
  })

  const statusDetail = health.status === 'error'
    ? error
    : health.status === 'stale'
      ? 'The latest recorded check is more than two hours old. Current website status has not been verified.'
      : health.status === 'unknown'
        ? health.reason === 'unreliable_timestamp'
          ? 'The recorded check time could not be verified. Ask Kocre IT to review monitoring setup.'
          : 'Recent successful monitoring has not been confirmed. Ask Kocre IT to verify setup if needed.'
        : health.status === 'loading'
          ? 'Retrieving saved monitoring results.'
          : 'This status describes the latest recorded checks. See their details below.'

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.6rem', margin: 0 }}>Website Monitoring</h1>
          <button
            type="button"
            onClick={loadHealth}
            disabled={loading}
            style={{
              padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 8,
              background: 'white', color: 'var(--ink)', font: 'inherit',
              cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.65 : 1,
            }}
          >
            {loading ? 'Refreshing…' : 'Refresh saved results'}
          </button>
        </div>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem' }}>
          Review recorded website checks. Results older than two hours are marked stale.
        </p>
      </div>

      <div role={health.status === 'error' ? 'alert' : 'status'} aria-busy={loading} style={{
        background: config.bg, border: `1px solid ${config.color}30`,
        borderRadius: 12, padding: '20px 24px', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <span aria-hidden="true" style={{ fontSize: '1.5rem' }}>{config.icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: config.color }}>{config.label}</div>
          <div style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', marginTop: 6 }}>{statusDetail}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: 2 }}>
            Last recorded check: {health.latestCheckedAt
              ? <time dateTime={health.latestCheckedAt}>{formatTime(health.latestCheckedAt)}</time>
              : 'Unavailable'}
          </div>
        </div>
      </div>

      {loadState === 'loaded' && events.length === 0 && (
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 12,
          padding: 40, textAlign: 'center'
        }}>
          <p style={{ color: 'var(--ink-muted)' }}>
            No monitoring checks have been recorded for this workspace. Contact Kocre IT to confirm
            which URLs are configured and whether monitoring is enabled.
          </p>
        </div>
      )}

      {events.length > 0 && (
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 12,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px 20px', borderBottom: '1px solid var(--border)',
            fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em'
          }}>
            {loadState === 'error' ? 'Previously loaded checks' : 'Recorded checks'}
          </div>
          {events.map((event, i) => {
            const meta = event.metadata || {}
            const checkedAt = getCheckTimestamp(event)
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
                    {meta.message || 'Monitoring check recorded.'}
                  </div>
                  {Number.isFinite(meta.response_time) && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                      {meta.response_time}ms response time
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
                  {checkedAt === null ? 'Timestamp unavailable' : formatTime(checkedAt)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
