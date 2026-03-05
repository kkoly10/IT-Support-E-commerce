// File: app/api/oauth/disconnect/route.js (new — mkdir -p app/api/oauth/disconnect)

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { platform, orgId, userId } = await request.json()

    if (!platform || !orgId) {
      return Response.json({ error: 'Missing platform or orgId' }, { status: 400 })
    }

    const { error } = await supabase
      .from('connected_integrations')
      .delete()
      .eq('organization_id', orgId)
      .eq('platform', platform)

    if (error) throw error

    // Log disconnection
    await supabase.from('activity_log').insert({
      organization_id: orgId,
      actor_id: userId,
      action: 'integration_disconnected',
      resource_type: 'integration',
      metadata: { platform },
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error('Disconnect error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}