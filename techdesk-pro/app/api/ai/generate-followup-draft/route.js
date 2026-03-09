import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const DRAFT_TYPES = {
  waiting_on_client: {
    label: 'Waiting on client follow-up',
    intent: 'Ask clearly for the specific client inputs needed to proceed and keep momentum.',
  },
  still_working: {
    label: 'Still working on it update',
    intent: 'Send a calm progress update, what has been checked, and what happens next.',
  },
  confirm_resolution: {
    label: 'Confirm resolution',
    intent: 'Confirm issue appears fixed and ask client to validate before closing.',
  },
  stale_nudge: {
    label: 'Stale ticket nudge',
    intent: 'Nudge politely after inactivity and request confirmation or needed info.',
  },
}

export async function POST(request) {
  try {
    const { ticketId, draftType } = await request.json()

    if (!ticketId || !draftType || !DRAFT_TYPES[draftType]) {
      return Response.json({ error: 'Missing or invalid ticketId/draftType' }, { status: 400 })
    }

    const { data: ticket } = await supabase
      .from('tickets')
      .select('*, organization:organizations(name), creator:profiles!tickets_created_by_fkey(full_name)')
      .eq('id', ticketId)
      .single()

    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const { data: messages } = await supabase
      .from('ticket_messages')
      .select('body, sender_type, is_internal_note, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    const recentConversation = (messages || [])
      .filter((m) => !m.is_internal_note)
      .slice(-8)
      .map((m) => `[${m.sender_type}] ${m.body}`)
      .join('\n\n')

    const draftMeta = DRAFT_TYPES[draftType]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 700,
        system: `You are an operations-minded support draft assistant for TechDesk Pro.

TechDesk Pro is a remote-first IT support company.
Return only JSON in this shape:
{
  "draft": "client-ready message",
  "suggested_status": "open|in_progress|waiting_on_client|resolved|closed"
}

Rules:
- Keep drafts practical, concise, and professional
- IT-support-only language; no ecommerce/store/marketing/automation-build language
- No hype wording, no filler, no gimmicks
- Be explicit about next actions and ownership
- Keep human oversight; do not claim work was done unless context supports it`,
        messages: [
          {
            role: 'user',
            content: `Create a ${draftMeta.label} draft.
Intent: ${draftMeta.intent}

Ticket details:
- Title: ${ticket.title}
- Description: ${ticket.description || 'No description provided'}
- Status: ${ticket.status || 'open'}
- Priority: ${ticket.priority || 'medium'}
- Category: ${ticket.category || 'unknown'}
- AI summary: ${ticket.ai_summary || 'none'}
- Client organization: ${ticket.organization?.name || 'Unknown'}
- Requestor: ${ticket.creator?.full_name || 'Client'}

Recent conversation:
${recentConversation || 'No prior conversation.'}

Return JSON only.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error: ${errorText}`)
    }

    const aiResult = await response.json()
    const resultText = aiResult.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')

    const cleaned = resultText.replace(/```json\n?|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return Response.json({
      success: true,
      draftType,
      draftLabel: draftMeta.label,
      draft: parsed.draft || '',
      suggested_status: parsed.suggested_status || null,
    })
  } catch (err) {
    console.error('Follow-up draft error:', err)
    return Response.json({ error: err.message || 'Failed to generate follow-up draft' }, { status: 500 })
  }
}
