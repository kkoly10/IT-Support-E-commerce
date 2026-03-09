import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
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
