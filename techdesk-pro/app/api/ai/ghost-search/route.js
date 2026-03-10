import { runGhostSearch } from '../../../../lib/ghost/core'

export async function POST(request) {
  try {
    const { query } = await request.json()

    if (!query || !String(query).trim()) {
      return Response.json({ error: 'Missing query' }, { status: 400 })
    }

    const result = await runGhostSearch(query)

    return Response.json({
      success: true,
      answer: result.answer,
      recommended_actions: result.recommended_actions,
      counts: result.counts,
      matches: result.matches,
    })
  } catch (err) {
    console.error('Ghost search error:', err)
    return Response.json(
      { error: err.message || 'Failed to run Ghost search' },
      { status: 500 }
    )
  }
}