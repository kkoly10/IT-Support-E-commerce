import { calculateEstimate, SERVICE_CATALOG } from './service-catalog.js'

export class ActivationError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

// Every managed tier has its own real handoff requirements. A verified check
// is an operator attestation with a concrete evidence reference; a checked
// box in the browser alone cannot activate an account.
export const ACTIVATION_CHECKS = Object.freeze({
  one_time: [
    ['primary_contact', 'Primary contact confirmed'],
    ['issue_scope', 'Issue and remote-session scope confirmed'],
    ['session_scheduled', 'Support session scheduled'],
  ],
  remote: [
    ['primary_contact', 'Primary contact confirmed'],
    ['support_test', 'Ticket and support contact tested'],
    ['access_review', 'Required account access reviewed (or documented as not needed)'],
  ],
  managed: [
    ['primary_contact', 'Primary contact confirmed'],
    ['support_test', 'Ticket and support contact tested'],
    ['access_review', 'Required account access reviewed'],
    ['endpoint_enrolled', 'Covered computer enrolled and reachable'],
    ['patch_baseline', 'Patch and health baseline verified'],
  ],
  secure: [
    ['primary_contact', 'Primary contact confirmed'],
    ['support_test', 'Ticket and support contact tested'],
    ['access_review', 'Required account access reviewed'],
    ['endpoint_enrolled', 'Covered computer enrolled and reachable'],
    ['patch_baseline', 'Patch and health baseline verified'],
    ['endpoint_protection', 'EDR/security protection active and verified'],
    ['recovery_scope', 'Backup/recovery responsibilities explicitly documented'],
  ],
  custom: [
    ['primary_contact', 'Primary contact confirmed'],
    ['written_scope', 'Custom operational scope and dependencies verified'],
    ['handoff_test', 'Agreed support/workload handoff tested'],
  ],
})

export const ORDER_STATUS_LABELS = Object.freeze({
  offered: 'Written offer available',
  accepted: 'Quote accepted',
  onboarding: 'Setup in progress',
  active: 'Support active',
  declined: 'Quote declined',
  withdrawn: 'Offer withdrawn',
})

function trimmed(value, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}
function cents(value, label, nullable = false) {
  if (nullable && (value === null || value === undefined || value === '')) return null
  const number = Number(value)
  if (!Number.isInteger(number) || number < 0 || number > 100000000) {
    throw new ActivationError(label + ' must be a valid nonnegative amount in cents.')
  }
  return number
}

export function checksFor(service) {
  return ACTIVATION_CHECKS[service] || ACTIVATION_CHECKS.custom
}

export function createWrittenOffer(selection, input, actorId, now = new Date().toISOString()) {
  const estimate = calculateEstimate(selection)
  const key = estimate.service
  if (!key || !Object.hasOwn(SERVICE_CATALOG, key)) {
    throw new ActivationError('The customer must select a service before Kocre prepares an offer.', 409)
  }
  const signer = trimmed(input?.authorizedSignerUserId, 36)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(signer)) {
    throw new ActivationError('Choose a specific authorized signer for this written offer.')
  }
  const scope = trimmed(input?.scopeSummary, 8000)
  if (scope.length < 12) throw new ActivationError('Write the specific included scope before publishing the offer.')
  const monthly = cents(input?.monthlyCents, 'Monthly amount', true)
  const setup = cents(input?.setupCents, 'Setup amount')
  const oneTime = cents(input?.oneTimeCents, 'One-time amount', true)
  const reason = trimmed(input?.pricingExplanation, 500)
  const shapeValid = key === 'one_time' ? monthly === null && oneTime > 0
    : key === 'custom' ? (monthly > 0 || oneTime > 0)
      : monthly > 0 && oneTime === null
  if (!shapeValid) throw new ActivationError('The offer amounts do not match the selected service.')
  const catalogMatch = estimate.requiresQuote || (
    monthly === (estimate.monthly === null ? null : estimate.monthly * 100) &&
    setup === (estimate.setup ?? 0) * 100 &&
    oneTime === (estimate.oneTime === null ? null : estimate.oneTime * 100)
  )
  if (!catalogMatch && reason.length < 12) {
    throw new ActivationError('Explain the nonstandard price before publishing a customized offer.')
  }
  return {
    service_key: key, supported_users: estimate.users,
    authorized_signer_user_id: signer, price_version: estimate.priceVersion,
    monthly_cents: monthly, setup_cents: setup, one_time_cents: oneTime,
    scope_summary: scope, exclusions: trimmed(input?.exclusions, 4000),
    external_costs: trimmed(input?.externalCosts, 4000),
    support_window: trimmed(input?.supportWindow, 500) || 'As agreed in writing',
    pricing_explanation: reason,
    source_selection: { service: estimate.service, users: estimate.users },
    quote_valid_until: new Date(Date.parse(now) + 30 * 86400000).toISOString(),
    offered_at: now, offered_by: actorId, status: 'offered',
    check_evidence: {}, revision: 0,
  }
}

export function activationBlockers(order) {
  if (!order) return ['No written offer exists']
  const issues = []
  if (order.status !== 'onboarding') issues.push('Quote must be accepted and onboarding started')
  if (!order.accepted_at || !order.accepted_by) issues.push('Primary contact must accept the quote')
  if (!order.agreement_verified_at || !order.agreement_reference) issues.push('Executed non-draft agreement must be verified')
  if (!order.payment_verified_at || !order.payment_reference) issues.push('External payment receipt must be verified')
  for (const [key, label] of checksFor(order.service_key)) {
    const entry = order.check_evidence?.[key]
    if (!entry?.verifiedAt || !entry?.evidence) issues.push(label)
  }
  return issues
}

function evidence(value) {
  const text = trimmed(value, 1000)
  if (text.length < 8) throw new ActivationError('Enter an evidence reference with at least eight characters.')
  return text
}

export function transitionOrder(order, action, payload, actorId, now = new Date().toISOString()) {
  if (!order || !actorId) throw new ActivationError('A valid order and signed-in actor are required.', 403)
  const status = order.status
  const allowed = {
    accept: ['offered'], decline: ['offered'], withdraw: ['offered'],
    begin_onboarding: ['accepted'],
    record_agreement: ['accepted', 'onboarding'],
    record_payment: ['accepted', 'onboarding'],
    verify_check: ['onboarding'],
    activate: ['onboarding'],
  }
  if (!allowed[action]?.includes(status)) {
    throw new ActivationError('This action is not available for the current order state. Reload the latest record.', 409)
  }
  if (action === 'accept') {
    if (Date.parse(order.quote_valid_until) <= Date.parse(now)) throw new ActivationError('This offer has expired. Ask Kocre for a new quote.', 409)
    const acceptedName = trimmed(payload?.acceptedName, 120)
    if (!payload?.acknowledged || acceptedName.length < 2) throw new ActivationError('Confirm the quote and provide your full name.')
    return { status: 'accepted', accepted_at: now, accepted_by: actorId, accepted_name: acceptedName }
  }
  if (action === 'decline') return { status: 'declined' }
  if (action === 'withdraw') return { status: 'withdrawn' }
  if (action === 'begin_onboarding') return { status: 'onboarding', onboarding_started_at: now, onboarding_started_by: actorId }
  if (action === 'record_agreement') {
    if (payload?.attested !== true) throw new ActivationError('Confirm that the referenced agreement is executed and not a draft.')
    return { agreement_reference: evidence(payload.reference), agreement_verified_at: now, agreement_verified_by: actorId }
  }
  if (action === 'record_payment') {
    if (payload?.attested !== true) throw new ActivationError('Confirm you checked the actual receipt or payment ledger.')
    return { payment_reference: evidence(payload.reference), payment_verified_at: now, payment_verified_by: actorId }
  }
  if (action === 'verify_check') {
    const key = trimmed(payload?.checkKey, 100)
    if (!checksFor(order.service_key).some(([k]) => k === key)) throw new ActivationError('Unknown onboarding requirement.')
    return {
      check_evidence: {
        ...(order.check_evidence || {}),
        [key]: { evidence: evidence(payload.evidence), verifiedAt: now, verifiedBy: actorId },
      },
    }
  }
  const blockers = activationBlockers(order)
  if (blockers.length) throw new ActivationError('Cannot activate: ' + blockers.join('; '), 409)
  return { status: 'active', activated_at: now, activated_by: actorId }
}

export function formatOrderAmount(centsValue) {
  if (centsValue === null || centsValue === undefined) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(centsValue / 100)
}
