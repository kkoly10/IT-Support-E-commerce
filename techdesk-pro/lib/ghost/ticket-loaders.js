import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function loadTicketRuntimeContext(ticketId) {
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
    .select('id, body, sender_type, is_internal_note, created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  const nextMessages = messages || []
  const visibleMessages = nextMessages.filter((m) => !m.is_internal_note)
  const internalNotes = nextMessages.filter((m) => m.is_internal_note)

  const conversation = visibleMessages
    .map((m) => `[${m.sender_type}] ${m.body}`)
    .join('\n\n')

  return {
    ticket,
    messages: nextMessages,
    visibleMessages,
    internalNotes,
    conversation,
  }
}

export async function loadTicketKnowledgeState(ticketId) {
  const { data: latestDraft } = await supabase
    .from('kb_sop_drafts')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let publishedArticle = null

  if (latestDraft?.id) {
    const { data } = await supabase
      .from('kb_articles')
      .select('*')
      .eq('source_draft_id', latestDraft.id)
      .maybeSingle()

    publishedArticle = data || null
  } else {
    const { data } = await supabase
      .from('kb_articles')
      .select('*')
      .eq('source_ticket_id', ticketId)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    publishedArticle = data || null
  }

  return {
    latestDraft: latestDraft || null,
    publishedArticle,
  }
}

export async function updateTicketStatus(ticketId, status) {
  const { error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', ticketId)

  if (error) throw error
}

export function getServiceSupabase() {
  return supabase
}