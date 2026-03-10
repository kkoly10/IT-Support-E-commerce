import { reviewAssessmentSubmission } from '../../../../lib/ghost/core'

export async function POST(request) {
  try {
    const { assessmentId } = await request.json()

    if (!assessmentId) {
      return Response.json({ error: 'Missing assessmentId' }, { status: 400 })
    }

    const review = await reviewAssessmentSubmission(assessmentId)

    return Response.json({
      success: true,
      review,
    })
  } catch (err) {
    console.error('Ghost assessment review error:', err)
    return Response.json(
      { error: err.message || 'Failed to review assessment' },
      { status: 500 }
    )
  }
}