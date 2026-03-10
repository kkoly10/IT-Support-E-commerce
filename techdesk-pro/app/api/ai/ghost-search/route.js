import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function normalizeText(value) {
  return String(value || '').toLowerCase()
}

function tokenize(query) {
  return normalizeText(query)
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
}

function scoreText(text, terms) {
  const haystack = normalizeText(text)
  let score = 0

  for (const term of terms) {
    if (haystack.includes(term)) score += 1
  }

  return score
}

function fallbackResponse(query, matches) {
  if (matches.length === 0) {
    return {
      answer: `I did not find strong matches for "${query}" across tickets, organizations, assessments, or KB drafts.`,
      recommended_actions: [
        'Try a more specific product, client, or issue keyword.',
        'Search by organization name, platform name, or part of the ticket title.',
      ],
    }
  }

  const top = matches.slice(0, 5)
  return {
    answer: `I found ${matches.length} relevant internal records for "${query}". The strongest matches are shown below for review.`,
    recommended_actions: [
      'Open the top match first and verify the latest operational truth.',
      'Use similar tickets or KB drafts to reduce duplicate work.',
      'Check lifecycle or assessment context before promising next steps.',
    ],
    top_match_labels: top.map((m) => `${m.type}: ${m.title}`),
  }
}

export async function POST(request) {
  try {
    const { query } = await request.json()

    if (!query || !String(query).trim()) {
      return Response.json({ error: 'Missing query' }, { status: 400 })
    }

    const cleanedQuery = String(query).trim()
    const terms = tokenize(cleanedQuery)

    const [ticketsRes, orgsRes, assessmentsRes, kbRes] = await Promise.all([
      supabase
        .from('tickets')
        .select(`
          id,
          ticket_number,
          title,
          description,
          status,
          priority,
          category,
          ai_category,
          ai_summary,
          created_at,
          updated_at,
          organization:organizations(name)
        `)
        .order('created_at', { ascending: false })
        .limit(150),

      supabase
        .from('organizations')
        .select(`
          id,
          name,
          client_status,
          onboarding_status,
          agreement_status,
          payment_status,
          industry,
          lead_interest,
          notes,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100),

      supabase
        .from('assessment_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),

      supabase
        .from('kb_sop_drafts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(150),
    ])

    const tickets = ticketsRes.data || []
    const organizations = orgsRes.data || []
    const assessments = assessmentsRes.data || []
    const kbDrafts = kbRes.data || []

    const ticketMatches = tickets
      .map((ticket) => {
        const score = scoreText(
          [
            ticket.title,
            ticket.description,
            ticket.category,
            ticket.ai_category,
            ticket.ai_summary,
            ticket.organization?.name,
            ticket.status,
            ticket.priority,
          ].join(' '),
          terms
        )

        return {
          type: 'ticket',
          id: ticket.id,
          title: ticket.title || 'Untitled ticket',
          subtitle: `${ticket.organization?.name || 'Unknown client'} · ${ticket.ticket_number ? `TDP-${ticket.ticket_number}` : ticket.id.slice(0, 8)}`,
          href: `/admin/tickets/${ticket.id}`,
          reason: ticket.ai_summary || ticket.description || 'Support request match',
          score,
          created_at: ticket.created_at,
        }
      })
      .filter((item) => item.score > 0)

    const orgMatches = organizations
      .map((org) => {
        const score = scoreText(
          [
            org.name,
            org.client_status,
            org.onboarding_status,
            org.agreement_status,
            org.payment_status,
            org.industry,
            org.lead_interest,
            org.notes,
          ].join(' '),
          terms
        )

        return {
          type: 'organization',
          id: org.id,
          title: org.name || 'Untitled organization',
          subtitle: `${org.client_status || 'unknown'} · onboarding ${org.onboarding_status || 'not_started'}`,
          href: '/admin/clients',
          reason: org.notes || org.industry || 'Organization match',
          score,
          created_at: org.created_at,
        }
      })
      .filter((item) => item.score > 0)

    const assessmentMatches = assessments
      .map((item) => {
        const score = scoreText(
          [
            item.business_name,
            item.full_name,
            item.email,
            item.phone,
            item.industry,
            item.environment,
            item.platforms_tools,
            item.tools_platforms,
            item.tools,
            item.urgency,
            item.status,
            item.pain_points,
            item.biggest_pain_points,
            item.support_pain_points,
            item.notes,
          ].join(' '),
          terms
        )

        return {
          type: 'assessment',
          id: item.id,
          title: item.business_name || 'Untitled assessment',
          subtitle: `${item.full_name || 'Unknown contact'} · ${item.status || 'new'}`,
          href: '/admin/assessments',
          reason: item.pain_points || item.biggest_pain_points || item.support_pain_points || item.environment || 'Assessment match',
          score,
          created_at: item.created_at,
        }
      })
      .filter((item) => item.score > 0)

    const kbMatches = kbDrafts
      .map((draft) => {
        const score = scoreText(
          [
            draft.title,
            draft.short_summary,
            draft.problem,
            draft.likely_cause,
            draft.reusable_fix_guidance,
            draft.future_prevention_note,
          ].join(' '),
          terms
        )

        return {
          type: 'kb_draft',
          id: draft.id,
          title: draft.title || 'Untitled KB draft',
          subtitle: draft.ticket_id ? `Ticket ${draft.ticket_id}` : 'Knowledge draft',
          href: `/admin/kb/${draft.id}`,
          reason: draft.short_summary || draft.problem || 'KB/SOP draft match',
          score,
          created_at: draft.created_at,
        }
      })
      .filter((item) => item.score > 0)

    const allMatches = [
      ...ticketMatches,
      ...orgMatches,
      ...assessmentMatches,
      ...kbMatches,
    ].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    })

    let synthesized = fallbackResponse(cleanedQuery, allMatches)

    try {
      const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1200,
          system: `You are Ghost Admin, the internal operations brain for TechDesk Pro.

TechDesk Pro is a founder-led, remote-first IT support business.

You are given an internal search question plus the best matching records from:
- support tickets
- organizations
- assessment submissions
- KB/SOP drafts

Return ONLY valid JSON in this exact structure:
{
  "answer": "Short practical answer for the operator",
  "recommended_actions": ["Action 1", "Action 2", "Action 3"]
}

Rules:
- stay within remote IT support operations
- be concise and operator-focused
- do not hallucinate records beyond the supplied matches
- if the evidence is weak, say so clearly`,
          messages: [
            {
              role: 'user',
              content: `Operator query:
${cleanedQuery}

Top internal matches:
${allMatches.slice(0, 12).map((m, i) => `${i + 1}. [${m.type}] ${m.title} | ${m.subtitle} | ${m.reason}`).join('\n') || 'No matches found'}

Return the JSON now.`,
            },
          ],
        }),
      })

      if (aiResponse.ok) {
        const aiResult = await aiResponse.json()
        const rawText = (aiResult?.content || [])
          .map((block) => (block.type === 'text' ? block.text : ''))
          .join('')
          .replace(/```json\n?|```/g, '')
          .trim()

        const parsed = JSON.parse(rawText)
        if (parsed?.answer) synthesized = parsed
      }
    } catch (err) {
      console.error('Ghost search synthesis fallback used:', err)
    }

    return Response.json({
      success: true,
      answer: synthesized.answer,
      recommended_actions: Array.isArray(synthesized.recommended_actions)
        ? synthesized.recommended_actions
        : [],
      counts: {
        tickets: ticketMatches.length,
        organizations: orgMatches.length,
        assessments: assessmentMatches.length,
        kb_drafts: kbMatches.length,
      },
      matches: allMatches.slice(0, 20),
    })
  } catch (err) {
    console.error('Ghost search error:', err)
    return Response.json(
      { error: err.message || 'Failed to run Ghost search' },
      { status: 500 }
    )
  }
}