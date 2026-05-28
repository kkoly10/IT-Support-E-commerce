import { getTicketFollowupDraft } from '../../../../lib/ghost/core'
import { requireAuth } from '../../../../lib/auth/require'

export async function POST(request) {
  const auth = await requireAuth({ adminOnly: true })
  if (auth.response) return auth.response

  try {
    const { ticketId, draftType } = await request.json()

    if (!ticketId) {
      return Response.json({ error: 'Missing ticketId' }, { status: 400 })
    }

    if (!draftType) {
      return Response.json({ error: 'Missing draftType' }, { status: 400 })
    }

    const result = await getTicketFollowupDraft(ticketId, draftType)

    return Response.json({
      success: true,
      draft: result.draft,
      suggested_status: result.suggested_status,
    })
  } catch (err) {
    console.error('Generate follow-up draft error:', err)
    return Response.json(
      { error: err.message || 'Failed to generate follow-up draft' },
      { status: 500 }
    )
  }
}
