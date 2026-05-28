import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '../../../../lib/auth/require'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  // Called from portal/tickets/new immediately after a ticket is created.
  // Require a session and verify the ticket belongs to the caller's org or
  // that they're an admin — otherwise anyone could kick off AI work on any
  // ticket id they guessed.
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', auth.user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.organization_id !== ticket.organization_id)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const origin = new URL(request.url).origin
    const internalHeaders = {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.INTERNAL_API_SECRET || '',
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