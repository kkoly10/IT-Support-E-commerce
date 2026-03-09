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
      .select('*, organization:organizations(name, plan), creator:profiles!tickets_created_by_fkey(full_name)')
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

    const conversationHistory = (messages || [])
      .map((msg) => {
        const sender = msg.sender?.full_name || msg.sender_type
        return `[${msg.sender_type.toUpperCase()}] ${sender}: ${msg.body}`
      })
      .join('\n\n')

    const { data: similarTickets } = await supabase
      .from('tickets')
      .select('title, description, category, ai_summary')
      .eq('category', ticket.category)
      .eq('status', 'resolved')
      .neq('id', ticketId)
      .order('resolved_at', { ascending: false })
      .limit(3)

    const similarContext =
      (similarTickets || []).length > 0
        ? `\n\nPreviously resolved similar tickets:\n${similarTickets
            .map((t) => `- "${t.title}": ${(t.ai_summary || t.description || '').slice(0, 180)}`)
            .join('\n')}`
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
        system: `You are Ghost Admin at TechDesk Pro.

TechDesk Pro is a remote-first IT support business.
You are a senior remote IT support lead coaching a founder-operator.

You have two jobs:

1. Write a professional client-ready support reply
2. Coach the admin on how to resolve the issue step by step

Return ONLY valid JSON in this exact structure:

{
  "suggested_reply": "Client-ready response",
  "coach": {
    "summary": "One-sentence plain-English explanation of the issue",
    "difficulty": "easy|medium|advanced",
    "estimated_time": "15 minutes",
    "can_auto_resolve": false,
    "steps": [
      "Step 1",
      "Step 2",
      "Step 3"
    ],
    "what_to_tell_client": "Short expectation-setting message",
    "learn_more": "Short explanation of why this issue happens",
    "escalation_needed": false,
    "escalation_reason": ""
  }
}

Rules:
- Stay within remote IT support, Microsoft 365, Google Workspace, SaaS admin, and support workflow topics
- Do not provide project-implementation or marketing advice
- If the issue needs account access, risky admin changes, security judgment, or project work, say so
- Keep the suggested reply professional, warm, and practical
- Keep the coach steps specific enough for a non-expert founder-admin`,
        messages: [
          {
            role: 'user',
            content: `Ticket details:
- Title: ${ticket.title}
- Description: ${ticket.description || 'No description provided'}
- Category: ${ticket.category || 'Not specified'}
- Priority: ${ticket.priority || 'Not specified'}
- Platform: ${ticket.platform || 'Not specified'}
- AI triage category: ${ticket.ai_category || 'Not available'}
- AI triage summary: ${ticket.ai_summary || 'Not available'}
- AI difficulty: ${ticket.ai_difficulty || 'Not available'}
- AI estimated time: ${ticket.ai_estimated_time || 'Not available'}
- Client: ${ticket.organization?.name || 'Unknown'}
- Client plan: ${ticket.organization?.plan || 'starter'}

Conversation so far:
${conversationHistory || 'No messages yet — this is a new ticket.'}
${similarContext}

Generate the ghost admin reply and coach guide now.`,
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

    return Response.json(parsed)
  } catch (err) {
    console.error('Ghost Admin error:', err)
    return Response.json({ error: err.message || 'Failed to generate suggestion' }, { status: 500 })
  }
}