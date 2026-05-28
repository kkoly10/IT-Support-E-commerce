import { runGhostSearch } from '../../../../lib/ghost/core'
import { requireAdmin } from '../../../../lib/supabase/route-auth'

export async function POST(request) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

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