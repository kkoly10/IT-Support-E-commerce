import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { ticketId } = await request.json()

    if (!ticketId) {
      return Response.json({ error: 'Missing ticketId' }, { status: 400 })
    }

    const { data: ticket } = await supabase
      .from('tickets')
      .select('*, organization:organizations(name), creator:profiles!tickets_created_by_fkey(full_name, email)')
      .eq('id', ticketId)
      .single()

    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (!['resolved', 'closed'].includes(ticket.status)) {
      return Response.json({ error: 'KB/SOP drafts can only be generated from resolved or closed support requests' }, { status: 400 })
    }

    const { data: messages } = await supabase
      .from('ticket_messages')
      .select('body, sender_type, is_internal_note, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    const conversation = (messages || [])
      .filter((m) => !m.is_internal_note)
      .map((m) => `[${m.sender_type}] ${m.body}`)
      .join('\n\n')

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
        system: `You are an IT support knowledge-ops assistant for Kocre IT Services.

Kocre IT Services is a remote-first IT support business.
Your task: convert one resolved support request into an internal KB/SOP draft.

Return only valid JSON in this exact structure:
{
  "title": "Short practical SOP title",
  "short_summary": "1-2 sentence plain-English summary",
  "problem": "What issue the client faced",
  "likely_cause": "Most likely root cause",
  "steps_taken": ["Step 1", "Step 2", "Step 3"],
  "reusable_fix_guidance": "How to apply this fix next time",
  "future_prevention_note": "How to reduce recurrence"
}

Rules:
- Keep it specific and reusable for a founder-led IT support operation
- Avoid fluff and keep language focused on IT support operations only
- Steps should be concise and operational
- If conversation data is sparse, infer carefully and state practical assumptions`,
        messages: [
          {
            role: 'user',
            content: `Resolved support request details:
- Ticket number: ${ticket.ticket_number || 'n/a'}
- Title: ${ticket.title}
- Description: ${ticket.description || 'No description provided'}
- Status: ${ticket.status}
- Category: ${ticket.category || 'unknown'}
- AI category: ${ticket.ai_category || 'unknown'}
- AI summary: ${ticket.ai_summary || 'none'}
- Organization: ${ticket.organization?.name || 'Unknown'}

Conversation transcript:
${conversation || 'No conversation available.'}

Generate the KB/SOP draft now.`,
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

    const draft = {
      title: parsed.title || `SOP: ${ticket.title}`,
      short_summary: parsed.short_summary || ticket.ai_summary || 'Support request resolution summary.',
      problem: parsed.problem || ticket.description || ticket.title,
      likely_cause: parsed.likely_cause || 'Cause to be confirmed by support lead.',
      steps_taken: Array.isArray(parsed.steps_taken) ? parsed.steps_taken : [],
      reusable_fix_guidance: parsed.reusable_fix_guidance || 'Document repeatable fix pattern and verify access prerequisites.',
      future_prevention_note: parsed.future_prevention_note || 'Add onboarding checks and proactive monitoring where applicable.',
    }

    const noteBody = `📚 KB/SOP Draft generated from resolved support request\n\nTitle: ${draft.title}\nSummary: ${draft.short_summary}\n\nKB/SOP Draft JSON:\n${JSON.stringify(draft, null, 2)}`

    const { error: noteError } = await supabase.from('ticket_messages').insert({
      ticket_id: ticketId,
      sender_type: 'system',
      is_internal_note: true,
      body: noteBody,
    })

    if (noteError) throw noteError

    await supabase.from('kb_sop_drafts').upsert({
      ticket_id: ticketId,
      organization_id: ticket.organization_id,
      title: draft.title,
      short_summary: draft.short_summary,
      draft_json: draft,
      source: 'ai_generated',
    }, { onConflict: 'ticket_id' })

    return Response.json({ success: true, draft, stored_in: 'kb_sop_drafts + ticket_messages.is_internal_note=true' })
  } catch (err) {
    console.error('KB/SOP draft generation error:', err)
    return Response.json({ error: err.message || 'Failed to generate KB/SOP draft' }, { status: 500 })
  }
}
