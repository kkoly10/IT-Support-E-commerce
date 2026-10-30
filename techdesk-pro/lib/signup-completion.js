import { createHash } from 'node:crypto'
import { calculateEstimate } from './service-catalog.js'
import { normalizeSignupContext } from './signup-context.js'
import { discoveryRevision, mayRequestServices, ServiceRequestError, updateDiscoveryWithCAS } from './service-request.js'

export class SignupError extends Error {
  constructor(message, status = 503) {
    super(message)
    this.status = status
  }
}

// Stable UUIDs let a verified user resume after a partial write. Never delete
// a workspace on failure or overwrite its lifecycle when a request is retried.
export function signupRecordId(kind, userId) {
  const hex = createHash('sha256').update(`kocre-signup:${kind}:${userId}`).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

function checked(result, message) {
  if (result.error) throw new SignupError(message)
  return result.data
}

export async function linkOwnedAssessment(service, { assessmentId, user, organizationId, now }) {
  if (!user?.email || !user.email_confirmed_at) throw new SignupError('Confirm your email before linking an assessment.', 403)
  if (!assessmentId) return { linked: false }
  const result = await service.from('assessment_submissions')
    .select('id, email, linked_organization_id').eq('id', assessmentId).maybeSingle()
  const assessment = checked(result, 'Your account is ready, but the assessment could not be linked. Please retry.')
  // The same response covers a missing record and someone else's record.
  if (!assessment || String(assessment.email).trim().toLowerCase() !== String(user.email).trim().toLowerCase()) {
    throw new SignupError('This assessment cannot be linked to your account.', 403)
  }
  if (assessment.linked_organization_id === organizationId) return { linked: true }
  if (assessment.linked_organization_id) throw new SignupError('This assessment is already linked to a workspace.', 409)
  const updated = checked(await service.from('assessment_submissions')
    .update({ linked_organization_id: organizationId, status: 'converted', converted_at: now })
    .eq('id', assessment.id).is('linked_organization_id', null).select('id').maybeSingle(),
  'Your account is ready, but the assessment could not be linked. Please retry.')
  if (!updated) throw new SignupError('This assessment was linked in another request. Please refresh.', 409)
  return { linked: true }
}

async function ensurePrimaryContact(service, profile, user, fullName) {
  // Contact flags are editable discovery data, not ownership evidence. Only
  // the verified creator of this deterministic signup workspace gets automatic
  // contact provisioning; legacy members' ordinary logins never alter contacts.
  if (profile.id !== user.id || profile.role !== 'client' || profile.organization_id !== signupRecordId('organization', user.id)) return
  const contacts = checked(await service.from('organization_contacts')
    .select('id, email, is_primary_contact').eq('organization_id', profile.organization_id),
  'Your account is ready, but contact setup needs a retry.') || []
  if (contacts.some((contact) => contact.is_primary_contact)) return
  const contactId = signupRecordId('contact', `${profile.organization_id}:${user.id}`)
  const match = contacts.find((contact) => contact.id === contactId || String(contact.email || '').trim().toLowerCase() === user.email.trim().toLowerCase())
  if (match) {
    await service.from('organization_contacts')
      .update({ is_primary_contact: true, role_type: 'primary', email: user.email })
      .eq('id', match.id).eq('organization_id', profile.organization_id)
  } else {
    await service.from('organization_contacts').upsert({
      id: contactId, organization_id: profile.organization_id,
      full_name: profile.full_name || fullName || user.email, email: user.email,
      role_type: 'primary', is_primary_contact: true, is_authorized_requester: true,
    }, { onConflict: 'id', ignoreDuplicates: true })
  }
  // Read back even an ignored duplicate; a successful write response alone
  // does not prove a primary contact exists. A competing completion is fine.
  const { data: primary, error } = await service.from('organization_contacts')
    .select('id').eq('organization_id', profile.organization_id).eq('is_primary_contact', true).maybeSingle()
  if (error || !primary) throw new SignupError('Your account is ready, but contact setup needs a retry.')
}

export async function completeVerifiedSignup({ service, user, payload = {}, now = new Date().toISOString() }) {
  if (!user?.email || !user.email_confirmed_at) throw new SignupError('Confirm your email before setting up your workspace.', 403)
  const context = normalizeSignupContext(payload, {
    ...user.user_metadata?.signup_context,
    fullName: user.user_metadata?.signup_context?.fullName || user.user_metadata?.full_name || '',
  })
  let profile = checked(await service.from('profiles')
    .select('id, organization_id, role, full_name, is_primary_contact').eq('id', user.id).maybeSingle(),
  'Could not check your account. Please retry.')
  if (profile?.role === 'admin') return { success: true, organizationId: profile.organization_id, next: '/admin/dashboard' }
  if (!profile?.organization_id && !context.fullName) throw new SignupError('Enter your name to finish setting up your account.', 400)

  const creatingWorkspace = !profile?.organization_id
  let org
  if (creatingWorkspace) {
    const organizationId = signupRecordId('organization', user.id)
    const slug = `workspace-${user.id}`
    const serviceSelection = context.serviceSelection ? {
      ...calculateEstimate(context.serviceSelection), requestedAt: now, source: 'signup', status: 'requested', requestedBy: user.id,
    } : null
    checked(await service.from('organizations').upsert({
      id: organizationId, name: context.companyName || `${context.fullName}'s workspace`, slug,
      plan: 'pending', client_status: 'lead', lead_interest: context.serviceSelection?.service || 'not_sure',
      primary_service: 'it', service_types: ['it'], team_size: context.serviceSelection?.users || null,
      needs_human_review: true, agreement_status: 'none', payment_status: 'none', onboarding_status: 'not_started',
      discovery_profile: {
        account_type: context.accountType, company_name: context.companyName || null,
        ...(serviceSelection ? { service_selection: serviceSelection } : {}),
      },
    }, { onConflict: 'id', ignoreDuplicates: true }), 'Could not create your workspace. Please retry.')
    org = checked(await service.from('organizations')
      .select('id, slug, discovery_profile').eq('id', organizationId).single(), 'Could not load your workspace. Please retry.')
    if (org.slug !== slug) throw new SignupError('Workspace setup needs assistance. Please contact Kocre IT.', 409)

    if (profile) {
      // Repair a client profile with no organization without moving a profile
      // that another concurrent request has already linked.
      checked(await service.from('profiles').update({
        organization_id: org.id, full_name: context.fullName, is_primary_contact: true,
      }).eq('id', user.id).eq('role', 'client').is('organization_id', null), 'Could not finish your account. Please retry.')
    } else {
      checked(await service.from('profiles').upsert({
        id: user.id, email: user.email, full_name: context.fullName,
        organization_id: org.id, role: 'client', is_primary_contact: true,
      }, { onConflict: 'id', ignoreDuplicates: true }), 'Could not finish your account. Please retry.')
    }
    profile = checked(await service.from('profiles')
      .select('id, organization_id, role, full_name, is_primary_contact').eq('id', user.id).single(),
    'Could not finish your account. Please retry.')
    if (!profile?.organization_id || profile.organization_id !== org.id || profile.role !== 'client') {
      throw new SignupError('Your account changed during setup. Please sign in again.', 409)
    }
  } else {
    org = checked(await service.from('organizations')
      .select('id, discovery_profile').eq('id', profile.organization_id).single(), 'Could not load your workspace. Please retry.')
    // Existing clients explicitly submit a selection. Old auth metadata never
    // replays a request or changes an accepted plan on a later sign-in.
  }

  // A retry may explicitly change the selection after the first organization
  // insert succeeded but profile creation failed. Apply it to this same draft
  // workspace, using CAS, without touching accepted plan or lifecycle fields.
  if (Object.hasOwn(payload, 'serviceSelection') && context.serviceSelection) {
    if (!mayRequestServices(profile, user, org.id)) throw new SignupError('Only verified members of this workspace can suggest service needs.', 403)
    if (!creatingWorkspace) {
      if (typeof payload.expectedRevision !== 'string' || !/^[a-f0-9]{64}$/.test(payload.expectedRevision)) {
        throw new SignupError('Reload this page before submitting your service request.', 409)
      }
      if (payload.expectedRevision !== discoveryRevision(org.discovery_profile)) {
        throw new SignupError('Your workspace changed while this form was open. Reload the latest request before saving.', 409)
      }
    }
    const previousSelection = org.discovery_profile?.service_selection || {}
    const preservedContext = {
      ...(Array.isArray(previousSelection.systems) ? { systems: previousSelection.systems } : {}),
      ...(Array.isArray(previousSelection.projects) ? { projects: previousSelection.projects } : {}),
      ...(typeof previousSelection.note === 'string' ? { note: previousSelection.note } : {}),
    }
    org = await updateDiscoveryWithCAS(service, {
      organizationId: org.id, previous: org.discovery_profile, markReview: true,
      next: {
        ...(org.discovery_profile || {}),
        service_selection: {
          ...calculateEstimate(context.serviceSelection), ...preservedContext,
          requestedAt: now, source: 'signup', status: 'requested', requestedBy: user.id,
        },
      },
    })
  }

  await ensurePrimaryContact(service, profile, user, context.fullName)
  let assessmentWarning = null
  if (context.assessmentId) {
    try {
      await linkOwnedAssessment(service, { assessmentId: context.assessmentId, user, organizationId: org.id, now })
    } catch (error) {
      assessmentWarning = error instanceof SignupError ? error.message : 'Your assessment could not be linked. Contact Kocre IT with its reference.'
    }
  }
  return {
    success: true, organizationId: org.id, next: '/portal/dashboard?welcome=1',
    ...(assessmentWarning ? { warning: assessmentWarning } : {}),
  }
}

export function createSignupHandler({ createSessionClient, getService, now = () => new Date().toISOString() }) {
  return async function POST(request) {
    try {
      const origin = request.headers.get('origin')
      if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'This request must come from this website.' }, { status: 403 })
      const session = await createSessionClient()
      const { data, error } = await session.auth.getUser()
      const user = data?.user
      if (error || !user?.id || !user.email) return Response.json({ error: 'Sign in to finish setting up your account.' }, { status: 401 })
      if (!user.email_confirmed_at) return Response.json({ error: 'Confirm your email before setting up your workspace.' }, { status: 403 })
      let payload
      try { payload = await request.json() } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }) }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return Response.json({ error: 'Invalid request.' }, { status: 400 })
      const result = await completeVerifiedSignup({ service: getService(), user, payload, now: now() })
      return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
    } catch (error) {
      const known = error instanceof SignupError || error instanceof ServiceRequestError
      if (!known) console.error('Signup completion failed.', { code: error?.code || 'unknown' })
      return Response.json({ error: known ? error.message : 'Could not finish account setup. Please retry.' }, { status: known ? error.status : 503 })
    }
  }
}
