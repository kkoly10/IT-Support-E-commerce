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

function parseLegacyDraft(message) {
  if (!message?.body || !message.body.includes('KB/SOP Draft JSON:')) return null

  try {
    const jsonStart = message.body.indexOf('{')
    if (jsonStart === -1) return null
    const parsed = JSON.parse(message.body.slice(jsonStart))

    return {
      title: parsed.title || 'Untitled KB/SOP Draft',
      short_summary: parsed.short_summary || '',
      problem: parsed.problem || '',
      likely_cause: parsed.likely_cause || '',
      steps_taken: Array.isArray(parsed.steps_taken) ? parsed.steps_taken : [],
      reusable_fix_guidance: parsed.reusable_fix_guidance || '',
      future_prevention_note: parsed.future_prevention_note || '',
      ticket_id: message.ticket_id,
      source_ticket_message_id: message.id,
      source_draft_id: null,
    }
  } catch {
    return null
  }
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

export async function POST(request) {
  try {
    const { draftId } = await request.json()

    if (!draftId) {
      return Response.json({ error: 'Missing draftId' }, { status: 400 })
    }

    let normalizedDraft = null
    let existingArticle = null

    if (String(draftId).startsWith('legacy-')) {
      const messageId = String(draftId).replace('legacy-', '')

      const { data: message, error: messageError } = await supabase
        .from('ticket_messages')
        .select('id, ticket_id, body, created_at')
        .eq('id', messageId)
        .single()

      if (messageError || !message) {
        return Response.json({ error: 'Legacy KB note not found' }, { status: 404 })
      }

      normalizedDraft = parseLegacyDraft(message)

      if (!normalizedDraft) {
        return Response.json({ error: 'Legacy KB note could not be parsed' }, { status: 400 })
      }

      const { data: existing } = await supabase
        .from('kb_articles')
        .select('id')
        .eq('source_ticket_message_id', messageId)
        .maybeSingle()

      existingArticle = existing || null
    } else {
      const { data: draft, error: draftError } = await supabase
        .from('kb_sop_drafts')
        .select('*')
        .eq('id', draftId)
        .single()

      if (draftError || !draft) {
        return Response.json({ error: 'KB draft not found' }, { status: 404 })
      }

      normalizedDraft = {
        title: draft.title || 'Untitled KB/SOP Draft',
        short_summary: draft.short_summary || '',
        problem: draft.problem || '',
        likely_cause: draft.likely_cause || '',
        steps_taken: Array.isArray(draft.steps_taken) ? draft.steps_taken : [],
        reusable_fix_guidance: draft.reusable_fix_guidance || '',
        future_prevention_note: draft.future_prevention_note || '',
        ticket_id: draft.ticket_id || null,
        source_ticket_message_id: null,
        source_draft_id: draft.id,
      }

      const { data: existing } = await supabase
        .from('kb_articles')
        .select('id')
        .eq('source_draft_id', draft.id)
        .maybeSingle()

      existingArticle = existing || null
    }

    const payload = {
      title: normalizedDraft.title,
      summary: normalizedDraft.short_summary,
      problem: normalizedDraft.problem,
      likely_cause: normalizedDraft.likely_cause,
      steps_taken: normalizedDraft.steps_taken,
      reusable_fix_guidance: normalizedDraft.reusable_fix_guidance,
      future_prevention_note: normalizedDraft.future_prevention_note,
      source_ticket_id: normalizedDraft.ticket_id,
      source_draft_id: normalizedDraft.source_draft_id,
      source_ticket_message_id: normalizedDraft.source_ticket_message_id,
      status: 'published',
      published_at: new Date().toISOString(),
    }

    let articleId = existingArticle?.id || null

    if (existingArticle?.id) {
      const { error: updateError } = await supabase
        .from('kb_articles')
        .update(payload)
        .eq('id', existingArticle.id)

      if (updateError) throw updateError
    } else {
      const slug = await buildUniqueSlug(normalizedDraft.title, draftId)

      const { data: inserted, error: insertError } = await supabase
        .from('kb_articles')
        .insert({
          ...payload,
          slug,
        })
        .select('id')
        .single()

      if (insertError) throw insertError
      articleId = inserted.id
    }

    return Response.json({
      success: true,
      articleId,
      message: existingArticle ? 'Knowledge article updated.' : 'Knowledge article published.',
    })
  } catch (err) {
    console.error('Publish KB draft error:', err)
    return Response.json(
      { error: err.message || 'Failed to publish KB draft' },
      { status: 500 }
    )
  }
}