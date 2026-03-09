import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const payload = await request.json()

    const required = ['business_name', 'full_name', 'email', 'team_size_range', 'current_tools', 'pain_points', 'environment', 'urgency']
    const missing = required.filter((field) => !payload?.[field])
    if (missing.length > 0) {
      return Response.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 })
    }

    const insertData = {
      business_name: payload.business_name.trim(),
      full_name: payload.full_name.trim(),
      email: payload.email.trim().toLowerCase(),
      team_size_range: payload.team_size_range,
      current_tools: payload.current_tools,
      pain_points: payload.pain_points,
      environment: payload.environment,
      urgency: payload.urgency,
      has_internal_it: payload.has_internal_it || 'unknown',
      status: 'new',
      notes: payload.notes?.trim() || null,
    }

    const { data, error } = await supabase
      .from('assessment_submissions')
      .insert(insertData)
      .select('id')
      .single()

    if (error) throw error

    return Response.json({ success: true, id: data.id })
  } catch (err) {
    console.error('Assessment submit error:', err)
    return Response.json({ error: err.message || 'Failed to submit assessment' }, { status: 500 })
  }
}
