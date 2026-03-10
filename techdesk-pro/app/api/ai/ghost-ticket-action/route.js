import { runGhostTicketAction } from '../../../../lib/ghost/core'

export async function POST(request) {
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