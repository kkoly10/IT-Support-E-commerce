// First-response SLA helpers — computed on the fly from ticket_messages so
// honesty doesn't depend on a write-time trigger that doesn't exist yet.
// Business hours are Mon–Fri, 9–18 US Eastern. The "target" terminology
// matches public pricing copy: it's a goal, not a guarantee.

// Targets keyed by org.plan. Secure Desk gets a tighter target to match
// the homepage's "priority business-hours response" copy. The legacy
// ticket-credit plans keep their original targets so grandfathered
// reports stay accurate.
export const PLAN_RESPONSE_TARGET_HOURS = {
  founding: 8,
  remote: 8,
  managed: 8,
  secure: 4,
  custom: 8,
  starter: 8,
  growth: 4,
  scale: 1,
}

// Returns null for plans where no target has been agreed (pending fit
// review, or an unknown/missing plan key). Callers must short-circuit on
// null instead of falling back to a number — otherwise a brand new lead
// would trigger SLA-breach alerts before they've even signed.
export function getResponseTargetHours(plan) {
  const key = String(plan || '').toLowerCase()
  if (!key || key === 'pending') return null
  return PLAN_RESPONSE_TARGET_HOURS[key] ?? 8
}

// Earliest non-internal agent/AI reply timestamp from a list of ticket_messages.
// Caller can pass partial rows — only sender_type, is_internal_note, created_at
// are read. Returns ISO string or null.
export function getFirstAgentReplyAt(messages) {
  if (!Array.isArray(messages)) return null
  let earliest = null
  for (const m of messages) {
    if (!m || !m.created_at) continue
    if (m.is_internal_note) continue
    if (m.sender_type !== 'agent' && m.sender_type !== 'ai') continue
    if (!earliest || new Date(m.created_at) < new Date(earliest)) {
      earliest = m.created_at
    }
  }
  return earliest
}

const BUSINESS_DAYS = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
const BUSINESS_START_HOUR = 9
const BUSINESS_END_HOUR = 18
const STEP_MS = 5 * 60 * 1000
const STEP_HOURS = STEP_MS / 3_600_000

const _etFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  weekday: 'short',
  hour: '2-digit',
  hour12: false,
})

function isBusinessTime(date) {
  const parts = {}
  for (const p of _etFormatter.formatToParts(date)) parts[p.type] = p.value
  const hour = Number(parts.hour)
  return BUSINESS_DAYS.has(parts.weekday) && hour >= BUSINESS_START_HOUR && hour < BUSINESS_END_HOUR
}

// Business hours elapsed between two timestamps, ET, 5-minute resolution.
export function businessHoursBetween(start, end) {
  const startTs = new Date(start).getTime()
  const endTs = new Date(end).getTime()
  if (!Number.isFinite(startTs) || !Number.isFinite(endTs) || endTs <= startTs) return 0

  let total = 0
  for (let t = startTs; t < endTs; t += STEP_MS) {
    if (isBusinessTime(new Date(t))) total += STEP_HOURS
  }
  return total
}
