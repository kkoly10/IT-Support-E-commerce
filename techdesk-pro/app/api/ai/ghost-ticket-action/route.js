import { runGhostTicketAction } from '../../../../lib/ghost/core'
import { requireAuth } from '../../../../lib/auth/require'

export async function POST(request) {
  const auth = await requireAuth({ adminOnly: true })
  if (auth.response) return auth.response

  try {
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