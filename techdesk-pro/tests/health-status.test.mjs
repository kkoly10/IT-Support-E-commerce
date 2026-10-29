import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveHealthState, HEALTH_STALE_AFTER_MS } from '../lib/health-status.mjs'

const NOW = Date.parse('2026-10-29T14:00:00.000Z')
const check = (minutesAgo, metadata = {}) => ({
  created_at: new Date(NOW - minutesAgo * 60_000).toISOString(),
  metadata: { status: 'healthy', severity: 'info', ...metadata },
})

test('loading and failed reads cannot reuse a previously positive status', () => {
  const events = [check(1)]
  assert.equal(deriveHealthState({ events, now: NOW, loadState: 'loading' }).status, 'loading')
  assert.equal(deriveHealthState({ events, now: NOW, loadState: 'error' }).status, 'error')
})

test('no events, invalid dates, and unclassified results remain unknown', () => {
  assert.equal(deriveHealthState({ now: NOW }).status, 'unknown')
  assert.equal(deriveHealthState({ events: [{ created_at: 'invalid' }], now: NOW }).status, 'unknown')
  assert.equal(deriveHealthState({ events: [check(1, { status: null })], now: NOW }).status, 'unknown')
})

test('an explicit recent healthy check can be current and has an actual timestamp', () => {
  const event = check(60)
  assert.deepEqual(deriveHealthState({ events: [event], now: NOW }), {
    status: 'current', reason: null, latestCheckedAt: event.created_at,
  })
})

test('the latest check becomes stale as wall-clock time advances beyond two hours', () => {
  const events = [check(120)]
  assert.equal(deriveHealthState({ events, now: NOW }).status, 'current')
  assert.equal(deriveHealthState({ events, now: NOW + 1 }).status, 'stale')
  assert.equal(HEALTH_STALE_AFTER_MS, 120 * 60_000)
})

test('an old critical finding is historical, not a claim about current health', () => {
  assert.equal(deriveHealthState({
    events: [check(121, { status: 'error', severity: 'critical' })], now: NOW,
  }).status, 'stale')
})

test('warnings and critical findings in the latest batch override successes', () => {
  const warning = check(2, { status: 'warning', severity: 'warning' })
  const critical = check(3, { status: 'error', severity: 'critical' })
  assert.equal(deriveHealthState({ events: [check(1), warning], now: NOW }).status, 'warning')
  assert.equal(deriveHealthState({ events: [warning, check(1), critical], now: NOW }).status, 'critical')
})

test('a later successful batch can replace an earlier failure regardless of input order', () => {
  assert.equal(deriveHealthState({
    events: [check(60, { status: 'error', severity: 'critical' }), check(1)], now: NOW,
  }).status, 'current')
})

test('actual check time takes precedence over a later database insertion time', () => {
  const event = check(1, { checked_at: check(121).created_at })
  assert.equal(deriveHealthState({ events: [event], now: NOW }).status, 'stale')
})

test('implausible future timestamps cannot produce a positive status', () => {
  assert.equal(deriveHealthState({ events: [check(-10)], now: NOW }).status, 'unknown')
})
