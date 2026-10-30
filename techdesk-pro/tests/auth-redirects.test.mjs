import test from 'node:test'
import assert from 'node:assert/strict'
import { confirmationDestinations } from '../lib/auth-redirects.js'

function destinations(query='') { return confirmationDestinations(new URL('https://kocreit.com/auth/confirm'+query)) }

test('ordinary signup confirmation retains the selected service and returns to verified signup completion', () => {
  const result = destinations('?code=opaque&service=managed&users=2')
  assert.equal(result.recovery, false)
  assert.equal(result.success, '/signup?service=managed&users=2&resume=1')
  assert.ok(result.failure.startsWith('/login?auth_error=confirmation&next='))
})
test('password recovery links go to reset form, not the signup funnel', () => {
  const result=destinations('?flow=recovery&code=opaque&service=secure&users=9')
  assert.equal(result.recovery,true)
  assert.equal(result.success,'/reset-password')
  assert.equal(result.failure,'/forgot-password?auth_error=recovery')
})
test('untrusted next and external flow parameters never control the destination', () => {
  const result=destinations('?flow=recovery&next=https%3A%2F%2Fevil.example')
  assert.equal(result.success,'/reset-password')
  assert.equal(result.failure,'/forgot-password?auth_error=recovery')
  const other=destinations('?next=https%3A%2F%2Fevil.example')
  assert.equal(other.success,'/signup?resume=1')
})
