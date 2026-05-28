import { generateTicketKnowledgeDraft } from '../../../../lib/ghost/core'
import { requireAdmin } from '../../../../lib/supabase/route-auth'

export async function POST(request) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

    const { ticketId } = await request.json()

    if (!ticketId) {
      return Response.json({ error: 'Missing ticketId' }, { status: 400 })
    }

    const result = await generateTicketKnowledgeDraft(ticketId)

    return Response.json({
      success: true,
      draft: result.draft,
      draftId: result.draftId,
      stored_in: result.stored_in,
    })
  } catch (err) {
    console.error('KB/SOP draft generation error:', err)
    return Response.json(
      { error: err.message || 'Failed to generate KB/SOP draft' },
      { status: 500 }
    )
  }
}
