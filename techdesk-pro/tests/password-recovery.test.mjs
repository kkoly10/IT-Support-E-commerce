import test from 'node:test'
import assert from 'node:assert/strict'
import { signOutRecoverySession } from '../lib/password-recovery.js'

test('recovery sign-out succeeds only on an explicit successful Auth response', async () => {
  assert.deepEqual(await signOutRecoverySession({signOut:async()=>({error:null})}), {signedOut:true})
})
test('recovery sign-out errors returned in a response do not count as signed out', async () => {
  assert.deepEqual(await signOutRecoverySession({signOut:async()=>({error:{message:'network failed'}})}), {signedOut:false})
})
test('rejected or missing responses cannot falsely report a cleared session', async () => {
  assert.deepEqual(await signOutRecoverySession({signOut:async()=>{throw Error('unavailable')}}), {signedOut:false})
  assert.deepEqual(await signOutRecoverySession({signOut:async()=>undefined}), {signedOut:false})
})
