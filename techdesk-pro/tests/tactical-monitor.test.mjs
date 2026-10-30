import test from 'node:test'
import assert from 'node:assert/strict'
import { createTacticalMonitor, TacticalMonitorError } from '../lib/rmm/tactical-monitor.mjs'

const NOW = Date.parse('2026-10-30T06:35:00.000Z')
const binding = (id = 'a1') => ({
  organizationId: 'org-one', deviceId: 'device-' + id, providerAgentId: id,
})
const apiUrl = 'https://api-rmm.kocreit.com'
const ok = (data) => new Response(JSON.stringify(data), {
  status: 200, headers: { 'content-type': 'application/json' },
})

test('only enrolled exact IDs are returned; foreign inventory is discarded', async () => {
  const requests = []
  const monitor = createTacticalMonitor({
    apiUrl, apiKey: 'synthetic-key', now: () => NOW,
    fetchImpl: async (url, options) => {
      requests.push({ url, options })
      return ok([
        { agent_id: 'other-tenant', status: 'online', last_seen: new Date(NOW).toISOString(), hostname: 'private-host' },
        { agent_id: 'a1', status: 'online', last_seen: new Date(NOW - 1000).toISOString(), hostname: 'my-test-host' },
      ])
    },
  })
  const result = await monitor.pollAuthorizedAgents([binding()])
  assert.equal(result.length, 1)
  assert.equal(result[0].status, 'online')
  assert.equal(result[0].organizationId, 'org-one')
  assert.equal(result[0].deviceId, 'device-a1')
  assert.equal(result[0].hostname, undefined)
  assert.doesNotMatch(JSON.stringify(result), /other-tenant|private-host|my-test-host/)
  assert.equal(requests[0].url, apiUrl + '/agents/?detail=false')
  assert.equal(requests[0].options.headers['X-API-KEY'], 'synthetic-key')
  assert.equal(requests[0].options.method, 'GET')
  assert.equal(requests[0].options.redirect, 'error')
  assert.equal(requests[0].options.cache, 'no-store')
})

test('stale, overdue, missing and future timestamps never imply online', async () => {
  const result = await createTacticalMonitor({
    apiUrl, apiKey: 'synthetic-key', now: () => NOW,
    fetchImpl: async () => ok([
      { agent_id: 'old', status: 'online', last_seen: new Date(NOW - 11 * 60_000).toISOString() },
      { agent_id: 'overdue', status: 'overdue', last_seen: new Date(NOW - 1000).toISOString() },
      { agent_id: 'future', status: 'online', last_seen: new Date(NOW + 3600_000).toISOString() },
      { agent_id: 'no-date', online: true },
      { agent_id: 'off', status: 'offline', last_seen: new Date(NOW - 1000).toISOString() },
    ]),
  }).pollAuthorizedAgents(['old','overdue','future','no-date','off','missing']
    .map((id) => binding(id)))
  assert.deepEqual(result.map((row) => row.status),
    ['stale','stale','unknown','unknown','offline','not_reported'])
})

test('all bindings are verified before provider request, including cross-tenant ID reuse', async () => {
  let called = false
  const monitor = createTacticalMonitor({
    apiUrl, apiKey: 'synthetic-key',
    fetchImpl: async () => { called = true; return ok([]) },
  })
  await assert.rejects(
    monitor.pollAuthorizedAgents([binding(), { ...binding(), organizationId: 'other', deviceId: 'other-device' }]),
    { code: 'TACTICAL_DUPLICATE_BINDING' },
  )
  await assert.rejects(monitor.pollAuthorizedAgents([{ organizationId: 'org', deviceId: 'dev' }]),
    { code: 'TACTICAL_INVALID_BINDINGS' })
  assert.equal(called, false)
  assert.deepEqual(await monitor.pollAuthorizedAgents([]), [])
  assert.equal(called, false)
})

test('insecure URL, embedded credentials and missing key fail closed', () => {
  for (const url of ['http://api-rmm.kocreit.com', 'https://user:pass@api-rmm.kocreit.com',
    'https://api-rmm.kocreit.com/hidden', 'https://api-rmm.kocreit.com/?token=secret', 'bad']) {
    assert.throws(() => createTacticalMonitor({ apiUrl: url, apiKey: 'synthetic' }),
      { code: 'TACTICAL_INVALID_URL' })
  }
  assert.throws(() => createTacticalMonitor({ apiUrl }), { code: 'TACTICAL_NOT_CONFIGURED' })
})

test('network/HTTP/malformed/duplicate/oversize never become success', async () => {
  const responses = [
    async () => { throw Error('contains-secret-value') },
    async () => new Response('Unauthorized', { status: 401 }),
    async () => new Response('not json', { status: 200 }),
    async () => ok([{ agent_id: 'a1' }, { agent_id: 'a1' }]),
    async () => new Response('X'.repeat(2_000_001), { status: 200 }),
  ]
  const codes = ['TACTICAL_UNAVAILABLE','TACTICAL_UNAVAILABLE',
    'TACTICAL_INVALID_RESPONSE','TACTICAL_DUPLICATE_PROVIDER_ID','TACTICAL_RESPONSE_TOO_LARGE']
  for (let i = 0; i < responses.length; i++) {
    const monitor = createTacticalMonitor({
      apiUrl, apiKey: 'synthetic-key', now: () => NOW, fetchImpl: responses[i],
    })
    await assert.rejects(monitor.pollAuthorizedAgents([binding()]), (error) => {
      assert.ok(error instanceof TacticalMonitorError)
      assert.equal(error.code, codes[i])
      assert.doesNotMatch(error.message, /contains-secret-value|synthetic-key/)
      return true
    })
  }
})

test('paginated result envelope does not enroll unbound agents', async () => {
  const monitor = createTacticalMonitor({
    apiUrl, apiKey: 'synthetic-key', now: () => NOW,
    fetchImpl: async () => ok({ results: [
      { agent_id: 'a1', status: 'online', last_seen: new Date(NOW - 1000).toISOString() },
      { agent_id: 'unbound', status: 'online', last_seen: new Date(NOW - 1000).toISOString() },
    ] }),
  })
  assert.equal((await monitor.pollAuthorizedAgents([binding()])).length, 1)
})

test('aborts oversized streaming response without using unbounded response.text', async () => {
  let count = 0
  const response = new Response(new ReadableStream({
    pull(controller) {
      count += 1
      controller.enqueue(new Uint8Array(180_000))
      if (count >= 14) controller.close()
    },
  }), { status: 200 })
  response.text = async () => { throw Error('unexpected unbounded body read') }
  const monitor = createTacticalMonitor({
    apiUrl, apiKey: 'synthetic-key', now: () => NOW,
    fetchImpl: async () => response,
  })
  await assert.rejects(monitor.pollAuthorizedAgents([binding()]), {
    code: 'TACTICAL_RESPONSE_TOO_LARGE',
  })
  assert.ok(count <= 13, 'oversized stream must not be read to completion')
})

test('incomplete paginated provider inventory fails instead of reporting bound agents missing', async () => {
  const monitor = createTacticalMonitor({
    apiUrl, apiKey: 'synthetic-key', now: () => NOW,
    fetchImpl: async () => ok({
      next: 'https://api-rmm.kocreit.com/agents/?page=2',
      results: [{ agent_id: 'a1', status: 'online', last_seen: new Date(NOW).toISOString() }],
    }),
  })
  await assert.rejects(monitor.pollAuthorizedAgents([binding('other-page')]), {
    code: 'TACTICAL_PAGINATION_UNSUPPORTED',
  })
})