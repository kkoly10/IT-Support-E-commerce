// File: app/api/ai/auto-resolve/route.js (new — mkdir -p app/api/ai/auto-resolve)

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

    // Get previously resolved similar tickets as knowledge base
    const { data: resolvedTickets } = await supabase
      .from('tickets')
      .select('title, description, category')
      .eq('category', ticket.category)
      .eq('status', 'resolved')
      .neq('id', ticketId)
      .limit(5)

    const knowledgeBase = (resolvedTickets || []).length > 0
      ? `\n\nKnowledge from previously resolved tickets:\n${resolvedTickets.map(t => `- "${t.title}": ${t.description?.slice(0, 150)}`).join('\n')}`
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
        system: `You are AutoResolve AI at TechDesk Pro. Your job is to determine if you can fully resolve a support ticket automatically, or if it needs human intervention.

You CAN auto-resolve tickets that involve:
- How-to questions (how do I do X in Shopify/Wix?)
- Common troubleshooting (password resets, email config, basic settings)
- Documentation requests (send me info about X)
- Simple configuration guidance
- FAQ-type questions

You CANNOT auto-resolve tickets that involve:
- Needing to log into the client's accounts
- Security incidents (hacking, fraud)
- Payment/billing disputes with third parties
- Physical hardware issues
- Custom code changes
- DNS/domain transfers requiring registrar access
- Platform outages
- Anything requiring human judgment or account access

Respond in this exact JSON format:
{
  "can_resolve": true or false,
  "confidence": 0.0 to 1.0,
  "auto_reply": "If can_resolve is true: the complete helpful reply to send to the client that resolves their issue. If false: leave empty string.",
  "admin_note": "If can_resolve is false: brief note explaining why this needs human attention and what the admin should do. If true: brief summary of what was resolved.",
  "difficulty": "easy|medium|advanced",
  "estimated_time": "How long it would take a human to fix if needed"
}`,
        messages: [
          {
            role: 'user',
            content: `New support ticket:
- Title: ${ticket.title}
- Description: ${ticket.description}
- Category: ${ticket.category}
- Priority: ${ticket.priority}
- Platform: ${ticket.platform || 'Not specified'}
- Client: ${ticket.organization?.name || 'Unknown'}
- Client's store platform: ${ticket.organization?.platform || 'Not specified'}
- Client's store URL: ${ticket.organization?.store_url || 'Not specified'}
${knowledgeBase}

Analyze this ticket and respond with JSON only.`
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

    const cleaned = resultText.replace(/```json\n?|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    if (parsed.can_resolve && parsed.confidence >= 0.8 && parsed.auto_reply) {
      // Auto-resolve: send the AI reply and update ticket status
      await supabase.from('ticket_messages').insert({
        ticket_id: ticketId,
        sender_type: 'ai',
        body: parsed.auto_reply,
        ai_generated: true,
      })

      // Add internal note for admin
      await supabase.from('ticket_messages').insert({
        ticket_id: ticketId,
        sender_type: 'system',
        body: `🤖 AutoResolve handled this ticket (confidence: ${Math.round(parsed.confidence * 100)}%). ${parsed.admin_note}`,
        is_internal_note: true,
      })

      // Set status to resolved
      await supabase
        .from('tickets')
        .update({
          status: 'resolved',
          ai_summary: parsed.admin_note,
        })
        .eq('id', ticketId)

      return Response.json({
        resolved: true,
        confidence: parsed.confidence,
        message: 'Ticket auto-resolved by AI',
      })
    } else {
      // Can't auto-resolve: leave coach notes for admin
      await supabase.from('ticket_messages').insert({
        ticket_id: ticketId,
        sender_type: 'system',
        body: `🧠 AutoResolve Analysis: ${parsed.admin_note || 'This ticket needs human attention.'}\n\n📊 Difficulty: ${parsed.difficulty} | ⏱️ Est. time: ${parsed.estimated_time}`,
        is_internal_note: true,
      })

      // Update AI summary on ticket
      await supabase
        .from('tickets')
        .update({
          ai_summary: parsed.admin_note,
        })
        .eq('id', ticketId)

      return Response.json({
        resolved: false,
        confidence: parsed.confidence,
        difficulty: parsed.difficulty,
        estimated_time: parsed.estimated_time,
        admin_note: parsed.admin_note,
      })
    }

  } catch (err) {
    console.error('AutoResolve error:', err)
    return Response.json({ error: err.message || 'AutoResolve failed' }, { status: 500 })
  }
}