export const HEALTH_STALE_AFTER_MS = 2 * 60 * 60 * 1000

const CHECK_BATCH_WINDOW_MS = 5 * 60 * 1000
const MAX_FUTURE_CLOCK_SKEW_MS = 5 * 60 * 1000

function parseTimestamp(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

export function getCheckTimestamp(event) {
  return parseTimestamp(event?.metadata?.checked_at) ?? parseTimestamp(event?.created_at)
}

/**
 * Describe the latest recorded check batch, not every system in an organization.
 * Loading/read errors always take precedence over previously loaded successes.
 * A positive state requires an explicit, recent successful backend check.
 */
export function deriveHealthState({ events = [], loadState = 'loaded', now = Date.now() } = {}) {
  const datedChecks = (Array.isArray(events) ? events : [])
    .map((event) => ({ event, timestamp: getCheckTimestamp(event) }))
    .filter((check) => check.timestamp !== null)
    .sort((a, b) => b.timestamp - a.timestamp)

  const latestTimestamp = datedChecks[0]?.timestamp ?? null
  const latestCheckedAt = latestTimestamp === null ? null : new Date(latestTimestamp).toISOString()
  const result = (status, reason = null) => ({ status, reason, latestCheckedAt })

  if (loadState === 'loading') return result('loading')
  if (loadState === 'error') return result('error')
  if (latestTimestamp === null) return result('unknown', 'no_dated_checks')
  if (!Number.isFinite(now) || latestTimestamp > now + MAX_FUTURE_CLOCK_SKEW_MS) {
    return result('unknown', 'unreliable_timestamp')
  }
  if (now - latestTimestamp > HEALTH_STALE_AFTER_MS) return result('stale')

  const latestBatch = datedChecks.filter(
    (check) => check.timestamp >= latestTimestamp - CHECK_BATCH_WINDOW_MS
  )
  if (latestBatch.some(({ event }) =>
    event.metadata?.severity === 'critical' || event.metadata?.status === 'error'
  )) return result('critical')
  if (latestBatch.some(({ event }) =>
    event.metadata?.severity === 'warning' || event.metadata?.status === 'warning'
  )) return result('warning')

  // An empty/unknown severity is not proof of a successful check.
  if (latestBatch.every(({ event }) => event.metadata?.status === 'healthy')) {
    return result('current')
  }
  return result('unknown', 'unclassified_checks')
}
