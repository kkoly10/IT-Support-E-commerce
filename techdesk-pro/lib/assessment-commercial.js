const PLAN_META = {
  starter: {
    name: 'Starter',
    headline: 'Best for smaller teams with routine remote support needs',
    path: 'Free assessment → signup → onboarding → Starter recommendation',
  },
  growth: {
    name: 'Growth',
    headline: 'Best for growing teams that need steadier helpdesk and cloud admin support',
    path: 'Free assessment → signup → onboarding → Growth recommendation',
  },
  scale: {
    name: 'Scale',
    headline: 'Best for larger or more operationally sensitive environments',
    path: 'Free assessment → signup → guided onboarding → Scale recommendation',
  },
  scoped: {
    name: 'Scoping Call',
    headline: 'Needs human review before recommending a standard support plan',
    path: 'Free assessment → human review → scoping call → recommended path',
  },
}

function normalizeTeamSize(range = '') {
  const value = String(range).toLowerCase()

  if (value.includes('1-5')) return 3
  if (value.includes('6-15')) return 10
  if (value.includes('16-30')) return 22
  if (value.includes('31-75')) return 50
  if (value.includes('75+')) return 90
  if (value.includes('just me')) return 1
  if (value.includes('2-5')) return 3
  if (value.includes('6-15')) return 10
  if (value.includes('16-50')) return 25
  if (value.includes('50+')) return 75

  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeUrgency(value = '') {
  const urgency = String(value).toLowerCase()
  if (urgency.includes('urgent')) return 'same_day'
  if (urgency.includes('soon')) return 'one_business_day'
  return 'two_business_days'
}

export function deriveRecommendedPlan(assessment = {}, review = {}) {
  const team = normalizeTeamSize(assessment.team_size_range)
  const fitScore = Number.isFinite(review?.fit_score) ? review.fit_score : 55
  const fitLabel = review?.fit_label || 'possible_fit'
  const reviewFlag = review?.review_flag || 'none'

  if (fitLabel === 'poor_fit' || reviewFlag === 'scope_watch') {
    return {
      key: 'scoped',
      ...PLAN_META.scoped,
      responseWindow: normalizeUrgency(assessment.urgency),
      commercialReason:
        'This lead needs operator judgment before being placed into a standard monthly support path.',
    }
  }

  let key = 'starter'
  if (team >= 6 || fitScore >= 70) key = 'growth'
  if (team >= 16 || fitScore >= 85) key = 'scale'

  return {
    key,
    ...PLAN_META[key],
    responseWindow: normalizeUrgency(assessment.urgency),
    commercialReason:
      key === 'starter'
        ? 'Smaller team size and routine support profile suggest a lighter monthly support path.'
        : key === 'growth'
        ? 'This looks like a real operating support need with enough recurring complexity to justify a stronger plan.'
        : 'Environment size, risk, or operating sensitivity suggests a more guided support structure.',
  }
}

export function buildOperatorTalkTrack(assessment = {}, review = {}) {
  const plan = deriveRecommendedPlan(assessment, review)
  const business = assessment.business_name || 'your team'
  const mainPain =
    assessment.pain_points ||
    assessment.environment ||
    assessment.current_tools ||
    'your current support friction points'

  const intro =
    `Thanks for submitting the assessment for ${business}. ` +
    `Based on what you shared about ${mainPain}, I think the best next step is ${plan.name}.`

  const middle =
    plan.key === 'scoped'
      ? 'Before putting you into a standard monthly support path, I would want a short scoping conversation so we can confirm fit, boundaries, and the right onboarding approach.'
      : `${plan.name} looks like the best commercial fit because it matches the team size, urgency, and support pattern you described without overscoping the engagement.`

  const close =
    'The next step would be to complete portal signup so we can hold your onboarding workspace, review access and contacts, and confirm the final service path before activation.'

  return `${intro} ${middle} ${close}`
}