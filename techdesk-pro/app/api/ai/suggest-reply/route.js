// File: app/api/ai/suggest-reply/route.js (new — mkdir -p app/api/ai/suggest-reply)

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
      .select('*, organization:organizations(name, platform, store_url), creator:profiles!tickets_created_by_fkey(full_name)')
      .eq('id', ticketId)
      .single()

    if (!ticket) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const { data: messages } = await supabase
      .from('ticket_messages')
      .select('*, sender:profiles!ticket_messages_sender_id_fkey(full_name, role)')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    const conversationHistory = (messages || []).map(msg => {
      const sender = msg.sender?.full_name || msg.sender_type
      return `[${msg.sender_type.toUpperCase()}] ${sender}: ${msg.body}`
    }).join('\n\n')

    const { data: similarTickets } = await supabase
      .from('tickets')
      .select('title, description, category')
      .eq('category', ticket.category)
      .eq('status', 'resolved')
      .neq('id', ticketId)
      .order('resolved_at', { ascending: false })
      .limit(3)

    const similarContext = (similarTickets || []).length > 0
      ? `\n\nPreviously resolved similar tickets:\n${similarTickets.map(t => `- "${t.title}": ${t.description?.slice(0, 150)}`).join('\n')}`
      : ''

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: `You are a senior IT support and e-commerce specialist at TechDesk Pro. You have two jobs:

1. GHOST ADMIN: Write a professional reply to send to the client
2. AI COACH: Teach the admin (who is learning IT) how to actually resolve this issue

You MUST respond in this exact JSON format and nothing else:
{
  "suggested_reply": "The professional message to send to the client. Be warm, helpful, and specific.",
  "coach": {
    "summary": "One sentence explaining what's wrong in plain English",
    "difficulty": "easy|medium|advanced",
    "estimated_time": "How long this typically takes to fix (e.g. '5 minutes', '30 minutes', '1-2 hours')",
    "can_auto_resolve": false,
    "steps": [
      "Step 1: Clear instruction written for a non-expert",
      "Step 2: Next step with specific details",
      "Step 3: Continue as needed"
    ],
    "what_to_tell_client": "A brief message to set expectations while you work on it",
    "learn_more": "A brief explanation of WHY this issue happens so the admin learns for next time",
    "escalation_needed": false,
    "escalation_reason": ""
  }
}`,
        messages: [
          {
            role: 'user',
            content: `Ticket Details:
- Title: ${ticket.title}
- Description: ${ticket.description}
- Category: ${ticket.category}
- Priority: ${ticket.priority}
- Platform: ${ticket.platform || 'Not specified'}
- Client: ${ticket.organization?.name || 'Unknown'}
- Client's Platform: ${ticket.organization?.platform || 'Not specified'}
- Store URL: ${ticket.organization?.store_url || 'Not specified'}

Conversation so far:
${conversationHistory || 'No messages yet — this is a new ticket.'}
${similarContext}

Generate the ghost admin reply and coach guide now. Return ONLY valid JSON.`
          }
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Anthropic API error: ${errText}`)
    }

    const aiResult = await response.json()
    const resultText = aiResult.content
      .map(block => block.type === 'text' ? block.text : '')
      .join('')

    // Parse the JSON response
    const cleaned = resultText.replace(/```json\n?|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return Response.json(parsed)

  } catch (err) {
    console.error('Ghost Admin error:', err)
    return Response.json({ error: err.message || 'Failed to generate suggestion' }, { status: 500 })
  }
}