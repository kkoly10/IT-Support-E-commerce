import test from 'node:test'
import assert from 'node:assert/strict'
import { createClientActivationHandlers } from '../lib/client-activation-api.js'
import { discoveryRevision } from '../lib/service-request.js'
import { checksFor } from '../lib/client-activation.js'

const now = '2026-10-30T12:00:00.000Z'
const orgId = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
const adminId = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb'
const ownerId = 'cccccccc-cccc-4ccc-cccc-cccccccccccc'
const otherId = 'dddddddd-dddd-4ddd-dddd-dddddddddddd'
const otherOrgId = 'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee'

function database(seed = {}) {
  const tables = {
    organizations: [{
      id: orgId, name: 'Example Client', client_status: 'lead', plan: 'pending',
      discovery_profile: { service_selection: { service: 'managed', users: 1 } },
    }, ...seed.organizations || []],
    service_orders: [],
    profiles: [
      { id: ownerId, organization_id: orgId, role: 'client', full_name: 'Alex Owner', email: 'owner@example.com' },
      { id: otherId, organization_id: orgId, role: 'client', full_name: 'Other Member', email: 'another@example.com' },
    ],
    organization_contacts: [
      { organization_id: orgId, email: 'owner@example.com', is_primary_contact: true },
    ],
  }
  let fail = null
  return {
    tables,
    failNext(table, action) { fail = { table, action } },
    from(table) {
      let action = 'select', payload, single = false, limit = Infinity, sorting = null
      const filters = []
      const q = {
        select() { return q },
        eq(field, value) { filters.push((row) => row[field] === value); return q },
        order(field, { ascending = true } = {}) { sorting = { field, ascending }; return q },
        limit(n) { limit = n; return q },
        single() { single = true; return q },
        maybeSingle() { single = true; return q },
        insert(values) { action = 'insert'; payload = values; return q },
        update(values) { action = 'update'; payload = values; return q },
        then(resolve, reject) {
          if (fail?.table === table && fail?.action === action) {
            fail = null
            return Promise.resolve({ data: null, error: { code: 'TEST_FAIL' } }).then(resolve, reject)
          }
          let rows = (tables[table] || []).filter((row) => filters.every((fn) => fn(row)))
          if (sorting) rows.sort((a,b) => {
            const delta = String(a[sorting.field]).localeCompare(String(b[sorting.field]))
            return sorting.ascending ? delta : -delta
          })
          rows = rows.slice(0, limit)
          if (action === 'insert') {
            const created = { id: 'ffffffff-ffff-4fff-ffff-ffffffffffff', ...structuredClone(payload) }
            tables[table].push(created); rows = [created]
          }
          if (action === 'update') {
            for (const row of rows) Object.assign(row, structuredClone(payload))
          }
          return Promise.resolve({ data: structuredClone(single ? rows[0] || null : rows), error: null }).then(resolve, reject)
        },
      }
      return q
    },
  }
}
const authFor = (db, role = 'client', userId = ownerId, email = 'owner@example.com', organizationId = orgId) => async () => ({
  service: db,
  user: { id: userId, email, email_confirmed_at: now },
  profile: { id: userId, role, email, is_primary_contact: true, organization_id: organizationId },
})
function handlers(db, role, userId, email, organizationId) {
  return createClientActivationHandlers({ requireUser: authFor(db, role, userId, email, organizationId), now: () => now })
}
function request(payload) {
  return new Request('https://kocreit.com/api/client-activation', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://kocreit.com' },
    body: JSON.stringify(payload),
  })
}
function offerPayload(db) {
  return {
    action: 'offer', organizationId: orgId,
    expectedRequestRevision: discoveryRevision(db.tables.organizations[0].discovery_profile),
    authorizedSignerUserId: ownerId,
    scopeSummary: 'Covered Windows laptop patching, remote helpdesk and agreed account administration.',
    monthlyCents: 22900, setupCents: 49900, oneTimeCents: null,
  }
}

test('client cannot publish an offer or target a different customer organization', async () => {
  const db = database()
  const client = handlers(db)
  assert.equal((await client.POST(request(offerPayload(db)))).status, 403)
  assert.equal((await client.GET(new Request('https://kocreit.com/api/client-activation?organizationId=' + otherOrgId))).status, 403)
  assert.equal(db.tables.service_orders.length, 0)
})

test('admin offer binds the latest saved request and protects against stale customer changes', async () => {
  const db = database()
  const admin = handlers(db, 'admin', adminId, 'admin@kocreit.com', orgId)
  const stale = offerPayload(db)
  db.tables.organizations[0].discovery_profile.notes = 'New client information'
  assert.equal((await admin.POST(request(stale))).status, 409)
  assert.equal(db.tables.service_orders.length, 0)
  const response = await admin.POST(request(offerPayload(db)))
  assert.equal(response.status, 201)
  const result = await response.json()
  assert.equal(result.order.monthly_cents, 22900)
  assert.equal(result.order.supported_users, 1)
  assert.equal(result.order.status, 'offered')
  assert.equal(db.tables.organizations[0].client_status, 'lead')
  assert.equal((await admin.POST(request(offerPayload(db)))).status, 409)
})

test('client acceptance requires Kocre-designated signer identity; editable primary contacts confer no authority', async () => {
  const db = database()
  const admin = handlers(db, 'admin', adminId, 'admin@kocreit.com', orgId)
  const published = await (await admin.POST(request(offerPayload(db)))).json()
  const orderId = published.order.id
  const accept = { action: 'accept', orderId, expectedRevision: 0, acknowledged: true, acceptedName: 'Alex Owner' }
  // A member may currently modify the contact matrix. Such self-promotion
  // must never allow a quote to be accepted because the signer is bound
  // to an immutable Kocre-issued service order.
  db.tables.organization_contacts[0].is_primary_contact = false
  db.tables.organization_contacts.push({ organization_id: orgId, email: 'another@example.com', is_primary_contact: true })
  const notPrimary = handlers(db, 'client', otherId, 'another@example.com', orgId)
  assert.equal((await notPrimary.POST(request(accept))).status, 403)
  assert.equal(db.tables.service_orders[0].status, 'offered')
  const owner = handlers(db)
  const response = await owner.POST(request(accept))
  assert.equal(response.status, 200)
  assert.equal(db.tables.service_orders[0].status, 'accepted')
  assert.equal(db.tables.service_orders[0].accepted_by, ownerId)
  assert.equal(db.tables.organizations[0].client_status, 'lead')
})

test('onboarding organization sync is retryable without accepting or publishing a second order', async () => {
  const db = database()
  const admin = handlers(db, 'admin', adminId, 'admin@kocreit.com', orgId)
  const owner = handlers(db)
  const offered = await (await admin.POST(request(offerPayload(db)))).json()
  const id = offered.order.id
  const state = () => db.tables.service_orders[0]
  const act = (action) => admin.POST(request({ action, organizationId: orgId, orderId: id, expectedRevision: state().revision }))
  assert.equal((await owner.POST(request({ action: 'accept', orderId: id, expectedRevision: 0, acknowledged: true, acceptedName: 'Alex Owner' }))).status, 200)
  db.failNext('organizations', 'update')
  assert.equal((await act('begin_onboarding')).status, 503)
  assert.equal(state().status, 'onboarding')
  assert.equal(db.tables.organizations[0].client_status, 'lead')
  assert.equal((await act('begin_onboarding')).status, 200)
  assert.equal(db.tables.organizations[0].client_status, 'onboarding')
  assert.equal(state().revision, 2)
})

test('server refuses activation until quote accepted, verified evidence and tier-specific checks all exist', async () => {
  const db = database()
  const admin = handlers(db, 'admin', adminId, 'admin@kocreit.com', orgId)
  const owner = handlers(db)
  const published = await (await admin.POST(request(offerPayload(db)))).json()
  const id = published.order.id
  const current = () => db.tables.service_orders[0]
  const act = (name, extra={}) => admin.POST(request({ action: name, organizationId: orgId, orderId: id, expectedRevision: current().revision, ...extra }))
  assert.equal((await act('activate')).status, 409)
  assert.equal((await owner.POST(request({ action: 'accept', orderId: id, expectedRevision: current().revision, acknowledged: true, acceptedName: 'Alex Owner' }))).status, 200)
  assert.equal((await act('begin_onboarding')).status, 200)
  assert.equal(db.tables.organizations[0].client_status, 'onboarding')
  assert.equal((await act('activate')).status, 409)
  assert.equal((await act('record_agreement', { reference: 'signed-contract-123', attested: true })).status, 200)
  assert.equal((await act('record_payment', { reference: 'paid-invoice-123', attested: true })).status, 200)
  for (const [checkKey] of checksFor('managed')) {
    assert.equal((await act('verify_check', { checkKey, evidence: 'actual-check-' + checkKey })).status, 200)
  }
  assert.equal((await act('activate')).status, 200)
  assert.equal(current().status, 'active')
  assert.equal(db.tables.organizations[0].client_status, 'active')
  assert.equal(db.tables.organizations[0].plan, 'managed')
  assert.equal(db.tables.organizations[0].payment_status, 'active')
})

test('if account sync fails after activation, authenticated retry repairs it without a second activation', async () => {
  const db = database()
  const admin = handlers(db, 'admin', adminId, 'admin@kocreit.com', orgId)
  const owner = handlers(db)
  const published = await (await admin.POST(request(offerPayload(db)))).json()
  const id = published.order.id
  const current = () => db.tables.service_orders[0]
  const act = (action, extra={}) => admin.POST(request({ action, organizationId: orgId, orderId: id, expectedRevision: current().revision, ...extra }))
  await owner.POST(request({ action: 'accept', orderId: id, expectedRevision: 0, acknowledged: true, acceptedName: 'Alex Owner' }))
  await act('begin_onboarding')
  await act('record_agreement', { reference: 'executed-msa-123', attested: true })
  await act('record_payment', { reference: 'paid-invoice-123', attested: true })
  for (const [checkKey] of checksFor('managed')) await act('verify_check', { checkKey, evidence: 'verified-' + checkKey })
  db.failNext('organizations', 'update')
  assert.equal((await act('activate')).status, 503)
  assert.equal(current().status, 'active')
  assert.equal(db.tables.organizations[0].client_status, 'onboarding')
  assert.equal((await act('activate')).status, 200)
  assert.equal(db.tables.organizations[0].client_status, 'active')
})
