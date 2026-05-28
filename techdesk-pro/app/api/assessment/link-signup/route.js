import { createClient } from '@supabase/supabase-js'
import { requireAuth, isInternalRequest } from '../../../../lib/auth/require'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  // Called server-to-server by /api/signup/complete (so anonymous, post-signUp
  // before any session exists), or by admins via the assessments console.
  if (!isInternalRequest(request)) {
    const auth = await requireAuth({ adminOnly: true })
    if (auth.response) return auth.response
  }

  try {
    const { assessmentId, organizationId } = await request.json()

    if (!assessmentId || !organizationId) {
      return Response.json({ error: 'assessmentId and organizationId are required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('assessment_submissions')
      .update({
        linked_organization_id: organizationId,
        status: 'converted',
        converted_at: new Date().toISOString(),
      })
      .eq('id', assessmentId)

    if (error) throw error

    return Response.json({ success: true })
  } catch (err) {
    console.error('Assessment link-signup error:', err)
    return Response.json({ error: err.message || 'Failed to link assessment' }, { status: 500 })
  }
}
