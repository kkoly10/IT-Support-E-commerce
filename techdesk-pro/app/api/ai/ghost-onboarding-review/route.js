import { reviewOnboardingState } from '../../../../lib/ghost/core'
import { requireAuth } from '../../../../lib/auth/require'

export async function POST(request) {
  const auth = await requireAuth({ adminOnly: true })
  if (auth.response) return auth.response

  try {
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