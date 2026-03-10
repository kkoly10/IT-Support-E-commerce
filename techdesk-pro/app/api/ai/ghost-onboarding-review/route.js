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
    const { organizationId } = await request.json()

    if (!organizationId) {
      return Response.json({ error: 'Missing organizationId' }, { status: 400 })
    }

    const { data: organization, error } = await supabase
      .from('organizations')
      .select(`
        *,
        profiles(id, full_name, email, role)
      `)
      .eq('id', organizationId)
      .single()

    if (error || !organization) {
      return Response.json({ error: 'Organization not found' }, { status: 404 })
    }

    const primaryEmail =
      organization.profiles?.find((p) => p.is_primary_contact)?.email ||
      organization.profiles?.[0]?.email ||
      null

    let linkedAssessment = null

    if (primaryEmail) {
      const { data } = await supabase
        .from('assessment_submissions')
        .select('*')
        .eq('email', primaryEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      linkedAssessment = data || null
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
        system: `You are Ghost Admin, the internal lifecycle and onboarding reviewer for TechDesk Pro.

TechDesk Pro is a founder-led, remote-first IT support business.

Your job:
- interpret the current lifecycle state of an organization
- identify onboarding blockers
- recommend the next lifecycle move
- warn about friction, missing prerequisites, or manual-review risks

Return ONLY valid JSON in this exact structure:
{
  "lifecycle_summary": "Short plain-English summary",
  "readiness_label": "not_ready|needs_work|almost_ready|ready",
  "blockers": ["Blocker 1", "Blocker 2"],
  "recommended_client_status": "lead|onboarding|active|paused|former",
  "recommended_onboarding_status": "not_started|in_progress|completed",
  "recommended_next_action": "Best operator action",
  "operator_warning": "Short caution for the operator"
}

Rules:
- Be practical
- Focus on remote IT support operations
- Keep advice founder-friendly
- If agreement/payment/onboarding are incomplete, say so clearly
- If this client should not be moved forward yet, say so clearly`,
        messages: [
          {
            role: 'user',
            content: `Organization:
- Name: ${organization.name}
- Plan: ${organization.plan || 'starter'}
- Client status: ${organization.client_status || 'lead'}
- Onboarding status: ${organization.onboarding_status || 'not_started'}
- Agreement status: ${organization.agreement_status || 'none'}
- Payment status: ${organization.payment_status || 'none'}
- Needs human review: ${String(organization.needs_human_review)}
- Team size: ${organization.team_size || 'Unknown'}
- Industry: ${organization.industry || 'Unknown'}
- Primary service: ${organization.primary_service || 'it'}
- Service types: ${(organization.service_types || []).join(', ') || 'it'}
- Lead interest: ${organization.lead_interest || 'Unknown'}
- Support hours note: ${organization.support_hours_note || 'None'}
- Notes: ${organization.notes || 'None'}

Members:
${(organization.profiles || [])
  .map((p) => `- ${p.full_name || 'Unknown'} (${p.email || 'no email'}) role=${p.role || 'unknown'}`)
  .join('\n') || 'No members found'}

Linked assessment:
${linkedAssessment
  ? `- Business: ${linkedAssessment.business_name || 'Unknown'}
- Urgency: ${linkedAssessment.urgency || 'Unknown'}
- Team size: ${linkedAssessment.team_size_range || 'Unknown'}
- Pain points: ${linkedAssessment.pain_points || linkedAssessment.biggest_pain_points || 'None'}
- Status: ${linkedAssessment.status || 'new'}`
  : 'No linked assessment found'}

Review lifecycle readiness and return the JSON now.`,
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
      throw new Error('Ghost onboarding review returned invalid JSON')
    }

    return Response.json({
      success: true,
      review: {
        lifecycle_summary: parsed.lifecycle_summary || 'No lifecycle summary returned.',
        readiness_label: parsed.readiness_label || 'needs_work',
        blockers: Array.isArray(parsed.blockers) ? parsed.blockers : [],
        recommended_client_status: parsed.recommended_client_status || organization.client_status || 'lead',
        recommended_onboarding_status: parsed.recommended_onboarding_status || organization.onboarding_status || 'not_started',
        recommended_next_action: parsed.recommended_next_action || 'Review organization manually.',
        operator_warning: parsed.operator_warning || 'Confirm prerequisites before moving this organization forward.',
      },
    })
  } catch (err) {
    console.error('Ghost onboarding review error:', err)
    return Response.json(
      { error: err.message || 'Failed to review onboarding state' },
      { status: 500 }
    )
  }
}