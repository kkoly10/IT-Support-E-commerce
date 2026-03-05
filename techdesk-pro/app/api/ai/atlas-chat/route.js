// File: app/api/ai/atlas-chat/route.js (new — mkdir -p app/api/ai/atlas-chat)

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { message, conversationHistory, userId } = await request.json()
    if (!message || !userId) {
      return Response.json({ error: 'Missing message or userId' }, { status: 400 })
    }

    // Get user profile and org
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, organization:organizations(*)')
      .eq('id', userId)
      .single()

    if (!profile) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const org = profile.organization

    // Get recent tickets for context
    const { data: recentTickets } = await supabase
      .from('tickets')
      .select('title, status, category, priority, created_at, resolved_at')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get ticket stats
    const { data: allTickets } = await supabase
      .from('tickets')
      .select('status')
      .eq('organization_id', org.id)

    const openCount = allTickets?.filter(t => t.status === 'open' || t.status === 'in_progress').length || 0
    const resolvedCount = allTickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0

    const ticketContext = (recentTickets || []).length > 0
      ? `Recent tickets:\n${recentTickets.map(t => `- "${t.title}" (${t.status}, ${t.category}, ${t.priority})`).join('\n')}`
      : 'No tickets yet.'

    // Build conversation messages
    const messages = [
      ...(conversationHistory || []).map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: `You are Atlas AI, the intelligent business copilot at TechDesk Pro. You're chatting with ${profile.full_name} from ${org.name}.

Here's what you know about their business:
- Company: ${org.name}
- Plan: ${org.plan || 'starter'}
- Platform: ${org.platform || 'Not specified'}
- Store URL: ${org.store_url || 'Not specified'}
- Open tickets: ${openCount}
- Resolved tickets: ${resolvedCount}
- Monthly ticket limit: ${org.monthly_ticket_limit || 10}
- Tickets used this month: ${org.tickets_used_this_month || 0}

${ticketContext}

Your capabilities:
- Answer questions about their account, plan, and ticket status
- Provide e-commerce advice (Shopify, Wix, SEO, marketing, integrations)
- Troubleshoot common IT issues with step-by-step guides
- Recommend tools, apps, and integrations for their store
- Help them understand their monthly reports
- Suggest when they should submit a support ticket for something you can't handle

Rules:
- Be conversational, warm, and helpful — like a knowledgeable friend
- Keep responses concise (2-4 paragraphs max unless they ask for detail)
- If something needs hands-on support, suggest they create a ticket
- Never make up data about their account — use only what's provided
- If asked about something outside your knowledge, be honest about it`,
        messages,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Anthropic API error: ${errText}`)
    }

    const aiResult = await response.json()
    const reply = aiResult.content
      .map(block => block.type === 'text' ? block.text : '')
      .join('')

    return Response.json({ reply })

  } catch (err) {
    console.error('Atlas AI error:', err)
    return Response.json({ error: err.message || 'Atlas AI failed' }, { status: 500 })
  }
}