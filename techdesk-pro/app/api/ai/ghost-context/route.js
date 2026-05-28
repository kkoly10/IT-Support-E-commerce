import { getGhostTicketContext } from '../../../../lib/ghost/core'
import { requireAdmin } from '../../../../lib/supabase/route-auth'

export async function POST(request) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

    const { ticketId } = await request.json()

    if (!ticketId) {
      return Response.json({ error: 'Missing ticketId' }, { status: 400 })
    }

    const context = await getGhostTicketContext(ticketId)

    return Response.json({
      success: true,
      context,
    })
  } catch (err) {
    console.error('Ghost context error:', err)
    return Response.json(
      { error: err.message || 'Failed to build Ghost context' },
      { status: 500 }
    )
  }
}