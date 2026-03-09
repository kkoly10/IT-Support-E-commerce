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

    const { data: profile } = await supabase
      .from('profiles')
      .select('*, organization:organizations(*)')
      .eq('id', userId)
      .single()

    if (!profile) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const org = profile.organization

    const { data: recentTickets } = await supabase
      .from('tickets')
      .select('title, status, category, priority, created_at, resolved_at')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: allTickets } = await supabase
      .from('tickets')
      .select('status')
      .eq('organization_id', org.id)

    const openCount =
      allTickets?.filter((t) => t.status === 'open' || t.status === 'in_progress').length || 0

    const resolvedCount =
      allTickets?.filter((t) => t.status === 'resolved' || t.status === 'closed').length || 0

    const ticketContext =
      (recentTickets || []).length > 0
        ? `Recent support requests:\n${recentTickets
            .map((t) => `- "${t.title}" (${t.status}, ${t.category}, ${t.priority})`)
            .join('\n')}`
        : 'No support requests yet.'

    const messages = [
      ...(conversationHistory || []).map((msg) => ({
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
        system: `You are Atlas AI, the remote IT support copilot at TechDesk Pro.

You are chatting with ${profile.full_name} from ${org.name}.

Known account context:
- Company: ${org.name}
- Plan: ${org.plan || 'starter'}
- Open tickets: ${openCount}
- Resolved tickets: ${resolvedCount}
- Monthly ticket limit: ${org.monthly_ticket_limit || 10}
- Tickets used this month: ${org.tickets_used_this_month || 0}

${ticketContext}

Your job:
- Answer questions about support scope, account status, plan, and ticket status
- Help with remote IT support topics
- Help with Microsoft 365, Google Workspace, and common SaaS administration questions
- Explain TechDesk Pro support boundaries in plain English
- Suggest when the user should submit a support ticket

Rules:
- Be warm, clear, and concise
- Keep replies practical and easy to follow
- Do not claim to have completed actions unless context explicitly shows that
- Do not provide project-implementation or marketing advice
- If something requires hands-on support, account access, or human judgment, say so and recommend creating a support ticket
- Never invent account data`,
        messages,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Anthropic API error: ${errText}`)
    }

    const aiResult = await response.json()
    const reply = aiResult.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')

    return Response.json({ reply })
  } catch (err) {
    console.error('Atlas AI error:', err)
    return Response.json({ error: err.message || 'Atlas AI failed' }, { status: 500 })
  }
}