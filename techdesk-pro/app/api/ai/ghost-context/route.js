import { createClient } from '@supabase/supabase-js'
import { normalizeRequestCategory } from '../../../../lib/support-ui'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function safeJsonParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function extractTextBlocks(aiResult) {
  return (aiResult?.content || [])
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
}

export async function POST(request) {
  try {
    const { ticketId } = await request.json()

    if (!ticketId) {
      return Response.json({ error: 'Missing ticketId' }, { status: 400 })
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        organization:organizations(
          id,
          name,
          plan,
          client_status,
          onboarding_status,
          agreement_status,
          payment_status,
          needs_human_review,
          team_size,
          industry
        ),
        creator:profiles!tickets_created_by_fkey(
          full_name,
          email
        )
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const { data: messages } = await supabase
      .from('ticket_messages')
      .select('body, sender_type, is_internal_note, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    const visibleMessages = (messages || []).filter((m) => !m.is_internal_note)
    const internalNotes = (messages || []).filter((m) => m.is_internal_note)

    const recentConversation = visibleMessages
      .slice(-8)
      .map((m) => `[${m.sender_type}] ${m.body}`)
      .join('\n\n')

    const categoryForLookup = normalizeRequestCategory(ticket.ai_category || ticket.category || 'other')

    const { data: similarTickets } = await supabase
      .from('tickets')
      .select('id, ticket_number, title, status, category, ai_category, ai_summary, created_at')
      .neq('id', ticketId)
      .eq('status', 'resolved')
      .order('created_at', { ascending: false })
      .limit(6)

    const filteredSimilarTickets = (similarTickets || [])
      .filter((item) => {
        const normalizedCategory = normalizeRequestCategory(item.ai_category || item.category || 'other')
        return normalizedCategory === categoryForLookup
      })
      .slice(0, 3)

    let linkedAssessment = null

    if (ticket.organization?.id) {
      const { data: assessmentByOrg } = await supabase
        .from('assessment_submissions')
        .select('id, business_name, email, status, urgency, team_size_range, created_at, converted_at')
        .eq('linked_organization_id', ticket.organization.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      linkedAssessment = assessmentByOrg || null
    }

    if (!linkedAssessment && ticket.creator?.email) {
      const { data: assessmentByEmail } = await supabase
        .from('assessment_submissions')
        .select('id, business_name, email, status, urgency, team_size_range, created_at, converted_at')
        .eq('email', ticket.creator.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      linkedAssessment = assessmentByEmail || null
    }

    const latestKbNote = [...internalNotes]
      .reverse()
      .find((note) => note.body?.includes('KB/SOP Draft JSON:'))

    const kbSignal = latestKbNote
      ? { has_kb_draft: true, created_at: latestKbNote.created_at }
      : { has_kb_draft: false, created_at: null }

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
        system: `You are Ghost Admin, the internal support operations brain for TechDesk Pro.

TechDesk Pro is a founder-led, remote-first IT support business.
You are internal-only. You help the operator decide what this support request means, what is blocking it, and what to do next.

Your job:
- interpret the ticket in plain English
- identify the most likely blocker
- recommend the best next action
- warn about scope drift or operational risk
- use lifecycle context when relevant
- stay strictly within remote IT support, cloud/SaaS admin support, and support operations

Do not provide e-commerce, store, marketing, website-build, or automation-build advice.

Return ONLY valid JSON in this exact shape:
{
  "summary": "Short plain-English description of what this ticket is really about",
  "likely_blocker": "Most likely blocker right now",
  "risk_level": "low|medium|high",
  "recommended_next_action": "What the operator should do next",
  "client_reply_guidance": "What kind of response the client should receive next",
  "scope_call": "standard_support|watch_scope|likely_scoped_work",
  "scope_reason": "Why this should stay in support or move toward scoped work",
  "lifecycle_signal": "What client lifecycle context matters here",
  "lifecycle_next_step": "What lifecycle/admin action should happen next if any",
  "operator_warning": "Short caution to help the solo operator avoid mistakes"
}`,
        messages: [
          {
            role: 'user',
            content: `Ticket context:
- Ticket title: ${ticket.title}
- Ticket description: ${ticket.description || 'No description provided'}
- Current status: ${ticket.status}
- Current priority: ${ticket.priority || 'unknown'}
- Ticket category: ${ticket.category || 'unknown'}
- AI category: ${ticket.ai_category || 'unknown'}
- AI summary: ${ticket.ai_summary || 'none'}
- AI difficulty: ${ticket.ai_difficulty || 'unknown'}
- AI estimated time: ${ticket.ai_estimated_time || 'unknown'}
- Access needed: ${String(ticket.ai_access_needed)}
- Auto-resolve eligible: ${String(ticket.ai_can_auto_resolve)}
- Project flag: ${String(ticket.ai_project_flag)}
- Escalation needed: ${String(ticket.ai_escalation_needed)}

Organization context:
- Name: ${ticket.organization?.name || 'Unknown'}
- Plan: ${ticket.organization?.plan || 'starter'}
- Client status: ${ticket.organization?.client_status || 'unknown'}
- Onboarding status: ${ticket.organization?.onboarding_status || 'unknown'}
- Agreement status: ${ticket.organization?.agreement_status || 'unknown'}
- Payment status: ${ticket.organization?.payment_status || 'unknown'}
- Needs human review: ${String(ticket.organization?.needs_human_review)}
- Team size: ${ticket.organization?.team_size || 'unknown'}
- Industry: ${ticket.organization?.industry || 'unknown'}

Creator context:
- Name: ${ticket.creator?.full_name || 'Unknown'}
- Email: ${ticket.creator?.email || 'unknown'}

Assessment context:
${linkedAssessment
  ? `- Assessment status: ${linkedAssessment.status}
- Assessment urgency: ${linkedAssessment.urgency}
- Assessment team size: ${linkedAssessment.team_size_range}
- Assessment created at: ${linkedAssessment.created_at}
- Assessment converted at: ${linkedAssessment.converted_at || 'not converted yet'}`
  : '- No linked assessment found'}

Knowledge signal:
- KB/SOP draft exists on this ticket: ${String(kbSignal.has_kb_draft)}

Recent client-facing conversation:
${recentConversation || 'No client-facing conversation yet.'}

Similar resolved tickets:
${filteredSimilarTickets.length > 0
  ? filteredSimilarTickets
      .map((item) => `- ${item.ticket_number ? `TDP-${item.ticket_number}` : item.id.slice(0, 8)} | ${item.title} | ${item.ai_summary || 'No AI summary'}`)
      .join('\n')
  : 'No similar resolved tickets found.'}

Interpret this ticket and return the JSON now.`,
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
      throw new Error('Ghost Admin returned invalid JSON')
    }

    return Response.json({
      success: true,
      context: {
        ...parsed,
        similar_tickets: filteredSimilarTickets.map((item) => ({
          id: item.id,
          ticket_number: item.ticket_number,
          title: item.title,
          summary: item.ai_summary || '',
          category: normalizeRequestCategory(item.ai_category || item.category || 'other'),
          created_at: item.created_at,
        })),
        linked_assessment: linkedAssessment,
        kb_signal: kbSignal,
      },
    })
  } catch (err) {
    console.error('Ghost context error:', err)
    return Response.json({ error: err.message || 'Failed to build Ghost context' }, { status: 500 })
  }
}