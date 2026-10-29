import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateEstimate, normalizeSelection, signupHref } from '../lib/service-catalog.js'

test('published estimates match the agreed one-, two-, five-, and ten-person examples', () => {
  for (const [users, remote, managed] of [[1, 149, 199], [2, 198, 288], [5, 345, 555], [10, 590, 1000]]) {
    for (const [service, monthly, setup] of [['remote', remote, 199], ['managed', managed, 499]]) {
      const estimate = calculateEstimate({ service, users })
      assert.equal(estimate.monthly, monthly)
      assert.equal(estimate.setup, setup)
      assert.equal(estimate.totalInitial, monthly + setup)
      assert.equal(estimate.requiresQuote, users > 2)
    }
  }
})

test('larger-team links, signup, and estimates all use fully custom pricing', () => {
  for (const service of ['remote', 'managed', 'custom']) {
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
