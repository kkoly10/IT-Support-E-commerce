import { requireUser, assertOrgAccess } from '../../../../lib/supabase/route-auth'
import { linkOwnedAssessment, SignupError } from '../../../../lib/signup-completion'

export async function POST(request) {
  try {
    const auth = await requireUser()
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })
    let payload
    try { payload = await request.json() } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }) }
    const { assessmentId, organizationId } = payload || {}
    if (!assessmentId || !organizationId) return Response.json({ error: 'assessmentId and organizationId are required' }, { status: 400 })
    const denied = assertOrgAccess(organizationId, auth.profile)
    if (denied) return Response.json({ error: denied.error }, { status: denied.status })
    await linkOwnedAssessment(auth.service, {
      assessmentId, organizationId, user: auth.user, now: new Date().toISOString(),
    })
    return Response.json({ success: true })
  } catch (error) {
    const known = error instanceof SignupError
    if (!known) console.error('Assessment linking failed.', { code: error?.code || 'unknown' })
    return Response.json({ error: known ? error.message : 'Could not link this assessment. Please retry.' }, { status: known ? error.status : 503 })
  }
}
