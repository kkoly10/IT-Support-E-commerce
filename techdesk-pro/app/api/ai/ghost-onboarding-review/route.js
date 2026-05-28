import { reviewOnboardingState } from '../../../../lib/ghost/core'
import { requireAdmin } from '../../../../lib/supabase/route-auth'

export async function POST(request) {
  try {
    const auth = await requireAdmin()
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

    const { organizationId } = await request.json()

    if (!organizationId) {
      return Response.json({ error: 'Missing organizationId' }, { status: 400 })
    }

    const review = await reviewOnboardingState(organizationId)

    return Response.json({
      success: true,
      review,
    })
  } catch (err) {
    console.error('Ghost onboarding review error:', err)
    return Response.json(
      { error: err.message || 'Failed to review onboarding state' },
      { status: 500 }
    )
  }
}