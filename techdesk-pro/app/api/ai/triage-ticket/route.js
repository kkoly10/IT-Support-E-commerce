import { createClient } from '@supabase/supabase-js'
import { normalizeRequestCategory } from '../../../../lib/support-ui'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const VALID_AI_CATEGORIES = [
  'helpdesk',
  'accounts_access',
  'email_collaboration',
  'microsoft_365',
  'google_workspace',
  'saas_admin',
  'portal_account',
  'billing_scope',
  'device_guidance',
  'other',
]

const normalizeAiCategory = (value) => {
  if (!value) return 'other'
  if (VALID_AI_CATEGORIES.includes(value)) return value

  const aliasMap = {
    security_review: 'other',
    project_scoped: 'other',
    unknown: 'other',
  }

  return aliasMap[value] || 'other'
}

export async function POST(request) {
  try {
    const { ticketId } = await request.json()

    if (!ticketId) {
      return Response.json({ error: 'Missing ticketId' }, { status: 400 })
    }

    const { data: ticket } = await supabase
      .from('tickets')
      .select('*, organization:organizations(name, plan, monthly_ticket_limit), creator:profiles!tickets_created_by_fkey(full_name)')
      .eq('id', ticketId)
      .single()

    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 })
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
        max_tokens: 1200,
        system: `You are the IT support triage engine for TechDesk Pro.

TechDesk Pro is a remote-first IT support business focused on:
- remote helpdesk support
- Microsoft 365 support
- Google Workspace support
- SaaS admin support
- user/account support
- support policy and portal guidance

You are NOT triaging:
- project implementation work
- full software build work
- marketing work

Your job:
Analyze the support ticket and return ONLY valid JSON in this exact structure:

{
  "ai_category": "helpdesk|accounts_access|email_collaboration|microsoft_365|google_workspace|saas_admin|portal_account|billing_scope|device_guidance|other",
  "ai_priority_recommendation": "low|medium|high|urgent",
  "ai_difficulty": "easy|medium|advanced",
  "ai_estimated_time": "5 minutes",
  "ai_access_needed": true,
  "ai_can_auto_resolve": false,
  "ai_confidence": 0.85,
  "ai_project_flag": false,
  "ai_escalation_needed": false,
  "ai_summary": "Short plain-English summary of what this ticket appears to be and what it likely needs."
}

Rules:
- Use "ai_can_auto_resolve": true only for low-risk, instruction-based, FAQ-like, or portal/policy questions
- If the issue appears to require account access, admin changes, security judgment, billing investigation, vendor escalation, or ambiguity, set ai_can_auto_resolve to false
- Set ai_project_flag to true for migrations, major setup work, broad remediation, or anything that looks bigger than routine support
- Set ai_escalation_needed to true if it looks security-sensitive, high-impact, or beyond normal solo helpdesk handling
- Confidence must be between 0.0 and 1.0
- Return JSON only`,
        messages: [
          {
            role: 'user',
            content: `Ticket details:
- Title: ${ticket.title}
- Description: ${ticket.description || 'No description provided'}
- Current category: ${ticket.category || 'Not specified'}
- Current priority: ${ticket.priority || 'Not specified'}
- Platform: ${ticket.platform || 'Not specified'}
- Client: ${ticket.organization?.name || 'Unknown'}
- Client plan: ${ticket.organization?.plan || 'starter'}

Analyze this ticket for remote IT support triage only.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Anthropic API error: ${errText}`)
    }

    const aiResult = await response.json()
    const resultText = aiResult.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')

    const cleaned = resultText.replace(/```json\n?|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    const updatePayload = {
      ai_category: normalizeAiCategory(parsed.ai_category),
      ai_priority_recommendation: parsed.ai_priority_recommendation || null,
      ai_difficulty: parsed.ai_difficulty || null,
      ai_estimated_time: parsed.ai_estimated_time || null,
      ai_access_needed:
        typeof parsed.ai_access_needed === 'boolean' ? parsed.ai_access_needed : null,
      ai_can_auto_resolve:
        typeof parsed.ai_can_auto_resolve === 'boolean' ? parsed.ai_can_auto_resolve : null,
      ai_confidence:
        typeof parsed.ai_confidence === 'number' ? parsed.ai_confidence : null,
      ai_project_flag:
        typeof parsed.ai_project_flag === 'boolean' ? parsed.ai_project_flag : false,
      ai_escalation_needed:
        typeof parsed.ai_escalation_needed === 'boolean' ? parsed.ai_escalation_needed : false,
      ai_summary: parsed.ai_summary || ticket.ai_summary || null,
    }

    const { error: updateErr } = await supabase
      .from('tickets')
      .update(updatePayload)
      .eq('id', ticketId)

    if (updateErr) throw updateErr

    await supabase.from('ticket_messages').insert({
      ticket_id: ticketId,
      sender_type: 'system',
      body: `🧠 AI Triage complete
Category: ${updatePayload.ai_category || 'other'}
Priority recommendation: ${updatePayload.ai_priority_recommendation || 'unknown'}
Difficulty: ${updatePayload.ai_difficulty || 'unknown'}
Estimated time: ${updatePayload.ai_estimated_time || 'unknown'}
Access needed: ${String(updatePayload.ai_access_needed)}
Auto-resolve eligible: ${String(updatePayload.ai_can_auto_resolve)}
Project/scoped work: ${String(updatePayload.ai_project_flag)}
Escalation needed: ${String(updatePayload.ai_escalation_needed)}
Confidence: ${updatePayload.ai_confidence ?? 'n/a'}

Summary: ${updatePayload.ai_summary || 'No summary provided'}`,
      is_internal_note: true,
    })

    return Response.json({
      success: true,
      triage: updatePayload,
    })
  } catch (err) {
    console.error('AI triage error:', err)
    return Response.json({ error: err.message || 'AI triage failed' }, { status: 500 })
  }
}
