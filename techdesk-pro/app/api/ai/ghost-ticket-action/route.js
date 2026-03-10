import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function extractTextBlocks(aiResult) {
  return (aiResult?.content || [])
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function buildUniqueSlug(title, seed) {
  const base = slugify(title) || 'kb-article'
  const candidate = `${base}-${String(seed).slice(0, 8)}`

  const { data: existing } = await supabase
    .from('kb_articles')
    .select('id')
    .eq('slug', candidate)
    .maybeSingle()

  if (!existing) return candidate
  return `${candidate}-${Date.now().toString(36)}`
}

async function loadTicketContext(ticketId) {
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select(`
      *,
      organization:organizations(name),
      creator:profiles!tickets_created_by_fkey(full_name, email)
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

  const conversation = (messages || [])
    .filter((m) => !m.is_internal_note)
    .map((m) => `[${m.sender_type}] ${m.body}`)
    .join('\n\n')

  return { ticket, messages: messages || [], conversation }
}

async function generateClientDraft({ ticket, conversation, mode }) {
  const modePrompt =
    mode === 'request_access_details'
      ? `You are drafting a client-facing message for TechDesk Pro.
The client has not yet provided enough access, evidence, or environment detail for the operator to proceed confidently.

Return ONLY valid JSON:
{
  "draft": "client-facing message",
  "suggested_status": "waiting_on_client"
}

Rules:
- be professional, clear, and concise
- ask for the missing access/details needed to move forward
- request the most useful items first: screenshots, exact error text, affected user(s), timing, admin access, platform details
- do not overpromise timelines
- stay within remote IT support scope`
      : `You are drafting a client-facing follow-up for TechDesk Pro.
The ticket should move to waiting on client because the operator needs a response before continuing.

Return ONLY valid JSON:
{
  "draft": "client-facing message",
  "suggested_status": "waiting_on_client"
}

Rules:
- be professional, concise, and calm
- clearly state what is needed from the client to continue
- if specifics are unclear, ask for the most useful missing details
- do not overpromise timelines
- stay within remote IT support scope`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 900,
      system: modePrompt,
      messages: [
        {
          role: 'user',
          content: `Ticket:
- Title: ${ticket.title}
- Description: ${ticket.description || 'No description provided'}
- Current status: ${ticket.status}
- Category: ${ticket.category || 'unknown'}
- AI summary: ${ticket.ai_summary || 'none'}
- Organization: ${ticket.organization?.name || 'Unknown'}
- Contact: ${ticket.creator?.full_name || 'Unknown'} (${ticket.creator?.email || 'unknown'})

Conversation:
${conversation || 'No client-facing conversation yet.'}

Generate the JSON now.`,
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Anthropic API error: ${errorText}`)
  }

  const aiResult = await response.json()
  const rawText = extractTextBlocks(aiResult).replace(/```json\n?|```/g, '').trim()
  const parsed = safeJsonParse(rawText)

  if (!parsed?.draft) {
    throw new Error('Ghost action draft returned invalid JSON')
  }

  return {
    draft: parsed.draft,
    suggested_status: parsed.suggested_status || 'waiting_on_client',
  }
}

async function generateKnowledgeDraft({ ticket, conversation }) {
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
      system: `You are an IT support knowledge-ops assistant for TechDesk Pro.

TechDesk Pro is a remote-first IT support business.
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
- Avoid fluff and avoid mentioning e-commerce/website/automation business lines
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
  const rawText = extractTextBlocks(aiResult).replace(/```json\n?|```/g, '').trim()
  const parsed = safeJsonParse(rawText)

  if (!parsed) {
    throw new Error('Knowledge draft returned invalid JSON')
  }

  return {
    title: parsed.title || `SOP: ${ticket.title}`,
    short_summary:
      parsed.short_summary || ticket.ai_summary || 'Support request resolution summary.',
    problem: parsed.problem || ticket.description || ticket.title,
    likely_cause: parsed.likely_cause || 'Cause to be confirmed by support lead.',
    steps_taken: Array.isArray(parsed.steps_taken) ? parsed.steps_taken : [],
    reusable_fix_guidance:
      parsed.reusable_fix_guidance ||
      'Document repeatable fix pattern and verify access prerequisites.',
    future_prevention_note:
      parsed.future_prevention_note ||
      'Add onboarding checks and proactive monitoring where applicable.',
  }
}

async function upsertKnowledgeDraft(ticketId, draft) {
  const { data: existingDraft } = await supabase
    .from('kb_sop_drafts')
    .select('id')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingDraft?.id) {
    const { error } = await supabase
      .from('kb_sop_drafts')
      .update({
        title: draft.title,
        short_summary: draft.short_summary,
        problem: draft.problem,
        likely_cause: draft.likely_cause,
        steps_taken: draft.steps_taken,
        reusable_fix_guidance: draft.reusable_fix_guidance,
        future_prevention_note: draft.future_prevention_note,
        status: 'draft',
      })
      .eq('id', existingDraft.id)

    if (error) throw error
    return existingDraft.id
  }

  const { data: insertedDraft, error: insertError } = await supabase
    .from('kb_sop_drafts')
    .insert({
      ticket_id: ticketId,
      title: draft.title,
      short_summary: draft.short_summary,
      problem: draft.problem,
      likely_cause: draft.likely_cause,
      steps_taken: draft.steps_taken,
      reusable_fix_guidance: draft.reusable_fix_guidance,
      future_prevention_note: draft.future_prevention_note,
      status: 'draft',
    })
    .select('id')
    .single()

  if (insertError) throw insertError
  return insertedDraft.id
}

async function insertKnowledgeNote(ticketId, draft) {
  const noteBody = `📚 KB/SOP Draft generated from resolved support request

Title: ${draft.title}
Summary: ${draft.short_summary}

KB/SOP Draft JSON:
${JSON.stringify(draft, null, 2)}`

  const { error } = await supabase.from('ticket_messages').insert({
    ticket_id: ticketId,
    sender_type: 'system',
    is_internal_note: true,
    body: noteBody,
  })

  if (error) throw error
}

async function publishKnowledgeArticle(ticketId, draftId, draft) {
  const payload = {
    title: draft.title,
    summary: draft.short_summary,
    problem: draft.problem,
    likely_cause: draft.likely_cause,
    steps_taken: draft.steps_taken,
    reusable_fix_guidance: draft.reusable_fix_guidance,
    future_prevention_note: draft.future_prevention_note,
    source_ticket_id: ticketId,
    source_draft_id: draftId,
    status: 'published',
    published_at: new Date().toISOString(),
  }

  const { data: existingArticle } = await supabase
    .from('kb_articles')
    .select('id')
    .eq('source_draft_id', draftId)
    .maybeSingle()

  if (existingArticle?.id) {
    const { error } = await supabase
      .from('kb_articles')
      .update(payload)
      .eq('id', existingArticle.id)

    if (error) throw error
    return existingArticle.id
  }

  const slug = await buildUniqueSlug(draft.title, draftId)

  const { data: insertedArticle, error: insertError } = await supabase
    .from('kb_articles')
    .insert({
      ...payload,
      slug,
    })
    .select('id')
    .single()

  if (insertError) throw insertError
  return insertedArticle.id
}

export async function POST(request) {
  try {
    const { ticketId, action } = await request.json()

    if (!ticketId) {
      return Response.json({ error: 'Missing ticketId' }, { status: 400 })
    }

    if (!action) {
      return Response.json({ error: 'Missing action' }, { status: 400 })
    }

    const { ticket, conversation } = await loadTicketContext(ticketId)

    if (action === 'waiting_on_client_followup') {
      const result = await generateClientDraft({
        ticket,
        conversation,
        mode: 'waiting_on_client_followup',
      })

      const { error } = await supabase
        .from('tickets')
        .update({ status: 'waiting_on_client' })
        .eq('id', ticketId)

      if (error) throw error

      return Response.json({
        success: true,
        action,
        draft: result.draft,
        updatedStatus: 'waiting_on_client',
        message: 'Ticket moved to waiting on client and follow-up draft prepared.',
      })
    }

    if (action === 'request_access_details') {
      const result = await generateClientDraft({
        ticket,
        conversation,
        mode: 'request_access_details',
      })

      const { error } = await supabase
        .from('tickets')
        .update({ status: 'waiting_on_client' })
        .eq('id', ticketId)

      if (error) throw error

      return Response.json({
        success: true,
        action,
        draft: result.draft,
        updatedStatus: 'waiting_on_client',
        message: 'Access/details request draft prepared and ticket moved to waiting on client.',
      })
    }

    if (action === 'resolve_and_publish') {
      if (!['resolved', 'closed'].includes(ticket.status)) {
        const { error } = await supabase
          .from('tickets')
          .update({ status: 'resolved' })
          .eq('id', ticketId)

        if (error) throw error
      }

      const draft = await generateKnowledgeDraft({ ticket: { ...ticket, status: 'resolved' }, conversation })
      const draftId = await upsertKnowledgeDraft(ticketId, draft)
      await insertKnowledgeNote(ticketId, draft)
      const articleId = await publishKnowledgeArticle(ticketId, draftId, draft)

      return Response.json({
        success: true,
        action,
        updatedStatus: 'resolved',
        draft,
        draftId,
        articleId,
        message: 'Ticket resolved and knowledge article published.',
      })
    }

    return Response.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (err) {
    console.error('Ghost ticket action error:', err)
    return Response.json(
      { error: err.message || 'Failed to run Ghost action' },
      { status: 500 }
    )
  }
}