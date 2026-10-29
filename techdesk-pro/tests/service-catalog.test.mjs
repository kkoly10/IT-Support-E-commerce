import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateEstimate, normalizeSelection, signupHref } from '../lib/service-catalog.js'

test('published estimates match the agreed one-, two-, five-, and ten-person examples', () => {
  const examples = [
    [1, { remote: 149, managed: 229, secure: 299 }],
    [2, { remote: 198, managed: 328, secure: 428 }],
    [5, { remote: 345, managed: 625, secure: 815 }],
    [10, { remote: 590, managed: 1120, secure: 1460 }],
  ]
  const setup = { remote: 199, managed: 499, secure: 699 }

  for (const [users, prices] of examples) {
    for (const service of ['remote', 'managed', 'secure']) {
      const estimate = calculateEstimate({ service, users })
      assert.equal(estimate.monthly, prices[service])
      assert.equal(estimate.setup, setup[service])
      assert.equal(estimate.totalInitial, prices[service] + setup[service])
      assert.equal(estimate.requiresQuote, users > 2)
    }
  }
})

test('larger-team links, signup, and estimates all use fully custom pricing', () => {
  for (const service of ['remote', 'managed', 'secure', 'custom']) {
    const estimate = calculateEstimate({ service, users: 11 })
    assert.equal(estimate.service, 'custom')
    assert.equal(estimate.users, 11)
    assert.equal(estimate.monthly, null)
    assert.equal(estimate.setup, null)
    assert.equal(estimate.totalInitial, null)
    assert.equal(estimate.requiresQuote, true)
    assert.equal(signupHref({ service, users: 11 }), '/signup?service=custom&users=11')
  }
})

test('one-time help has one session and no recurring charge, regardless of roster input', () => {
  const estimate = calculateEstimate({ service: 'one_time', users: 10 })
  assert.equal(estimate.users, 1)
  assert.equal(estimate.oneTime, 125)
  assert.equal(estimate.monthly, null)
  assert.equal(estimate.setup, 0)
  assert.equal(estimate.totalInitial, 125)
  assert.equal(signupHref(estimate), '/signup?service=one_time&users=1')
})

test('exploratory and invalid selections cannot silently select a paid service', () => {
  for (const selection of [undefined, {}, { service: 'unknown' }, { service: '__proto__' }]) {
    assert.equal(normalizeSelection(selection).service, null)
    assert.equal(calculateEstimate(selection).totalInitial, null)
    assert.equal(signupHref(selection), '/signup')
  }
})
