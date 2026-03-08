import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const AUTO_RESOLVE_ALLOWLIST = [
  'portal_account',
  'billing_scope',
]

function safeToAutoResolve(ticket) {
  if (!ticket.ai_can_auto_resolve) return false
  if (typeof ticket.ai_confidence !== 'number' || ticket.ai_confidence < 0.9) return false
  if (ticket.ai_access_needed) return false
  if (ticket.ai_project_flag) return false
  if (ticket.ai_escalation_needed) return false
  if (!AUTO_RESOLVE_ALLOWLIST.includes(ticket.ai_category)) return false
  return true
}

export async function POST(request) {
  try {
    const { ticketId } = await request.json()

    if (!ticketId) {
      return Response.json({ error: 'Missing ticketId' }, { status: 400 })
    }

    const { data: ticket } = await supabase
      .from('tickets')
      .select('*, organization:organizations(name, plan), creator:profiles!tickets_created_by_fkey(full_name)')
      .eq('id', ticketId)
      .single()

    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 })
    }

    if (!safeToAutoResolve(ticket)) {
      await supabase.from('ticket_messages').insert({
        ticket_id: ticketId,
        sender_type: 'system',
        body: `🛑 AutoResolve skipped.
Reason: this ticket does not meet the safe auto-resolution rules.
Category: ${ticket.ai_category || 'unknown'}
Confidence: ${ticket.ai_confidence ?? 'n/a'}
Access needed: ${String(ticket.ai_access_needed)}
Project flag: ${String(ticket.ai_project_flag)}
Escalation needed: ${String(ticket.ai_escalation_needed)}`,
        is_internal_note: true,
      })

      return Response.json({
        resolved: false,
        message: 'Ticket is not eligible for safe auto-resolution.',
      })
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
        max_tokens: 1600,
        system: `You are AutoResolve AI at TechDesk Pro.

TechDesk Pro is a remote-first IT support business.
You may only auto-resolve very low-risk tickets such as:
- client portal questions
- support policy / scope / plan questions
- simple FAQ-like help requests
- low-risk instruction-only guidance

You may not auto-resolve anything that requires:
- account access
- system changes
- admin actions
- billing investigation
- security judgment
- vendor coordination
- ambiguity

Return ONLY valid JSON in this exact format:
{
  "can_resolve": true,
  "confidence": 0.95,
  "auto_reply": "Full client-ready message that resolves the issue.",
  "admin_note": "Brief summary of what was resolved and why this was safe to auto-resolve.",
  "difficulty": "easy",
  "estimated_time": "5 minutes"
}`,
        messages: [
          {
            role: 'user',
            content: `Safe auto-resolution candidate:
- Title: ${ticket.title}
- Description: ${ticket.description || 'No description provided'}
- AI category: ${ticket.ai_category || 'unknown'}
- AI summary: ${ticket.ai_summary || 'No summary available'}
- Client: ${ticket.organization?.name || 'Unknown'}
- Plan: ${ticket.organization?.plan || 'starter'}

Write the final reply and internal summary now.`,
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

    if (!parsed.can_resolve || !parsed.auto_reply) {
      return Response.json({
        resolved: false,
        message: 'AutoResolve did not return a safe resolution.',
      })
    }

    await supabase.from('ticket_messages').insert({
      ticket_id: ticketId,
      sender_type: 'ai',
      body: parsed.auto_reply,
      ai_generated: true,
    })

    await supabase.from('ticket_messages').insert({
      ticket_id: ticketId,
      sender_type: 'system',
      body: `🤖 AutoResolve handled this ticket safely.
Confidence: ${Math.round((parsed.confidence || 0) * 100)}%
Difficulty: ${parsed.difficulty || 'easy'}
Estimated time saved: ${parsed.estimated_time || 'unknown'}
Summary: ${parsed.admin_note || 'No note provided'}`,
      is_internal_note: true,
    })

    await supabase
      .from('tickets')
      .update({
        status: 'resolved',
        ai_summary: parsed.admin_note || ticket.ai_summary || null,
      })
      .eq('id', ticketId)

    return Response.json({
      resolved: true,
      confidence: parsed.confidence,
      message: 'Ticket auto-resolved by AI',
    })
  } catch (err) {
    console.error('AutoResolve error:', err)
    return Response.json({ error: err.message || 'AutoResolve failed' }, { status: 500 })
  }
}