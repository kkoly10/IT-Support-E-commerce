import { getTicketCoachSuggestion } from '../../../../lib/ghost/core'

export async function POST(request) {
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