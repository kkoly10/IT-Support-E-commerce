// Internal, read-only Tactical RMM sensor adapter.
// Remediation belongs to Personal Commands, not this adapter.
// Never import from a client component or expose unscoped Tactical inventory.
export const DEFAULT_TACTICAL_FRESH_MS = 10 * 60_000
const MAX_BODY_BYTES = 2_000_000

export class TacticalMonitorError extends Error {
  constructor(code) {
    super(code)
    this.name = 'TacticalMonitorError'
    this.code = code
  }
}

function fail(code) {
  throw new TacticalMonitorError(code)
}

function endpoint(apiUrl) {
  let parsed
  try {
    parsed = new URL(apiUrl)
  } catch {
    fail('TACTICAL_INVALID_URL')
  }
  if (parsed.protocol !== 'https:' || !parsed.hostname ||
      parsed.username || parsed.password || parsed.search || parsed.hash ||
      (parsed.pathname !== '/' && parsed.pathname !== '')) {
    fail('TACTICAL_INVALID_URL')
  }
  return new URL('/agents/?detail=false', parsed.origin).toString()
}

async function readBodyBounded(response) {
  // Reading Response.text() first is not a real size limit: it buffers all bytes.
  if (typeof response?.body?.getReader !== 'function') fail('TACTICAL_INVALID_RESPONSE')
  const reader = response.body.getReader()
  const chunks = []
  let total = 0
  let completed = false
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) {
        completed = true
        break
      }
      if (!(value instanceof Uint8Array)) fail('TACTICAL_INVALID_RESPONSE')
      total += value.byteLength
      if (total > MAX_BODY_BYTES) fail('TACTICAL_RESPONSE_TOO_LARGE')
      chunks.push(value)
    }
  } finally {
    if (!completed) {
      try { await reader.cancel() } catch { /* original read failure is authoritative */ }
    }
    reader.releaseLock()
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString('utf8')
}

function validateBindings(bindings) {
  if (!Array.isArray(bindings)) fail('TACTICAL_INVALID_BINDINGS')
  const providerIds = new Set()
  const deviceIds = new Set()
  return bindings.map((binding) => {
    if (!binding || typeof binding !== 'object') fail('TACTICAL_INVALID_BINDINGS')
    const { organizationId, deviceId, providerAgentId } = binding
    if (![organizationId, deviceId, providerAgentId].every(
      (value) => typeof value === 'string' && value.trim().length > 0 && value.length <= 128
    )) fail('TACTICAL_INVALID_BINDINGS')
    if (providerIds.has(providerAgentId) || deviceIds.has(deviceId)) {
      fail('TACTICAL_DUPLICATE_BINDING')
    }
    providerIds.add(providerAgentId)
    deviceIds.add(deviceId)
    return Object.freeze({ organizationId, deviceId, providerAgentId })
  })
}

function dateOrNull(value, nowMs) {
  if (typeof value !== 'string' || !value.trim()) return null
  const ms = Date.parse(value)
  if (!Number.isFinite(ms) || ms > nowMs + 60_000) return null
  return { ms, iso: new Date(ms).toISOString() }
}

function classifyAgent(agent, nowMs, maxAgeMs) {
  if (!agent) return { status: 'not_reported', lastSeenAt: null }
  const lastSeen = dateOrNull(agent.last_seen || agent.lastSeenAt, nowMs)
  const status = typeof agent.status === 'string' ? agent.status.trim().toLowerCase() : ''
  if (agent.online === false || status === 'offline') {
    return { status: 'offline', lastSeenAt: lastSeen?.iso || null }
  }
  if (status === 'overdue') {
    return { status: 'stale', lastSeenAt: lastSeen?.iso || null }
  }
  if (agent.online === true || status === 'online') {
    return {
      status: lastSeen ? (nowMs - lastSeen.ms <= maxAgeMs ? 'online' : 'stale') : 'unknown',
      lastSeenAt: lastSeen?.iso || null,
    }
  }
  return { status: 'unknown', lastSeenAt: lastSeen?.iso || null }
}

export function createTacticalMonitor({
  apiUrl, apiKey, fetchImpl = globalThis.fetch,
  now = () => Date.now(), maxAgeMs = DEFAULT_TACTICAL_FRESH_MS,
} = {}) {
  // Validation occurs before any network request; secrets never appear in errors.
  const agentsUrl = endpoint(apiUrl)
  if (typeof apiKey !== 'string' || !apiKey.trim()) fail('TACTICAL_NOT_CONFIGURED')
  if (typeof fetchImpl !== 'function' || typeof now !== 'function' ||
      !Number.isFinite(maxAgeMs) || maxAgeMs <= 0) fail('TACTICAL_INVALID_CONFIGURATION')

  return Object.freeze({
    async pollAuthorizedAgents(bindings) {
      const approved = validateBindings(bindings)
      if (!approved.length) return []
      let response
      try {
        response = await fetchImpl(agentsUrl, {
          method: 'GET',
          headers: { Accept: 'application/json', 'X-API-KEY': apiKey },
          redirect: 'error',
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        })
      } catch {
        fail('TACTICAL_UNAVAILABLE')
      }
      if (!response?.ok) fail('TACTICAL_UNAVAILABLE')
      let agents
      try {
        const parsed = JSON.parse(await readBodyBounded(response))
        if (!Array.isArray(parsed) && parsed?.next != null) {
          // Never invent missing/offline devices from a partial page.
          fail('TACTICAL_PAGINATION_UNSUPPORTED')
        }
        agents = Array.isArray(parsed) ? parsed : parsed?.results
        if (!Array.isArray(agents)) fail('TACTICAL_INVALID_RESPONSE')
        if (!Array.isArray(parsed) && Number.isFinite(parsed.count) &&
            parsed.count > agents.length) fail('TACTICAL_PAGINATION_UNSUPPORTED')
      } catch (error) {
        if (error instanceof TacticalMonitorError) throw error
        fail('TACTICAL_INVALID_RESPONSE')
      }
      const byId = new Map()
      for (const agent of agents) {
        if (!agent || typeof agent !== 'object') continue
        if (typeof agent.agent_id !== 'string' || !agent.agent_id) continue
        if (byId.has(agent.agent_id)) fail('TACTICAL_DUPLICATE_PROVIDER_ID')
        byId.set(agent.agent_id, agent)
      }
      const nowMs = now()
      if (!Number.isFinite(nowMs)) fail('TACTICAL_INVALID_CONFIGURATION')
      const observedAt = new Date(nowMs).toISOString()
      return approved.map(({ organizationId, deviceId, providerAgentId }) => ({
        organizationId,
        deviceId,
        provider: 'tactical',
        providerAgentId,
        ...classifyAgent(byId.get(providerAgentId), nowMs, maxAgeMs),
        observedAt,
      }))
    },
  })
}