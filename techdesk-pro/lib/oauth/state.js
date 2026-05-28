import crypto from 'node:crypto'

// 30 minutes is generous enough for OAuth consent screens without inviting
// long-lived replay.
const MAX_STATE_AGE_MS = 30 * 60 * 1000

function getSecret() {
  const secret =
    process.env.OAUTH_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    throw new Error(
      'OAUTH_STATE_SECRET (or SUPABASE_SERVICE_ROLE_KEY) must be set to sign OAuth state.'
    )
  }
  return secret
}

function b64urlEncode(buf) {
  return Buffer.from(buf).toString('base64url')
}

function b64urlDecode(str) {
  return Buffer.from(str, 'base64url')
}

function hmac(payloadB64) {
  return crypto
    .createHmac('sha256', getSecret())
    .update(payloadB64)
    .digest()
}

export function signState(payload) {
  const body = { ...payload, timestamp: payload.timestamp ?? Date.now() }
  const payloadB64 = b64urlEncode(JSON.stringify(body))
  const sigB64 = b64urlEncode(hmac(payloadB64))
  return `${payloadB64}.${sigB64}`
}

export function verifyState(state) {
  if (typeof state !== 'string' || !state.includes('.')) return null

  const [payloadB64, sigB64] = state.split('.', 2)
  if (!payloadB64 || !sigB64) return null

  let expected
  let received
  try {
    expected = hmac(payloadB64)
    received = b64urlDecode(sigB64)
  } catch {
    return null
  }

  if (expected.length !== received.length) return null
  if (!crypto.timingSafeEqual(expected, received)) return null

  let payload
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString('utf8'))
  } catch {
    return null
  }

  if (typeof payload?.timestamp !== 'number') return null
  if (Date.now() - payload.timestamp > MAX_STATE_AGE_MS) return null

  return payload
}
