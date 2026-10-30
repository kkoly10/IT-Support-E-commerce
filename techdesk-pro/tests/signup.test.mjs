import test from 'node:test'
import assert from 'node:assert/strict'
import { createSignupHandler, completeVerifiedSignup, linkOwnedAssessment, signupRecordId } from '../lib/signup-completion.js'
import { normalizeSignupContext, safeAuthNext, signupResumeHref } from '../lib/signup-context.js'
import { database } from './helpers/memory-db.mjs'

const now = '2026-10-29T12:00:00.000Z'
const user = {
  id: '11111111-1111-4111-a111-111111111111', email: 'owner@example.com',
  email_confirmed_at: now, user_metadata: { full_name: 'Alex Owner' },
}


function handlerFor(db, authUser = user) {
  return createSignupHandler({
    createSessionClient: async () => ({ auth: { getUser: async () => ({ data: { user: authUser }, error: null }) } }),
    getService: () => db,
    now: () => now,
  })
}
function request(payload = {}, origin = 'https://kocreit.com') {
  return new Request('https://kocreit.com/api/signup/complete', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(payload),
  })
}

test('unauthenticated callers cannot obtain the service client, even with a valid-looking account ID', async () => {
  let touched = false
  const handler = createSignupHandler({
    createSessionClient: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
    getService: () => { touched = true; throw new Error('must not be reached') },
  })
  const response = await handler(request({ userId: user.id, email: user.email, companyName: 'Spoofed' }))
  assert.equal(response.status, 401)
  assert.equal(touched, false)
})

test('unconfirmed email and cross-origin requests cannot provision a workspace', async () => {
  const db = database()
  assert.equal((await handlerFor(db, { ...user, email_confirmed_at: null })(request({}))).status, 403)
  assert.equal((await handlerFor(db, { ...user, email_confirmed_at: null, confirmed_at: now, phone_confirmed_at: now })(request({}))).status, 403)
  assert.equal((await handlerFor(db)(request({}, 'https://unrelated.example'))).status, 403)
  assert.equal(db.writes.length, 0)
})

test('identity and privileges come from verified auth; prices are recomputed and personal signup needs no company', async () => {
  const db = database()
  const response = await handlerFor(db)(request({
    userId: '22222222-2222-4222-a222-222222222222', email: 'victim@example.com', role: 'admin',
    organizationId: 'victim-org', plan: 'managed', payment_status: 'paid',
    fullName: 'Alex', serviceSelection: { service: 'managed', users: 2, monthly: 1, setup: 0 },
  }))
  assert.equal(response.status, 200)
  const responseBody = await response.json()
  assert.equal(responseBody.next, '/portal/dashboard?welcome=1')
  const org = db.tables.organizations[0]
  const profile = db.tables.profiles[0]
  assert.equal(profile.id, user.id)
  assert.equal(profile.email, user.email)
  assert.equal(profile.role, 'client')
  assert.equal(org.plan, 'pending')
  assert.equal(org.client_status, 'lead')
  assert.equal(org.payment_status, 'none')
  assert.equal(org.name, "Alex's workspace")
  assert.equal(org.discovery_profile.company_name, null)
  assert.equal(org.discovery_profile.service_selection.monthly, 328)
  assert.equal(org.discovery_profile.service_selection.setup, 499)
  assert.equal(db.tables.organization_contacts[0].email, user.email)
  assert.equal(db.tables.organization_contacts[0].is_primary_contact, true)
})

test('a free exploratory account has no default purchased or requested service', async () => {
  const db = database()
  await completeVerifiedSignup({ service: db, user, payload: {}, now })
  assert.equal(db.tables.organizations[0].discovery_profile.service_selection, undefined)
  assert.equal(db.tables.organizations[0].plan, 'pending')
})

test('repeated and concurrent completion creates only one workspace, profile and primary contact', async () => {
  const db = database()
  await Promise.all([1, 2, 3].map(() => completeVerifiedSignup({ service: db, user, payload: {}, now })))
  await completeVerifiedSignup({ service: db, user, payload: {}, now })
  assert.equal(db.tables.organizations.length, 1)
  assert.equal(db.tables.profiles.length, 1)
  assert.equal(db.tables.organization_contacts.length, 1)
})

test('a profile write failure can resume the same organization without deleting or duplicating it', async () => {
  const db = database()
  db.failNext('profiles', 'upsert')
  const first = await handlerFor(db)(request({ fullName: 'Alex', serviceSelection: { service: 'one_time', users: 1 } }))
  assert.equal(first.status, 503)
  assert.equal(db.tables.organizations.length, 1)
  assert.equal(db.tables.profiles.length, 0)
  assert.equal((await handlerFor(db)(request({ fullName: 'Alex' }))).status, 200)
  assert.equal(db.tables.organizations.length, 1)
  assert.equal(db.tables.organizations[0].discovery_profile.service_selection.service, 'one_time')
})

test('a contact failure resumes after profile creation and leaves service selection intact', async () => {
  const db = database()
  db.failNext('organization_contacts', 'upsert')
  assert.equal((await handlerFor(db)(request({ serviceSelection: { service: 'remote', users: 1 } }))).status, 503)
  assert.equal(db.tables.profiles.length, 1)
  assert.equal(db.tables.organization_contacts.length, 0)
  assert.equal((await handlerFor(db)(request({}))).status, 200)
  assert.equal(db.tables.organization_contacts.length, 1)
  assert.equal(db.tables.organizations[0].discovery_profile.service_selection.service, 'remote')
})

test('changing a selection during unfinished signup replaces the earlier draft on the same workspace', async () => {
  const db = database()
  db.failNext('profiles', 'upsert')
  assert.equal((await handlerFor(db)(request({ serviceSelection: { service: 'remote', users: 1 } }))).status, 503)
  const originalId = db.tables.organizations[0].id
  assert.equal((await handlerFor(db)(request({ serviceSelection: { service: 'managed', users: 2 } }))).status, 200)
  assert.equal(db.tables.organizations.length, 1)
  assert.equal(db.tables.organizations[0].id, originalId)
  assert.equal(db.tables.organizations[0].discovery_profile.service_selection.service, 'managed')
  assert.equal(db.tables.organizations[0].discovery_profile.service_selection.monthly, 328)
  assert.equal(db.tables.organizations[0].plan, 'pending')
})

test('sign-in recovery never replays old metadata over an existing plan or discovery data', async () => {
  const db = database({
    profiles: [{ id: user.id, organization_id: 'existing-org', role: 'client', is_primary_contact: true, full_name: 'Alex' }],
    organizations: [{ id: 'existing-org', plan: 'secure', client_status: 'active', payment_status: 'paid', discovery_profile: { notes: 'keep', service_selection: { service: 'custom', status: 'accepted' } } }],
    organization_contacts: [{ id: 'primary', organization_id: 'existing-org', is_primary_contact: true, email: 'other-owner@example.com' }],
  })
  const authUser = { ...user, user_metadata: { signup_context: { fullName: 'Alex', serviceSelection: { service: 'remote', users: 1 } } } }
  await completeVerifiedSignup({ service: db, user: authUser, payload: {}, now })
  assert.equal(db.tables.organizations[0].plan, 'secure')
  assert.equal(db.tables.organizations[0].client_status, 'active')
  assert.equal(db.tables.organizations[0].payment_status, 'paid')
  assert.equal(db.tables.organizations[0].discovery_profile.service_selection.service, 'custom')
  assert.equal(db.tables.organization_contacts.length, 1)
  assert.equal(db.writes.length, 0)
})

test('existing client selection is explicit, preserves unrelated discovery data, and does not activate service', async () => {
  const db = database({
    profiles: [{ id: user.id, organization_id: 'existing-org', role: 'client', is_primary_contact: true }],
    organizations: [{ id: 'existing-org', plan: 'pending', client_status: 'lead', discovery_profile: { notes: 'keep' } }],
    organization_contacts: [{ id: 'primary', organization_id: 'existing-org', is_primary_contact: true }],
  })
  await completeVerifiedSignup({ service: db, user, payload: { serviceSelection: { service: 'remote', users: 5 } }, now })
  const org = db.tables.organizations[0]
  assert.equal(org.discovery_profile.notes, 'keep')
  assert.equal(org.discovery_profile.service_selection.monthly, null)
  assert.equal(org.discovery_profile.service_selection.requiresQuote, true)
  assert.equal(org.plan, 'pending')
  assert.equal(org.client_status, 'lead')
  db.tables.profiles[0].is_primary_contact = false
  await completeVerifiedSignup({ service: db, user, payload: { serviceSelection: { service: 'managed', users: 1 } }, now })
  assert.equal(org.discovery_profile.service_selection.service, 'managed')
  assert.equal(org.discovery_profile.service_selection.requestedBy, user.id)
  assert.equal(org.discovery_profile.service_selection.status, 'requested')
  assert.equal(org.plan, 'pending')
  assert.equal(org.client_status, 'lead')
})

test('ordinary legacy sign-in never creates or promotes contacts, even if its editable primary flag is true', async () => {
  const db = database({
    profiles: [{ id: user.id, organization_id: 'legacy-org', role: 'client', is_primary_contact: true, full_name: 'Alex' }],
    organizations: [{ id: 'legacy-org', plan: 'secure', client_status: 'active', discovery_profile: {} }],
  })
  await completeVerifiedSignup({ service: db, user, payload: {}, now })
  assert.equal(db.tables.organization_contacts.length, 0)
  assert.equal(db.writes.length, 0)
})

test('an invited member cannot trigger automatic primary contact provisioning for another signup owner', async () => {
  const otherOwnerOrg = signupRecordId('organization', '22222222-2222-4222-a222-222222222222')
  const db = database({
    profiles: [{ id: user.id, organization_id: otherOwnerOrg, role: 'client', is_primary_contact: true }],
    organizations: [{ id: otherOwnerOrg, plan: 'pending', client_status: 'lead', discovery_profile: {} }],
  })
  await completeVerifiedSignup({ service: db, user, payload: { serviceSelection: { service: 'one_time', users: 1 } }, now })
  assert.equal(db.tables.organization_contacts.length, 0)
  assert.equal(db.tables.organizations[0].discovery_profile.service_selection.requestedBy, user.id)
  assert.equal(db.tables.organizations[0].plan, 'pending')
})

test('assessment linking requires email ownership and never reassigns another workspace', async () => {
  const db = database({ assessment_submissions: [
    { id: 'foreign', email: 'somebody@example.com', linked_organization_id: null },
    { id: 'owned', email: user.email.toUpperCase(), linked_organization_id: null },
    { id: 'assigned', email: user.email, linked_organization_id: 'another-org' },
  ] })
  const link = (assessmentId) => linkOwnedAssessment(db, { assessmentId, user, organizationId: 'our-org', now })
  await assert.rejects(linkOwnedAssessment(db, { assessmentId: 'owned', user: { ...user, email_confirmed_at: null, confirmed_at: now }, organizationId: 'our-org', now }), { status: 403 })
  await assert.rejects(link('foreign'), { status: 403 })
  await assert.rejects(link('missing'), { status: 403 })
  await assert.rejects(link('assigned'), { status: 409 })
  assert.equal(db.writes.length, 0)
  await link('owned')
  await link('owned')
  assert.equal(db.tables.assessment_submissions[1].linked_organization_id, 'our-org')
  assert.equal(db.writes.length, 1)
})

test('signup context sanitizes editable values and auth redirects remain inside approved app routes', () => {
  const context = normalizeSignupContext({ fullName: '  Alex  ', role: 'admin', userId: user.id, assessmentId: 'invalid', serviceSelection: { service: 'managed', users: '3', monthly: 0 } })
  assert.equal(context.fullName, 'Alex')
  assert.equal(context.role, undefined)
  assert.equal(context.userId, undefined)
  assert.equal(context.assessmentId, null)
  assert.deepEqual(context.serviceSelection, { service: 'managed', users: 3 })
  assert.equal(signupResumeHref(context.serviceSelection), '/signup?service=managed&users=3&resume=1')
  for (const unsafe of ['https://evil.example', '//evil.example', '/\\evil.example', '/api/signup/complete', '/admin/dashboard', '/portal/../../admin']) {
    assert.equal(safeAuthNext(unsafe), '/portal/services')
  }
  assert.equal(safeAuthNext('/signup?service=one_time&users=1'), '/signup?service=one_time&users=1')
  assert.notEqual(signupRecordId('organization', user.id), signupRecordId('contact', user.id))
})
