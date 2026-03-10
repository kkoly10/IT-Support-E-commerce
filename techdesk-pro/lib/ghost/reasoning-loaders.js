import { createClient } from '@supabase/supabase-js'
import { normalizeRequestCategory } from '../support-ui'

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

export async function loadGhostContextBundle(ticketId) {
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
    throw new Error('Ticket not found')
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

  const categoryForLookup = normalizeRequestCategory(
    ticket.ai_category || ticket.category || 'other'
  )

  const { data: similarTickets } = await supabase
    .from('tickets')
    .select('id, ticket_number, title, status, category, ai_category, ai_summary, created_at')
    .neq('id', ticketId)
    .eq('status', 'resolved')
    .order('created_at', { ascending: false })
    .limit(12)

  const filteredSimilarTickets = (similarTickets || [])
    .filter((item) => {
      const normalizedCategory = normalizeRequestCategory(
        item.ai_category || item.category || 'other'
      )
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

  const { data: publishedArticles } = await supabase
    .from('kb_articles')
    .select('id, title, summary, problem, likely_cause, published_at')
    .order('published_at', { ascending: false })
    .limit(20)

  const relatedArticles = (publishedArticles || [])
    .map((article) => {
      let score = 0
      const blob = [
        article.title,
        article.summary,
        article.problem,
        article.likely_cause,
        ticket.title,
        ticket.description,
        ticket.ai_summary,
        ticket.category,
        ticket.ai_category,
      ]
        .join(' ')
        .toLowerCase()

      const terms = [
        ticket.title,
        ticket.category,
        ticket.ai_category,
        ticket.organization?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 3)

      for (const term of terms) {
        if (blob.includes(term)) score += 1
      }

      return { ...article, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(b.published_at || 0) - new Date(a.published_at || 0)
    })
    .slice(0, 3)

  return {
    ticket,
    recentConversation,
    filteredSimilarTickets,
    linkedAssessment,
    kbSignal,
    relatedArticles,
  }
}

export async function loadGhostSearchBundle(query) {
  const cleanedQuery = String(query || '').trim()
  const terms = tokenize(cleanedQuery)

  const [ticketsRes, orgsRes, assessmentsRes, kbDraftsRes, kbArticlesRes] = await Promise.all([
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

    supabase
      .from('kb_articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(150),
  ])

  const tickets = ticketsRes.data || []
  const organizations = orgsRes.data || []
  const assessments = assessmentsRes.data || []
  const kbDrafts = kbDraftsRes.data || []
  const kbArticles = kbArticlesRes.data || []

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
        subtitle: `${ticket.organization?.name || 'Unknown client'} · ${
          ticket.ticket_number ? `TDP-${ticket.ticket_number}` : ticket.id.slice(0, 8)
        }`,
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
        subtitle: `${org.client_status || 'unknown'} · onboarding ${
          org.onboarding_status || 'not_started'
        }`,
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
        reason:
          item.pain_points ||
          item.biggest_pain_points ||
          item.support_pain_points ||
          item.environment ||
          'Assessment match',
        score,
        created_at: item.created_at,
      }
    })
    .filter((item) => item.score > 0)

  const kbDraftMatches = kbDrafts
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
        subtitle: draft.ticket_id ? `Draft from ticket ${draft.ticket_id}` : 'Knowledge draft',
        href: `/admin/kb/${draft.id}`,
        reason: draft.short_summary || draft.problem || 'KB/SOP draft match',
        score,
        created_at: draft.created_at,
      }
    })
    .filter((item) => item.score > 0)

  const kbArticleMatches = kbArticles
    .map((article) => {
      const score = scoreText(
        [
          article.title,
          article.summary,
          article.problem,
          article.likely_cause,
          article.reusable_fix_guidance,
          article.future_prevention_note,
          article.slug,
        ].join(' '),
        terms
      )

      return {
        type: 'kb_article',
        id: article.id,
        title: article.title || 'Untitled KB article',
        subtitle: article.slug || 'Published knowledge article',
        href: `/admin/kb/published/${article.id}`,
        reason: article.summary || article.problem || 'Published knowledge match',
        score,
        created_at: article.published_at || article.created_at,
      }
    })
    .filter((item) => item.score > 0)

  const matches = [
    ...ticketMatches,
    ...orgMatches,
    ...assessmentMatches,
    ...kbDraftMatches,
    ...kbArticleMatches,
  ].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return new Date(b.created_at || 0) - new Date(a.created_at || 0)
  })

  return {
    cleanedQuery,
    matches,
    counts: {
      tickets: ticketMatches.length,
      organizations: orgMatches.length,
      assessments: assessmentMatches.length,
      kb_drafts: kbDraftMatches.length,
      kb_articles: kbArticleMatches.length,
    },
  }
}

export async function loadAssessmentReviewBundle(assessmentId) {
  const { data: assessment, error } = await supabase
    .from('assessment_submissions')
    .select('*')
    .eq('id', assessmentId)
    .single()

  if (error || !assessment) {
    throw new Error('Assessment not found')
  }

  return { assessment }
}

export async function loadOnboardingReviewBundle(organizationId) {
  const { data: organization, error } = await supabase
    .from('organizations')
    .select(`
      *,
      profiles(id, full_name, email, role, is_primary_contact)
    `)
    .eq('id', organizationId)
    .single()

  if (error || !organization) {
    throw new Error('Organization not found')
  }

  const primaryEmail =
    organization.profiles?.find((p) => p.is_primary_contact)?.email ||
    organization.profiles?.[0]?.email ||
    null

  let linkedAssessment = null

  if (primaryEmail) {
    const { data } = await supabase
      .from('assessment_submissions')
      .select('*')
      .eq('email', primaryEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    linkedAssessment = data || null
  }

  return {
    organization,
    linkedAssessment,
  }
}