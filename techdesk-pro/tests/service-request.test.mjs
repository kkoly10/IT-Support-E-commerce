import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createServiceRequestHandlers, discoveryRevision, mayRequestServices,
  normalizeServiceRequestInput, saveServiceRequest,
} from '../lib/service-request.js'
import { database } from './helpers/memory-db.mjs'

const now = '2026-10-29T16:00:00.000Z'
const user = { id: 'person-1', email: 'owner@example.com', email_confirmed_at: now }
const profile = { id: user.id, organization_id: 'org-1', role: 'client', is_primary_contact: true }
const org = {
  id: 'org-1', name: 'Existing business', plan: 'secure', client_status: 'active',
  payment_status: 'paid', agreement_status: 'signed', onboarding_status: 'complete', needs_human_review: false,
  discovery_profile: { email_platform: 'Microsoft 365', notes: 'Preserve discovery notes.' },
}
function setup(options = {}) {
  const db = database({
    profiles: [options.profile || profile], organizations: options.organizations || [org],
    organization_contacts: options.contacts || [{ id: 'primary', organization_id: 'org-1', email: user.email, is_primary_contact: true }],
  })
  const auth = { user: options.user || user, profile: db.tables.profiles[0], service: db }
  const handlers = createServiceRequestHandlers({ requireUser: async () => options.authError || auth, now: () => now })
  return { db, auth, ...handlers }
}
function post(payload, origin = 'https://kocreit.com') {
  return new Request('https://kocreit.com/api/services/selection', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(payload),
  })
}
const input = (organization = org) => ({ service: 'managed', users: 2, expectedRevision: discoveryRevision(organization.discovery_profile) })

test('GET returns actual account state, saved request, permission and revision without the full discovery questionnaire', async () => {
  const { GET } = setup()
  const response = await GET(new Request('https://kocreit.com/api/services/selection'))
  const result = await response.json()
  assert.equal(response.status, 200)
  assert.equal(result.organization.plan, 'secure')
  assert.equal(result.organization.clientStatus, 'active')
  assert.equal(result.selection, null)
  assert.equal(result.canRequest, true)
  assert.match(result.revision, /^[a-f0-9]{64}$/)
  assert.equal(result.discovery_profile, undefined)
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('unauthenticated, phone-only confirmed, and cross-origin requests cannot write', async () => {
  for (const options of [
    { authError: { error: 'Authentication required.', status: 401 } },
    { user: { ...user, email_confirmed_at: null, confirmed_at: now, phone_confirmed_at: now } },
  ]) {
    const { db, POST } = setup(options)
    assert.ok([401, 403].includes((await POST(post(input()))).status))
    assert.equal(db.writes.length, 0)
  }
  const { db, POST } = setup()
  assert.equal((await POST(post(input(), 'https://elsewhere.example'))).status, 403)
  assert.equal(db.writes.length, 0)
})

test('a client cannot read or write a different organization by supplying its ID', async () => {
  const { db, GET, POST } = setup()
  assert.equal((await GET(new Request('https://kocreit.com/api/services/selection?organizationId=other-org'))).status, 403)
  assert.equal((await POST(post({ ...input(), organizationId: 'other-org' }))).status, 403)
  assert.equal(db.writes.length, 0)
})

test('verified client members may suggest needs regardless of editable contact flags', () => {
  assert.equal(mayRequestServices(profile, user, 'org-1'), true)
  assert.equal(mayRequestServices({ ...profile, is_primary_contact: false, email: 'wrong@example.com' }, user, 'org-1'), true)
  assert.equal(mayRequestServices({ ...profile, role: 'unknown' }, user, 'org-1'), false)
  assert.equal(mayRequestServices(profile, user, 'other-org'), false)
  assert.equal(mayRequestServices({ ...profile, id: 'different-user' }, user, 'org-1'), false)
  assert.equal(mayRequestServices({ ...profile, role: 'admin' }, user, 'other-org'), true)
})

test('nonprimary member suggestions are permitted but cannot forge author, acceptance or commercial state', async () => {
  const { db, POST } = setup({
    profile: { ...profile, is_primary_contact: false },
    contacts: [{ id: 'other', organization_id: 'org-1', is_primary_contact: true, email: 'different@example.com' }],
  })
  assert.equal((await POST(post({ ...input(), role: 'admin', is_primary_contact: true, requestedBy: 'other-admin', status: 'accepted', plan: 'managed' }))).status, 200)
  assert.equal(db.tables.organizations[0].discovery_profile.service_selection.requestedBy, user.id)
  assert.equal(db.tables.organizations[0].discovery_profile.service_selection.status, 'requested')
  assert.equal(db.tables.organizations[0].plan, 'secure')
  assert.equal(db.tables.organization_contacts[0].email, 'different@example.com')
  assert.equal(db.tables.profiles[0].is_primary_contact, false)
})

test('saving recomputes prices, preserves existing commercial state, and marks review without charging', async () => {
  const { db, POST } = setup()
  const response = await POST(post({
    ...input(), monthly: 1, setup: 0, priceVersion: 'fake', plan: 'managed', client_status: 'active', payment_status: 'paid',
    status: 'accepted', requestedBy: 'different-person', systems: [' Microsoft 365 ', 'Windows', 'windows'], projects: ['Email migration'], note: '  Moving next month.  ',
  }))
  assert.equal(response.status, 200)
  const actual = db.tables.organizations[0]
  const selected = actual.discovery_profile.service_selection
  assert.equal(selected.monthly, 288)
  assert.equal(selected.setup, 499)
  assert.equal(selected.totalInitial, 787)
  assert.equal(selected.priceVersion, '2026-10-29')
  assert.equal(selected.requestedBy, user.id)
  assert.equal(selected.status, 'requested')
  assert.deepEqual(selected.systems, ['Microsoft 365', 'Windows'])
  assert.equal(selected.note, 'Moving next month.')
  assert.equal(actual.discovery_profile.email_platform, 'Microsoft 365')
  assert.equal(actual.discovery_profile.notes, org.discovery_profile.notes)
  for (const key of ['plan', 'client_status', 'payment_status', 'agreement_status', 'onboarding_status']) assert.equal(actual[key], org[key])
  assert.equal(actual.needs_human_review, true)
  assert.deepEqual(Object.keys(db.writes[0].values).sort(), ['discovery_profile', 'needs_human_review'])
})

test('stale form revision returns 409 and preserves a newer request', async () => {
  const { db, POST } = setup()
  db.tables.organizations[0].discovery_profile.service_selection = { service: 'one_time', status: 'requested' }
  const response = await POST(post(input()))
  assert.equal(response.status, 409)
  assert.equal(db.tables.organizations[0].discovery_profile.service_selection.service, 'one_time')
  assert.equal(db.writes.length, 0)
})

test('more than ten ongoing users are saved as a custom quote request without recurring amounts', async () => {
  const { db, POST } = setup()
  assert.equal((await POST(post({ ...input(), service: 'remote', users: 20 }))).status, 200)
  const selected = db.tables.organizations[0].discovery_profile.service_selection
  assert.equal(selected.service, 'custom')
  assert.equal(selected.users, 20)
  assert.equal(selected.monthly, null)
  assert.equal(selected.setup, null)
  assert.equal(selected.requiresQuote, true)
})

test('a concurrent discovery edit between read and write is caught by atomic JSON CAS', async () => {
  const { db, POST } = setup()
  db.beforeNextUpdate((tables) => { tables.organizations[0].discovery_profile.notes = 'Concurrent updated notes.' })
  const response = await POST(post(input()))
  assert.equal(response.status, 409)
  assert.equal(db.tables.organizations[0].discovery_profile.notes, 'Concurrent updated notes.')
  assert.equal(db.tables.organizations[0].discovery_profile.service_selection, undefined)
  assert.equal(db.tables.organizations[0].needs_human_review, false)
})

test('two simultaneous conflicting service changes cannot silently overwrite each other', async () => {
  const { db, POST } = setup()
  const responses = await Promise.all([
    POST(post({ ...input(), service: 'remote', users: 1 })),
    POST(post({ ...input(), service: 'managed', users: 2 })),
  ])
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409])
  assert.equal(db.tables.organizations.length, 1)
})

test('admin can explicitly target an organization without modifying their own workspace', async () => {
  const target = { ...structuredClone(org), id: 'org-2', name: 'Target client' }
  const { db, POST } = setup({ profile: { ...profile, role: 'admin' }, organizations: [org, target] })
  assert.equal((await POST(post({ ...input(target), organizationId: 'org-2', service: 'custom', users: 20 }))).status, 200)
  assert.equal(db.tables.organizations[0].discovery_profile.service_selection, undefined)
  assert.equal(db.tables.organizations[1].discovery_profile.service_selection.service, 'custom')
  assert.equal(db.tables.organizations[1].plan, 'secure')
})

test('request validation rejects invalid counts and oversized context instead of silently truncating it', () => {
  for (const users of [0, -1, 1.5, 251, '2 people', '02']) assert.throws(() => normalizeServiceRequestInput({ service: 'remote', users }))
  assert.throws(() => normalizeServiceRequestInput({ service: '__proto__', users: 1 }))
  assert.throws(() => normalizeServiceRequestInput({ service: 'remote', users: 1, systems: 'Windows' }))
  assert.throws(() => normalizeServiceRequestInput({ service: 'remote', users: 1, systems: Array(13).fill('x') }))
  assert.throws(() => normalizeServiceRequestInput({ service: 'remote', users: 1, projects: ['x'.repeat(121)] }))
  assert.throws(() => normalizeServiceRequestInput({ service: 'remote', users: 1, note: 'x'.repeat(2001) }))
  assert.equal(normalizeServiceRequestInput({ service: 'one_time', users: 7 }).users, 1)
  assert.equal(discoveryRevision({ a: 1, b: 2 }), discoveryRevision({ b: 2, a: 1 }))
})

test('direct helper rejects unverified identity or mismatched tenant context too', async () => {
  const { db } = setup()
  await assert.rejects(saveServiceRequest({ service: db, user: { ...user, email_confirmed_at: null, confirmed_at: now }, profile, organization: org, contacts: [], payload: input(), now }), { status: 403 })
  await assert.rejects(saveServiceRequest({ service: db, user, profile, organization: { ...org, id: 'other' }, contacts: [], payload: input(), now }), { status: 403 })
  assert.equal(db.writes.length, 0)
})
