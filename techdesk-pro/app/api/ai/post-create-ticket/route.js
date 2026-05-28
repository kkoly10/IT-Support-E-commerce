import { createClient } from '@supabase/supabase-js'
import { requireUser, assertResourceOrg } from '../../../../lib/supabase/route-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const auth = await requireUser()
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

    const { ticketId } = await request.json()

    if (!ticketId) {
      return Response.json({ error: 'Missing ticketId' }, { status: 400 })
    }

    const { data: ticket } = await supabase
      .from('tickets')
      .select('id, organization_id')
      .eq('id', ticketId)
      .single()

    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const denied = assertResourceOrg(ticket.organization_id, auth.profile)
    if (denied) return Response.json({ error: denied.error }, { status: denied.status })

    const internalKey = process.env.INTERNAL_API_KEY
    if (!internalKey) {
      // Graceful degradation when INTERNAL_API_KEY isn't configured:
      // skip downstream AI workflow instead of leaving the endpoints unauthenticated.
      await supabase.from('ticket_messages').insert({
        ticket_id: ticketId,
        sender_type: 'system',
        body: '⚠️ Post-create AI workflow skipped (INTERNAL_API_KEY not configured).',
        is_internal_note: true,
      })
      return Response.json({ success: true, skipped: true })
    }

    const origin = new URL(request.url).origin
    const internalHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${internalKey}`,
    }

    const triageResponse = await fetch(`${origin}/api/ai/triage-ticket`, {
      method: 'POST',
      headers: internalHeaders,
      body: JSON.stringify({ ticketId }),
    })

    const triageData = await triageResponse.json().catch(() => null)

    if (!triageResponse.ok) {
      await supabase.from('ticket_messages').insert({
        ticket_id: ticketId,
        sender_type: 'system',
        body: `⚠️ Post-create AI workflow stopped during triage.\nReason: ${triageData?.error || 'Unknown triage error'}`,
        is_internal_note: true,
      })

      return Response.json(
        {
          success: false,
          stage: 'triage',
          error: triageData?.error || 'Triage failed',
        },
        { status: 500 }
      )
    }

    const autoResolveResponse = await fetch(`${origin}/api/ai/auto-resolve`, {
      method: 'POST',
      headers: internalHeaders,
      body: JSON.stringify({ ticketId }),
    })

    const autoResolveData = await autoResolveResponse.json().catch(() => null)

    return Response.json({
      success: true,
      triage: triageData,
      autoResolve: autoResolveData,
    })
  } catch (err) {
    console.error('Post-create ticket AI workflow error:', err)
    return Response.json(
      { error: err.message || 'Post-create AI workflow failed' },
      { status: 500 }
    )
  }
}