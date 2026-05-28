import { getGhostTicketContext } from '../../../../lib/ghost/core'
import { requireAuth } from '../../../../lib/auth/require'

export async function POST(request) {
  const auth = await requireAuth({ adminOnly: true })
  if (auth.response) return auth.response

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