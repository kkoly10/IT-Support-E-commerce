import { getTicketFollowupDraft } from '../../../../lib/ghost/core'

export async function POST(request) {
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
