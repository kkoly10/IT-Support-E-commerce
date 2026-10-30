import { normalizeSelection, signupHref } from './service-catalog.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function text(value, limit) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : ''
}

// This is editable form context, never an identity, role, or entitlement claim.
export function normalizeSignupContext(input = {}, fallback = {}) {
  const value = input && typeof input === 'object' && !Array.isArray(input) ? input : {}
  const previous = fallback && typeof fallback === 'object' ? fallback : {}
  const selected = Object.hasOwn(value, 'serviceSelection') ? value.serviceSelection : previous.serviceSelection
  const selection = normalizeSelection(selected)
  const assessmentId = text(value.assessmentId ?? previous.assessmentId, 36)
  return {
    fullName: text(value.fullName ?? previous.fullName, 120),
    companyName: text(value.companyName ?? previous.companyName, 160),
    accountType: (value.accountType ?? previous.accountType) === 'business' ? 'business' : 'personal',
    serviceSelection: selection.service ? selection : null,
    assessmentId: UUID.test(assessmentId) ? assessmentId : null,
  }
}

export function selectionFromParams(params) {
  const selection = normalizeSelection({ service: params.get('service'), users: params.get('users') })
  return selection.service ? selection : null
}

export function signupResumeHref(selection) {
  const path = signupHref(selection || {})
  return `${path}${path.includes('?') ? '&' : '?'}resume=1`
}

export function safeAuthNext(value, fallback = '/portal/dashboard') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f]/.test(value)) return fallback
  const path = new URL(value, 'https://local.invalid')
  const allowed = path.pathname === '/signup' || path.pathname === '/portal' || path.pathname.startsWith('/portal/')
  return path.origin === 'https://local.invalid' && allowed ? `${path.pathname}${path.search}` : fallback
}
