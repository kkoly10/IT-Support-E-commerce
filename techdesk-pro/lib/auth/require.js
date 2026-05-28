import { createClient as createServerSupabaseClient } from '../supabase/server'

// Require an authenticated Supabase session. When `adminOnly` is true, also
// require profiles.role = 'admin'.
//
// Returns either { user, profile } on success or { response } when the caller
// should be rejected — the route's POST/GET should `return result.response`.
export async function requireAuth({ adminOnly = false } = {}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { response: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (!adminOnly) return { user, profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, organization_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { response: Response.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { user, profile }
}

// Server-to-server calls (cron, post-create chains) send this header instead
// of carrying a Supabase session. Refuses if INTERNAL_API_SECRET isn't set
// in the environment so we never accidentally fall through to open access.
export function isInternalRequest(request) {
  const expected = process.env.INTERNAL_API_SECRET
  if (!expected) return false
  return request.headers.get('x-internal-secret') === expected
}

// Cron-only routes such as /api/ai/sentinel use a separate secret.
export function isCronRequest(request) {
  const expected = process.env.CRON_SECRET
  if (!expected) return false
  return request.headers.get('authorization') === `Bearer ${expected}`
}
