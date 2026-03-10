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

async function publishDraft(draftId) {
  const { data: draft } = await supabase
    .from('kb_sop_drafts')
    .select('*')
    .eq('id', draftId)
    .single()

  if (!draft) {
    return { ok: false, reason: 'Draft not found' }
  }

  const payload = {
    title: draft.title,
    summary: draft.short_summary,
    problem: draft.problem,
    likely_cause: draft.likely_cause,
    steps_taken: draft.steps_taken,
    reusable_fix_guidance: draft.reusable_fix_guidance,
    future_prevention_note: draft.future_prevention_note,
    source_ticket_id: draft.ticket_id,
    source_draft_id: draft.id,
    status: 'published',
    published_at: new Date().toISOString(),
  }

  const { data: existingArticle } = await supabase
    .from('kb_articles')
    .select('id')
    .eq('source_draft_id', draft.id)
    .maybeSingle()

  let articleId = null

  if (existingArticle?.id) {
    const { error: updateError } = await supabase
      .from('kb_articles')
      .update(payload)
      .eq('id', existingArticle.id)

    if (updateError) {
      return { ok: false, reason: updateError.message }
    }

    articleId = existingArticle.id
  } else {
    const slug = await buildUniqueSlug(draft.title, draft.id)

    const { data: insertedArticle, error: insertError } = await supabase
      .from('kb_articles')
      .insert({
        ...payload,
        slug,
      })
      .select('id')
      .single()

    if (insertError) {
      return { ok: false, reason: insertError.message }
    }

    articleId = insertedArticle.id
  }

  const { error: draftUpdateError } = await supabase
    .from('kb_sop_drafts')
    .update({ status: 'published' })
    .eq('id', draft.id)

  if (draftUpdateError) {
    return { ok: false, reason: draftUpdateError.message }
  }

  return { ok: true, articleId }
}

export async function POST(request) {
  try {
    const { action, draftIds } = await request.json()

    if (!action) {
      return Response.json({ error: 'Missing action' }, { status: 400 })
    }

    if (!Array.isArray(draftIds) || draftIds.length === 0) {
      return Response.json({ error: 'Missing draftIds' }, { status: 400 })
    }

    if (action === 'mark_review_needed') {
      const { error } = await supabase
        .from('kb_sop_drafts')
        .update({ status: 'review_needed' })
        .in('id', draftIds)

      if (error) throw error

      return Response.json({
        success: true,
        action,
        updatedCount: draftIds.length,
        message: `${draftIds.length} draft(s) marked review needed.`,
      })
    }

    if (action === 'mark_ready_to_publish') {
      const { error } = await supabase
        .from('kb_sop_drafts')
        .update({ status: 'ready_to_publish' })
        .in('id', draftIds)

      if (error) throw error

      return Response.json({
        success: true,
        action,
        updatedCount: draftIds.length,
        message: `${draftIds.length} draft(s) marked ready to publish.`,
      })
    }

    if (action === 'publish_selected_drafts') {
      const results = []

      for (const draftId of draftIds) {
        const result = await publishDraft(draftId)
        results.push({ draftId, ...result })
      }

      const successCount = results.filter((r) => r.ok).length
      const failedCount = results.filter((r) => !r.ok).length

      return Response.json({
        success: true,
        action,
        updatedCount: successCount,
        failedCount,
        results,
        message:
          failedCount === 0
            ? `${successCount} draft(s) published successfully.`
            : `${successCount} published, ${failedCount} failed.`,
      })
    }

    return Response.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (err) {
    console.error('Ghost KB batch action error:', err)
    return Response.json(
      { error: err.message || 'Failed to run KB batch action' },
      { status: 500 }
    )
  }
}