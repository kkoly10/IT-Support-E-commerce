import { createHash } from 'node:crypto'
import { SERVICE_CATALOG, calculateEstimate } from './service-catalog.js'

const ORGANIZATION_FIELDS = 'id, name, plan, client_status, payment_status, agreement_status, onboarding_status, needs_human_review, discovery_profile'

export class ServiceRequestError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
  }
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]))
  }
  return value
}

export function discoveryRevision(discovery) {
  return createHash('sha256').update(JSON.stringify(canonical(discovery || {}))).digest('hex')
}

function list(value, label) {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.length > 12) throw new ServiceRequestError(`${label} must contain at most 12 items.`)
  const result = []
  const seen = new Set()
  for (const entry of value) {
    if (typeof entry !== 'string' || entry.length > 120 || /[\u0000-\u001f]/.test(entry)) {
      throw new ServiceRequestError(`Each ${label.toLowerCase()} item must be text of at most 120 characters.`)
    }
    const item = entry.trim()
    if (item && !seen.has(item.toLowerCase())) {
      result.push(item)
      seen.add(item.toLowerCase())
    }
  }
  return result
}

export function normalizeServiceRequestInput(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new ServiceRequestError('Invalid service request.')
  if (typeof payload.service !== 'string' || !Object.hasOwn(SERVICE_CATALOG, payload.service)) {
    throw new ServiceRequestError('Choose a service before submitting your request.')
  }
  const users = payload.service === 'one_time' ? 1
    : typeof payload.users === 'number' ? payload.users
      : /^[1-9]\d{0,2}$/.test(String(payload.users || '')) ? Number(payload.users) : NaN
  if (!Number.isInteger(users) || users < 1 || users > 250) throw new ServiceRequestError('Enter a whole number of users from 1 to 250.')
  if (payload.note !== undefined && (typeof payload.note !== 'string' || payload.note.length > 2000 || payload.note.includes('\u0000'))) {
    throw new ServiceRequestError('Your note must be text of at most 2,000 characters.')
  }
  return {
    service: payload.service, users,
    systems: list(payload.systems, 'Systems'), projects: list(payload.projects, 'Projects'), note: (payload.note || '').trim(),
  }
}

// Service requests are nonbinding shared discovery suggestions. Every verified
// client member may suggest needs for their own workspace; this never grants
// authority to accept an agreement, change a plan, or authorize a charge.
export function mayRequestServices(profile, user, organizationId = profile?.organization_id) {
  if (!user?.id || !user.email || !user.email_confirmed_at || profile?.id !== user.id) return false
  if (profile?.role === 'admin') return true
  if (profile?.role !== 'client') return false
  return Boolean(profile.organization_id) && profile.organization_id === organizationId
}

export async function loadServiceRequestWorkspace(service, organizationId) {
  const { data, error } = await service.from('organizations')
    .select(ORGANIZATION_FIELDS).eq('id', organizationId).maybeSingle()
  if (error) throw new ServiceRequestError('Could not load your service request. Please retry.', 503)
  if (!data) throw new ServiceRequestError('Workspace not found.', 404)
  return data
}

// JSONB equality is evaluated in the same UPDATE statement. A simultaneous
// discovery edit or request cannot be silently overwritten by a stale read.
export async function updateDiscoveryWithCAS(service, { organizationId, previous, next, markReview = false }) {
  let query = service.from('organizations').update({
    discovery_profile: next, ...(markReview ? { needs_human_review: true } : {}),
  }).eq('id', organizationId)
  query = previous === null || previous === undefined
    ? query.is('discovery_profile', null)
    : query.eq('discovery_profile', JSON.stringify(previous))
  const { data, error } = await query.select(ORGANIZATION_FIELDS).maybeSingle()
  if (error) throw new ServiceRequestError('Could not save your service request. Please retry.', 503)
  if (!data) throw new ServiceRequestError('Your workspace changed while this form was open. Reload the latest request before saving.', 409)
  return data
}

export function serviceWorkspaceResponse(org, canRequest) {
  const discovery = org.discovery_profile || {}
  return {
    organization: {
      id: org.id, name: org.name, plan: org.plan, clientStatus: org.client_status,
      paymentStatus: org.payment_status, agreementStatus: org.agreement_status,
      onboardingStatus: org.onboarding_status, needsHumanReview: Boolean(org.needs_human_review),
    },
    selection: discovery.service_selection || null,
    revision: discoveryRevision(discovery), canRequest,
  }
}

export async function saveServiceRequest({ service, user, profile, organization, payload, now = new Date().toISOString(), source = 'portal' }) {
  if (!user?.email_confirmed_at) throw new ServiceRequestError('Confirm your email before requesting a service.', 403)
  if (profile?.id !== user.id || (profile.role !== 'admin' && profile.organization_id !== organization.id)) {
    throw new ServiceRequestError('This workspace is not available to your account.', 403)
  }
  if (!mayRequestServices(profile, user, organization.id)) throw new ServiceRequestError('Only verified members of this workspace can suggest service needs.', 403)
  const input = normalizeServiceRequestInput(payload)
  if (typeof payload.expectedRevision !== 'string' || !/^[a-f0-9]{64}$/.test(payload.expectedRevision)) {
    throw new ServiceRequestError('Reload this page before submitting your request.', 409)
  }
  if (payload.expectedRevision !== discoveryRevision(organization.discovery_profile)) {
    throw new ServiceRequestError('Your workspace changed while this form was open. Reload the latest request before saving.', 409)
  }
  const requested = {
    ...calculateEstimate(input), systems: input.systems, projects: input.projects, note: input.note,
    requestedAt: now, requestedBy: user.id, source, status: 'requested',
  }
  const org = await updateDiscoveryWithCAS(service, {
    organizationId: organization.id, previous: organization.discovery_profile,
    next: { ...(organization.discovery_profile || {}), service_selection: requested }, markReview: true,
  })
  return serviceWorkspaceResponse(org, true)
}

function scopedOrganization(profile, supplied) {
  if (!profile || !['client', 'admin'].includes(profile.role)) throw new ServiceRequestError('This account cannot access workspace service requests.', 403)
  if (supplied && (typeof supplied !== 'string' || (profile.role !== 'admin' && supplied !== profile.organization_id))) {
    throw new ServiceRequestError('This workspace is not available to your account.', 403)
  }
  const id = supplied || profile.organization_id
  if (!id) throw new ServiceRequestError('Finish setting up your workspace before choosing a service.', 400)
  return id
}

export function createServiceRequestHandlers({ requireUser, now = () => new Date().toISOString() }) {
  const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
  async function handle(request, writing) {
    try {
      if (writing) {
        const origin = request.headers.get('origin')
        if (origin && origin !== new URL(request.url).origin) return json({ error: 'This request must come from this website.' }, 403)
      }
      const auth = await requireUser()
      if (auth.error) return json({ error: auth.error }, auth.status)
      if (!auth.user?.email_confirmed_at) return json({ error: 'Confirm your email before requesting a service.' }, 403)
      let payload = {}
      if (writing) {
        try { payload = await request.json() } catch { return json({ error: 'Invalid service request.' }, 400) }
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return json({ error: 'Invalid service request.' }, 400)
      }
      const supplied = writing ? payload.organizationId : new URL(request.url).searchParams.get('organizationId')
      const organizationId = scopedOrganization(auth.profile, supplied)
      const organization = await loadServiceRequestWorkspace(auth.service, organizationId)
      if (!writing) return json(serviceWorkspaceResponse(organization, mayRequestServices(auth.profile, auth.user, organizationId)))
      return json(await saveServiceRequest({
        service: auth.service, user: auth.user, profile: auth.profile,
        organization, payload, now: now(),
      }))
    } catch (error) {
      const known = error instanceof ServiceRequestError
      if (!known) console.error('Service request failed.', { code: error?.code || 'unknown' })
      return json({ error: known ? error.message : 'Could not process your service request. Please retry.' }, known ? error.status : 503)
    }
  }
  return { GET: (request) => handle(request, false), POST: (request) => handle(request, true) }
}
