import { getGhostTicketContext } from '../../../../lib/ghost/core'

export async function POST(request) {
  try {
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