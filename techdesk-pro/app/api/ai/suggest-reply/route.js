import { getTicketCoachSuggestion } from '../../../../lib/ghost/core'
import { requireAdmin } from '../../../../lib/supabase/route-auth'

export async function POST(request) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

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