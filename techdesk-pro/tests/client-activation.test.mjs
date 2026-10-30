import test from 'node:test'
import assert from 'node:assert/strict'
import { ActivationError, ACTIVATION_CHECKS, activationBlockers, createWrittenOffer, transitionOrder } from '../lib/client-activation.js'

const now = '2026-10-30T12:00:00.000Z'
const actor = '11111111-1111-4111-a111-111111111111'
function offer(service = 'remote', users = 1) {
  const monthly = service === 'one_time' ? null : service === 'remote' ? 14900 : service === 'managed' ? 22900 : service === 'secure' ? 29900 : 100000
  const setup = service === 'one_time' ? 0 : service === 'remote' ? 19900 : service === 'managed' ? 49900 : service === 'secure' ? 69900 : 10000
  const oneTime = service === 'one_time' ? 12500 : null
  return createWrittenOffer({ service, users }, {
    scopeSummary: 'Diagnose, configure and maintain agreed systems.',
    monthlyCents: monthly, setupCents: setup, oneTimeCents: oneTime,
    exclusions: 'Hardware separate', externalCosts: 'Licenses separate',
  }, actor, now)
}
function apply(order, action, payload = {}, at = now) {
  const patch = transitionOrder(order, action, payload, actor, at)
  return { ...order, ...patch }
}

test('small-team offer snapshots price and scope without activating anything', () => {
  const quote = offer('remote', 1)
  assert.equal(quote.monthly_cents, 14900)
  assert.equal(quote.setup_cents, 19900)
  assert.equal(quote.service_key, 'remote')
  assert.equal(quote.status, 'offered')
  assert.equal(quote.supported_users, 1)
  assert.equal(quote.price_version, '2026-10-29-v2')
  assert.ok(Date.parse(quote.quote_valid_until) > Date.parse(now))
})

test('plan-specific onboarding differs between one-time, remote, managed, secure and custom', () => {
  assert.deepEqual(Object.keys(ACTIVATION_CHECKS).sort(), ['custom', 'managed', 'one_time', 'remote', 'secure'])
  const remoteKeys = ACTIVATION_CHECKS.remote.map(([key]) => key)
  const managedKeys = ACTIVATION_CHECKS.managed.map(([key]) => key)
  const secureKeys = ACTIVATION_CHECKS.secure.map(([key]) => key)
  assert.ok(!remoteKeys.includes('endpoint_enrolled'))
  assert.ok(managedKeys.includes('endpoint_enrolled'))
  assert.ok(secureKeys.includes('endpoint_protection'))
  assert.ok(secureKeys.includes('recovery_scope'))
  assert.equal(ACTIVATION_CHECKS.one_time.some(([key]) => key === 'session_scheduled'), true)
})

test('custom and larger-team quotes need explicit written amounts', () => {
  const large = createWrittenOffer({ service: 'remote', users: 5 }, {
    scopeSummary: 'Remote support for five named employees and their agreed accounts.',
    monthlyCents: 59000, setupCents: 50000, oneTimeCents: null,
  }, actor, now)
  assert.equal(large.supported_users, 5)
  assert.equal(large.monthly_cents, 59000)
  assert.throws(() => createWrittenOffer({ service: 'remote', users: 1 }, {
    scopeSummary: 'Remote support for this customer.',
    monthlyCents: 25000, setupCents: 19900, oneTimeCents: null,
  }, actor, now), { status: 400 })
  assert.throws(() => createWrittenOffer(null, {
    scopeSummary: 'No request', monthlyCents: 50000, setupCents: 0,
  }, actor, now), { status: 409 })
})

test('only a properly accepted quote can begin onboarding; expired offers cannot be accepted', () => {
  const quoted = offer()
  assert.throws(() => transitionOrder(quoted, 'begin_onboarding', {}, actor, now), { status: 409 })
  assert.throws(() => transitionOrder(quoted, 'accept', { acceptedName: 'A Person', acknowledged: true }, actor, '2026-12-31T12:00:00.000Z'), { status: 409 })
  assert.throws(() => transitionOrder(quoted, 'accept', { acceptedName: 'A Person', acknowledged: false }, actor, now), { status: 400 })
  const accepted = apply(quoted, 'accept', { acceptedName: 'Alex Client', acknowledged: true })
  assert.equal(accepted.status, 'accepted')
  assert.equal(accepted.accepted_by, actor)
  assert.throws(() => transitionOrder(accepted, 'accept', { acceptedName: 'Alex Client', acknowledged: true }, actor, now), { status: 409 })
  assert.equal(apply(accepted, 'begin_onboarding').status, 'onboarding')
})

test('activation refuses missing agreement, receipt and verified service-specific checks', () => {
  const accepted = apply(offer('managed'), 'accept', { acceptedName: 'Alex Client', acknowledged: true })
  const onboarding = apply(accepted, 'begin_onboarding')
  const blockers = activationBlockers(onboarding)
  assert.ok(blockers.some((text) => text.includes('agreement')))
  assert.ok(blockers.some((text) => text.includes('payment')))
  assert.ok(blockers.some((text) => text.includes('computer')))
  assert.throws(() => transitionOrder(onboarding, 'activate', {}, actor, now), { status: 409 })
})

test('verified external evidence and every mandatory check unlock the full activation transition', () => {
  let state = apply(apply(offer('secure'), 'accept', { acceptedName: 'Alex Client', acknowledged: true }), 'begin_onboarding')
  assert.throws(() => transitionOrder(state, 'record_agreement', { reference: 'contract-981', attested: false }, actor, now), { status: 400 })
  state = apply(state, 'record_agreement', { reference: 'signed-msa-981', attested: true })
  state = apply(state, 'record_payment', { reference: 'receipt-981', attested: true })
  for(const [key] of ACTIVATION_CHECKS.secure) {
    state = apply(state, 'verify_check', { checkKey: key, evidence: 'verified-ticket-or-asset-' + key })
  }
  assert.deepEqual(activationBlockers(state), [])
  state = apply(state, 'activate')
  assert.equal(state.status, 'active')
  assert.ok(state.activated_at)
  assert.equal(state.activated_by, actor)
  assert.throws(() => transitionOrder(state, 'activate', {}, actor, now), { status: 409 })
})

test('unknown checks, unsupported actions and declined offers cannot write arbitrary evidence', () => {
  let state = apply(apply(offer('remote'), 'accept', { acceptedName: 'Alex Client', acknowledged: true }), 'begin_onboarding')
  assert.throws(() => transitionOrder(state, 'verify_check', { checkKey: 'not_real', evidence: 'invented' }, actor, now), { status: 400 })
  assert.throws(() => transitionOrder(state, 'set_paid', { paid: true }, actor, now), { status: 409 })
  const declined = apply(offer('one_time'), 'decline')
  assert.equal(declined.status, 'declined')
  assert.throws(() => transitionOrder(declined, 'activate', {}, actor, now), { status: 409 })
})
