import { runGhostTicketAction } from '../../../../lib/ghost/core'
import { requireAdmin } from '../../../../lib/supabase/route-auth'

export async function POST(request) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

    const { ticketId, action } = await request.json()

    if (!ticketId) {
      return Response.json({ error: 'Missing ticketId' }, { status: 400 })
    }

    if (!action) {
      return Response.json({ error: 'Missing action' }, { status: 400 })
    }

    const result = await runGhostTicketAction(ticketId, action)
    return Response.json(result)
  } catch (err) {
    console.error('Ghost ticket action error:', err)
    return Response.json(
      { error: err.message || 'Failed to run Ghost action' },
      { status: 500 }
    )
  }
}