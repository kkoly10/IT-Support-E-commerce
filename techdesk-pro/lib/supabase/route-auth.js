import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from './server'

let _service = null

export function getService() {
  if (!_service) {
    _service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  return _service
}

export async function requireUser() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Authentication required.', status: 401 }
  }

  const service = getService()
  const { data: profile } = await service
    .from('profiles')
    .select('id, organization_id, role, is_primary_contact, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return { error: 'No organization is linked to this account.', status: 400 }
  }

  return { user, profile, service }
}

export async function requireAdmin() {
  const result = await requireUser()
  if (result.error) return result
  if (result.profile.role !== 'admin') {
    return { error: 'Admin access required.', status: 403 }
  }
  return result
}

export function assertOrgAccess(orgId, profile) {
  if (!orgId) return { error: 'Missing organization id.', status: 400 }
  if (profile.role === 'admin') return null
  if (orgId !== profile.organization_id) {
    return { error: 'Not authorized for this organization.', status: 403 }
  }
  return null
}

export function assertResourceOrg(resourceOrgId, profile) {
  if (profile.role === 'admin') return null
  if (resourceOrgId !== profile.organization_id) {
    return { error: 'Not authorized for this resource.', status: 403 }
  }
  return null
}

// Allow trusted server-to-server calls from our own routes (e.g.
// post-create-ticket → triage-ticket / auto-resolve) without a user session.
// Returns true only if a non-empty INTERNAL_API_KEY is set and matches the
// Authorization header — never fail-open.
export function isInternalCall(request) {
  const secret = process.env.INTERNAL_API_KEY
  if (!secret) return false
  const header = request.headers.get('authorization') || ''
  return header === `Bearer ${secret}`
}
