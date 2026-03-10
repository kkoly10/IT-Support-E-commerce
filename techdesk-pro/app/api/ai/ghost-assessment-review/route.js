import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function extractTextBlocks(aiResult) {
  return (aiResult?.content || [])
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function POST(request) {
  try {
    const { assessmentId } = await request.json()

    if (!assessmentId) {
      return Response.json({ error: 'Missing assessmentId' }, { status: 400 })
    }

    const { data: assessment, error } = await supabase
      .from('assessment_submissions')
      .select('*')
      .eq('id', assessmentId)
      .single()

    if (error || !assessment) {
      return Response.json({ error: 'Assessment not found' }, { status: 404 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1400,
        system: `You are Ghost Admin, the internal operations brain for TechDesk Pro.

TechDesk Pro is a founder-led, remote-first IT support business.
You are reviewing a free assessment submission to help the operator decide:
- whether this is a strong fit
- whether human review is needed
- how urgent it is
- what the next step should be
- whether this looks like standard remote IT support vs something risky or unclear

Return ONLY valid JSON in this exact structure:
{
  "qualification_summary": "Short plain-English summary",
  "fit_score": 0,
  "fit_label": "strong_fit|possible_fit|unclear_fit|poor_fit",
  "urgency_signal": "low|medium|high",
  "recommended_status": "new|contacted|qualified|converted|archived",
  "recommended_next_action": "Best next operator action",
  "review_flag": "none|human_review|scope_watch",
  "onboarding_readiness": "ready_for_signup|needs_call_first|needs_manual_review",
  "operator_warning": "Short caution for the operator"
}

Rules:
- Stay within TechDesk Pro's remote IT support scope
- Do not suggest e-commerce, website-build, or automation-build work
- Be practical for a solo founder
- If the lead is unclear, say so plainly
- If the lead sounds high-friction or risky, flag it honestly`,
        messages: [
          {
            role: 'user',
            content: `Assessment submission:
- Business name: ${assessment.business_name || 'Unknown'}
- Full name: ${assessment.full_name || 'Unknown'}
- Email: ${assessment.email || 'Unknown'}
- Phone: ${assessment.phone || 'Unknown'}
- Industry: ${assessment.industry || 'Unknown'}
- Team size range: ${assessment.team_size_range || 'Unknown'}
- Environment: ${assessment.environment || 'Unknown'}
- Platforms/tools: ${assessment.platforms_tools || assessment.tools_platforms || assessment.tools || 'Unknown'}
- Urgency: ${assessment.urgency || 'Unknown'}
- Internal IT: ${assessment.has_internal_it || assessment.internal_it_status || 'Unknown'}
- Pain points: ${assessment.pain_points || assessment.biggest_pain_points || assessment.support_pain_points || 'None provided'}
- Notes: ${assessment.notes || 'None'}
- Current status: ${assessment.status || 'new'}

Review this assessment and return the JSON now.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error: ${errorText}`)
    }

    const aiResult = await response.json()
    const rawText = extractTextBlocks(aiResult).replace(/```json\n?|```/g, '').trim()
    const parsed = safeJsonParse(rawText)

    if (!parsed) {
      throw new Error('Ghost assessment review returned invalid JSON')
    }

    return Response.json({
      success: true,
      review: {
        qualification_summary: parsed.qualification_summary || 'No summary returned.',
        fit_score: typeof parsed.fit_score === 'number' ? parsed.fit_score : 0,
        fit_label: parsed.fit_label || 'unclear_fit',
        urgency_signal: parsed.urgency_signal || 'medium',
        recommended_status: parsed.recommended_status || 'contacted',
        recommended_next_action: parsed.recommended_next_action || 'Review manually.',
        review_flag: parsed.review_flag || 'human_review',
        onboarding_readiness: parsed.onboarding_readiness || 'needs_manual_review',
        operator_warning: parsed.operator_warning || 'Review carefully before proceeding.',
      },
    })
  } catch (err) {
    console.error('Ghost assessment review error:', err)
    return Response.json(
      { error: err.message || 'Failed to review assessment' },
      { status: 500 }
    )
  }
}