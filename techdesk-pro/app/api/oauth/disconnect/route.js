// File: app/api/oauth/disconnect/route.js (new — mkdir -p app/api/oauth/disconnect)

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '../../../../lib/supabase/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    // Authorize: only a signed-in member of the org (or an admin) may
    // disconnect that org's integrations — never trust the body's orgId alone.
    const auth = await createServerClient()
    const {
      data: { user },
    } = await auth.auth.getUser()
    if (!user) {
      return Response.json({ error: 'You must be signed in.' }, { status: 401 })
    }

    const { platform, orgId } = await request.json()

    if (!platform || !orgId) {
      return Response.json({ error: 'Missing platform or orgId' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.organization_id !== orgId)) {
      return Response.json({ error: 'Not authorized for this organization.' }, { status: 403 })
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
      actor_id: user.id,
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