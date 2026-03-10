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

async function publishDraftForTicket(ticketId) {
  const { data: draft } = await supabase
    .from('kb_sop_drafts')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!draft) {
    return { ok: false, reason: 'No draft found' }
  }

  const payload = {
    title: draft.title,
    summary: draft.short_summary,
    problem: draft.problem,
    likely_cause: draft.likely_cause,
    steps_taken: draft.steps_taken,
    reusable_fix_guidance: draft.reusable_fix_guidance,
    future_prevention_note: draft.future_prevention_note,
    source_ticket_id: ticketId,
    source_draft_id: draft.id,
    status: 'published',
    published_at: new Date().toISOString(),
  }

  const { data: existingArticle } = await supabase
    .from('kb_articles')
    .select('id')
    .eq('source_draft_id', draft.id)
    .maybeSingle()

  if (existingArticle?.id) {
    const { error: updateError } = await supabase
      .from('kb_articles')
      .update(payload)
      .eq('id', existingArticle.id)

    if (updateError) {
      return { ok: false, reason: updateError.message }
    }

    return { ok: true, articleId: existingArticle.id, mode: 'updated' }
  }

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

  return { ok: true, articleId: insertedArticle.id, mode: 'created' }
}

export async function POST(request) {
  try {
    const { action, ticketIds } = await request.json()

    if (!action) {
      return Response.json({ error: 'Missing action' }, { status: 400 })
    }

    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return Response.json({ error: 'Missing ticketIds' }, { status: 400 })
    }

    if (action === 'mark_waiting_on_client') {
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'waiting_on_client' })
        .in('id', ticketIds)

      if (error) throw error

      return Response.json({
        success: true,
        action,
        updatedCount: ticketIds.length,
        message: `${ticketIds.length} ticket(s) moved to waiting on client.`,
      })
    }

    if (action === 'mark_resolved') {
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'resolved' })
        .in('id', ticketIds)

      if (error) throw error

      return Response.json({
        success: true,
        action,
        updatedCount: ticketIds.length,
        message: `${ticketIds.length} ticket(s) marked resolved.`,
      })
    }

    if (action === 'publish_existing_kb') {
      const results = []

      for (const ticketId of ticketIds) {
        const result = await publishDraftForTicket(ticketId)
        results.push({ ticketId, ...result })
      }

      const successCount = results.filter((r) => r.ok).length
      const failed = results.filter((r) => !r.ok)

      return Response.json({
        success: true,
        action,
        updatedCount: successCount,
        failedCount: failed.length,
        results,
        message:
          failed.length === 0
            ? `${successCount} knowledge article(s) published or updated.`
            : `${successCount} published/updated, ${failed.length} skipped.`,
      })
    }

    return Response.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (err) {
    console.error('Ghost batch action error:', err)
    return Response.json(
      { error: err.message || 'Failed to run batch action' },
      { status: 500 }
    )
  }
}