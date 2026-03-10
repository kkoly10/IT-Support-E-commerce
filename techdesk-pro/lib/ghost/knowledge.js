import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

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

export async function upsertKnowledgeDraft(ticketId, draft, status = 'draft') {
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
        status,
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
      status,
    })
    .select('id')
    .single()

  if (insertError) throw insertError
  return insertedDraft.id
}

export async function insertKnowledgeNote(ticketId, draft) {
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

export async function publishKnowledgeArticle(ticketId, draftId, draft) {
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

    await supabase
      .from('kb_sop_drafts')
      .update({ status: 'published' })
      .eq('id', draftId)

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

  await supabase
    .from('kb_sop_drafts')
    .update({ status: 'published' })
    .eq('id', draftId)

  return insertedArticle.id
}