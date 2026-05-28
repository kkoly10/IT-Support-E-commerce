import { getTicketCoachSuggestion } from '../../../../lib/ghost/core'
import { requireAuth } from '../../../../lib/auth/require'

export async function POST(request) {
  const auth = await requireAuth({ adminOnly: true })
  if (auth.response) return auth.response

  try {
    const { ticketId } = await request.json()

    if (!ticketId) {
      return Response.json({ error: 'Missing ticketId' }, { status: 400 })
    }

    const result = await getTicketCoachSuggestion(ticketId)

    return Response.json({
      success: true,
      suggested_reply: result.suggested_reply,
      coach: result.coach,
    })
  } catch (err) {
    console.error('Suggest reply error:', err)
    return Response.json(
      { error: err.message || 'Failed to suggest reply' },
      { status: 500 }
    )
  }
}