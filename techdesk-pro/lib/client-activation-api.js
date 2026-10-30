import { discoveryRevision } from './service-request.js'
import { ActivationError, activationBlockers, createWrittenOffer, transitionOrder } from './client-activation.js'

const CURRENT_STATUSES = ['offered', 'accepted', 'onboarding', 'active']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

function orgIdFor(auth, supplied) {
  if (auth.profile?.role === 'admin') {
    if (!UUID.test(String(supplied || ''))) throw new ActivationError('Select a client organization.', 400)
    return supplied
  }
  if (auth.profile?.role !== 'client' || !auth.profile.organization_id) throw new ActivationError('Client workspace required.', 403)
  if (supplied && supplied !== auth.profile.organization_id) throw new ActivationError('This organization is not available to your account.', 403)
  return auth.profile.organization_id
}

function checked(result, message) {
  if (result.error) throw new ActivationError(message, 503)
  return result.data
}

async function loadOrg(service, orgId) {
  const result = await service.from('organizations')
    .select('id, name, client_status, plan, discovery_profile')
    .eq('id', orgId).maybeSingle()
  const org = checked(result, 'Could not load the organization. Please retry.')
  if (!org) throw new ActivationError('Organization not found.', 404)
  return org
}

async function loadOrders(service, orgId) {
  return checked(await service.from('service_orders')
    .select('*').eq('organization_id', orgId)
    .order('offered_at', { ascending: false }).limit(10),
  'Client Activation is not configured or is unavailable. Kocre must apply the service-orders migration before using this workflow.') || []
}

async function designatedSigners(service, orgId) {
  const profiles = checked(await service.from('profiles')
    .select('id, email, full_name, role')
    .eq('organization_id', orgId).eq('role', 'client'),
  'Could not load the customer portal members for the offer.')
  return profiles || []
}

async function updateOrder(service, order, patch) {
  const revision = order.revision
  const result = await service.from('service_orders')
    .update({ ...patch, revision: revision + 1, updated_at: new Date().toISOString() })
    .eq('id', order.id).eq('organization_id', order.organization_id)
    .eq('revision', revision).select('*').maybeSingle()
  const updated = checked(result, 'Could not update the service order. Please retry.')
  if (!updated) throw new ActivationError('Another update changed this order. Reload the latest state before continuing.', 409)
  return updated
}

async function syncOrganization(service, order) {
  if (order.status === 'onboarding') {
    checked(await service.from('organizations')
      .update({ client_status: 'onboarding', onboarding_status: 'in_progress' })
      .eq('id', order.organization_id),
    'Offer accepted, but customer onboarding could not be synchronized. Retry this action.')
  }
  if (order.status === 'active') {
    checked(await service.from('organizations').update({
      plan: order.service_key, team_size: order.supported_users,
      client_status: 'active', onboarding_status: 'completed', support_ready: true,
      agreement_status: 'signed', payment_status: 'active',
      support_activated_at: order.activated_at, needs_human_review: false,
    }).eq('id', order.organization_id),
    'Order activated, but the client account could not be synchronized. Retry activation.')
  }
}

export function createClientActivationHandlers({ requireUser, now = () => new Date().toISOString() }) {
  async function authenticate() {
    const auth = await requireUser()
    if (auth.error) throw new ActivationError(auth.error, auth.status)
    if (!auth.user?.email_confirmed_at) throw new ActivationError('Confirm your email before reviewing a service offer.', 403)
    return auth
  }

  async function GET(request) {
    try {
      const auth = await authenticate()
      const orgId = orgIdFor(auth, new URL(request.url).searchParams.get('organizationId'))
      const [org, orders] = await Promise.all([
        loadOrg(auth.service, orgId), loadOrders(auth.service, orgId),
      ])
      return json({
        organization: { id: org.id, name: org.name, clientStatus: org.client_status, plan: org.plan },
        selection: org.discovery_profile?.service_selection || null,
        requestRevision: discoveryRevision(org.discovery_profile),
        orders, isAdmin: auth.profile.role === 'admin',
        signerCandidates: auth.profile.role === 'admin' ? await designatedSigners(auth.service, orgId) : [],
        canAccept: auth.profile.role === 'client' && orders.some((order) =>
          order.status === 'offered' && order.authorized_signer_user_id === auth.user.id
        ),
      })
    } catch (error) {
      const known = error instanceof ActivationError
      if (!known) console.error('Activation GET failed.', { code: error?.code || 'unknown' })
      return json({ error: known ? error.message : 'Unable to retrieve activation records.' }, known ? error.status : 503)
    }
  }

  async function POST(request) {
    try {
      const origin = request.headers.get('origin')
      if (origin && origin !== new URL(request.url).origin) throw new ActivationError('This action must originate from Kocre IT.', 403)
      const auth = await authenticate()
      const payload = await request.json().catch(() => null)
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new ActivationError('Invalid activation action.')
      const orgId = orgIdFor(auth, payload.organizationId)
      const isAdmin = auth.profile.role === 'admin'
      const action = payload.action
      if (action === 'offer') {
        if (!isAdmin) throw new ActivationError('Only Kocre can publish an offer.', 403)
        const org = await loadOrg(auth.service, orgId)
        if (org.client_status === 'active') throw new ActivationError('Existing active clients require a separate renewal/change-order workflow.', 409)
        if (payload.expectedRequestRevision !== discoveryRevision(org.discovery_profile)) {
          throw new ActivationError('The customer changed their request. Reload the latest request before quoting.', 409)
        }
        const current = (await loadOrders(auth.service, orgId)).find((o) => CURRENT_STATUSES.includes(o.status))
        if (current) throw new ActivationError('A current offer or activated service already exists. Withdraw the old offer before publishing another.', 409)
        const candidates = await designatedSigners(auth.service, orgId)
        if (!candidates.some((candidate) => candidate.id === payload.authorizedSignerUserId)) {
          throw new ActivationError('Choose an existing client portal user as the authorized offer signer.', 403)
        }
        const offer = createWrittenOffer(org.discovery_profile?.service_selection, payload, auth.user.id, now())
        const inserted = checked(await auth.service.from('service_orders')
          .insert({ ...offer, organization_id: orgId }).select('*').single(),
        'Could not publish the written offer. Check for a duplicate current offer and retry.')
        return json({ order: inserted, message: 'Offer published in the customer portal. Notify the client separately; no email was sent.' }, 201)
      }

      if (!UUID.test(String(payload.orderId || ''))) throw new ActivationError('Select a valid service order.')
      const order = checked(await auth.service.from('service_orders')
        .select('*').eq('id', payload.orderId).eq('organization_id', orgId).maybeSingle(),
      'Could not load this service order.')
      if (!order) throw new ActivationError('Service order not found.', 404)
      if (!Number.isInteger(payload.expectedRevision) || payload.expectedRevision !== order.revision) {
        throw new ActivationError('This order changed. Reload the latest state before continuing.', 409)
      }
      // A prior order transition may have succeeded while its organization
      // update failed. The operator can explicitly retry the idempotent sync.
      if (isAdmin && (
        (action === 'activate' && order.status === 'active' && order.activated_at) ||
        (action === 'begin_onboarding' && order.status === 'onboarding' && order.onboarding_started_at)
      )) {
        await syncOrganization(auth.service, order)
        return json({ order, blockers: order.status === 'onboarding' ? activationBlockers(order) : [] })
      }
      if (['accept', 'decline'].includes(action)) {
        // The signed-in user must be exactly the Kocre-designated signer for
        // this order. Editable organization contacts are NOT acceptance
        // authority and cannot self-promote an ordinary member.
        if (isAdmin || auth.user.id !== order.authorized_signer_user_id) {
          throw new ActivationError('Only the Kocre-designated authorized signer may accept or decline this offer.', 403)
        }
      } else if (!isAdmin) {
        throw new ActivationError('Only Kocre can verify setup evidence or activate support.', 403)
      }

      // The complete order object, not browser-provided flags, is the sole
      // source for deciding which transition is allowed.
      const patch = transitionOrder(order, action, payload, auth.user.id, now())
      const updated = await updateOrder(auth.service, order, patch)
      if (action === 'begin_onboarding' || action === 'activate') await syncOrganization(auth.service, updated)
      return json({ order: updated, blockers: updated.status === 'onboarding' ? activationBlockers(updated) : [] })
    } catch (error) {
      const known = error instanceof ActivationError
      if (!known) console.error('Activation POST failed.', { code: error?.code || 'unknown' })
      return json({ error: known ? error.message : 'Could not update the activation record. Please retry.' }, known ? error.status : 503)
    }
  }
  return { GET, POST }
}
