'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function extractLegacyDraftFromNote(message) {
  if (!message?.body || !message.body.includes('KB/SOP Draft JSON:')) return null

  try {
    const jsonStart = message.body.indexOf('{')
    if (jsonStart === -1) return null
    const parsed = JSON.parse(message.body.slice(jsonStart))

    return {
      id: `legacy-${message.id}`,
      source: 'legacy_note',
      ticket_id: message.ticket_id,
      title: parsed.title || 'Untitled KB/SOP Draft',
      short_summary: parsed.short_summary || '',
      problem: parsed.problem || '',
      likely_cause: parsed.likely_cause || '',
      steps_taken: Array.isArray(parsed.steps_taken) ? parsed.steps_taken : [],
      reusable_fix_guidance: parsed.reusable_fix_guidance || '',
      future_prevention_note: parsed.future_prevention_note || '',
      status: 'legacy_note',
      created_at: message.created_at,
      updated_at: message.created_at,
    }
  } catch {
    return null
  }
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const DRAFT_STATUS_STYLES = {
  draft: { bg: '#fffaeb', color: '#b54708', label: 'Draft' },
  review_needed: { bg: '#fef3f2', color: '#b42318', label: 'Review Needed' },
  ready_to_publish: { bg: '#eef4ff', color: '#1d4ed8', label: 'Ready to Publish' },
  published: { bg: '#ecfdf3', color: '#067647', label: 'Published' },
  legacy_note: { bg: '#f3e8ff', color: '#7c3aed', label: 'Legacy Note' },
}

export default function AdminKnowledgePage() {
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState([])
  const [articles, setArticles] = useState([])
  const [ticketMap, setTicketMap] = useState({})
  const [search, setSearch] = useState('')
  const [selectedDraftIds, setSelectedDraftIds] = useState([])
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchMessage, setBatchMessage] = useState('')
  const [queueFilter, setQueueFilter] = useState('needs_review')

  useEffect(() => {
    loadKnowledge()
  }, [])

  async function loadKnowledge() {
    setLoading(true)

    try {
      const [{ data: kbDrafts }, { data: kbArticles }] = await Promise.all([
        supabase.from('kb_sop_drafts').select('*').order('created_at', { ascending: false }),
        supabase.from('kb_articles').select('*').order('published_at', { ascending: false }),
      ])

      let nextDrafts = kbDrafts || []

      if (nextDrafts.length === 0) {
        const { data: legacyNotes } = await supabase
          .from('ticket_messages')
          .select('id, ticket_id, body, created_at')
          .eq('is_internal_note', true)
          .ilike('body', '%KB/SOP Draft JSON:%')
          .order('created_at', { ascending: false })

        nextDrafts = (legacyNotes || []).map(extractLegacyDraftFromNote).filter(Boolean)
      }

      const ticketIds = [
        ...new Set([
          ...nextDrafts.map((d) => d.ticket_id).filter(Boolean),
          ...(kbArticles || []).map((a) => a.source_ticket_id).filter(Boolean),
        ]),
      ]

      let nextTicketMap = {}

      if (ticketIds.length > 0) {
        const { data: tickets } = await supabase
          .from('tickets')
          .select(`
            id,
            ticket_number,
            title,
            category,
            organization:organizations(name)
          `)
          .in('id', ticketIds)

        nextTicketMap = Object.fromEntries((tickets || []).map((ticket) => [ticket.id, ticket]))
      }

      setDrafts(nextDrafts)
      setArticles(kbArticles || [])
      setTicketMap(nextTicketMap)
      setSelectedDraftIds([])
    } catch (err) {
      console.error('Knowledge load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function runBatchAction(action) {
    if (selectedDraftIds.length === 0) return

    setBatchLoading(true)
    setBatchMessage('')

    try {
      const response = await fetch('/api/ai/ghost-kb-batch-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, draftIds: selectedDraftIds }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'KB batch action failed')

      setBatchMessage(data.message || 'Batch action completed.')
      await loadKnowledge()
    } catch (err) {
      console.error('KB batch action error:', err)
      alert(err.message || 'KB batch action failed')
    } finally {
      setBatchLoading(false)
    }
  }

  const articleByDraftKey = useMemo(() => {
    const map = {}

    for (const article of articles) {
      if (article.source_draft_id) map[article.source_draft_id] = article
      if (article.source_ticket_message_id) map[`legacy-${article.source_ticket_message_id}`] = article
    }

    return map
  }, [articles])

  const visibleDrafts = useMemo(() => {
    const q = search.trim().toLowerCase()

    let next = drafts.filter((draft) => {
      const ticket = ticketMap[draft.ticket_id]
      const matchesSearch =
        !q ||
        draft.title?.toLowerCase().includes(q) ||
        draft.short_summary?.toLowerCase().includes(q) ||
        draft.problem?.toLowerCase().includes(q) ||
        draft.likely_cause?.toLowerCase().includes(q) ||
        ticket?.title?.toLowerCase().includes(q) ||
        ticket?.organization?.name?.toLowerCase().includes(q)

      if (!matchesSearch) return false

      const published = !!articleByDraftKey[draft.id]

      if (queueFilter === 'needs_review') return !published && draft.status !== 'published'
      if (queueFilter === 'ready_to_publish') return !published && draft.status === 'ready_to_publish'
      if (queueFilter === 'published') return published || draft.status === 'published'
      return true
    })

    return next
  }, [drafts, ticketMap, search, queueFilter, articleByDraftKey])

  const visibleArticles = useMemo(() => {
    const q = search.trim().toLowerCase()
    return articles.filter((article) => {
      const ticket = ticketMap[article.source_ticket_id]
      return (
        !q ||
        article.title?.toLowerCase().includes(q) ||
        article.summary?.toLowerCase().includes(q) ||
        article.problem?.toLowerCase().includes(q) ||
        ticket?.title?.toLowerCase().includes(q) ||
        ticket?.organization?.name?.toLowerCase().includes(q)
      )
    })
  }, [articles, ticketMap, search])

  const allVisibleSelected =
    visibleDrafts.length > 0 && visibleDrafts.every((draft) => selectedDraftIds.includes(draft.id))

  function toggleSelectAllVisible() {
    if (allVisibleSelected) {
      setSelectedDraftIds((prev) =>
        prev.filter((id) => !visibleDrafts.some((draft) => draft.id === id))
      )
      return
    }

    setSelectedDraftIds((prev) => [...new Set([...prev, ...visibleDrafts.map((draft) => draft.id)])])
  }

  function toggleDraft(id) {
    setSelectedDraftIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Knowledge Queue</h1>
          <p className="admin-page-desc">
            Review drafts, publish reusable fixes, and manage internal knowledge operations.
          </p>
        </div>
      </div>

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search drafts, articles, clients, tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search-input"
        />

        <select
          value={queueFilter}
          onChange={(e) => setQueueFilter(e.target.value)}
          className="admin-filter-select"
        >
          <option value="needs_review">Needs Review</option>
          <option value="ready_to_publish">Ready to Publish</option>
          <option value="published">Published</option>
          <option value="all">All Drafts</option>
        </select>
      </div>

      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div className="admin-card-header">
          <h3>Batch Knowledge Actions</h3>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="admin-btn-small"
            disabled={batchLoading || selectedDraftIds.length === 0}
            onClick={() => runBatchAction('mark_review_needed')}
          >
            {batchLoading ? 'Working...' : 'Mark Review Needed'}
          </button>

          <button
            type="button"
            className="admin-btn-small"
            disabled={batchLoading || selectedDraftIds.length === 0}
            onClick={() => runBatchAction('mark_ready_to_publish')}
          >
            {batchLoading ? 'Working...' : 'Mark Ready to Publish'}
          </button>

          <button
            type="button"
            className="admin-btn-small"
            disabled={batchLoading || selectedDraftIds.length === 0}
            onClick={() => runBatchAction('publish_selected_drafts')}
          >
            {batchLoading ? 'Publishing...' : 'Publish Selected Drafts'}
          </button>
        </div>

        {batchMessage && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              borderRadius: 8,
              background: '#ecfdf3',
              border: '1px solid #b7ebcc',
              color: '#067647',
              fontSize: '0.86rem',
            }}
          >
            {batchMessage}
          </div>
        )}
      </div>

      <div className="admin-grid-2col">
        <div className="admin-card" style={{ padding: 0 }}>
          <div className="admin-card-header" style={{ padding: '20px 20px 0' }}>
            <h3>Draft Review Queue</h3>
          </div>

          {loading ? (
            <div className="admin-loading" style={{ padding: 40 }}>Loading draft queue...</div>
          ) : visibleDrafts.length === 0 ? (
            <div className="admin-empty-text" style={{ padding: 40 }}>No drafts in this queue.</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAllVisible}
                      />
                    </th>
                    <th>Draft</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDrafts.map((draft) => {
                    const ticket = ticketMap[draft.ticket_id]
                    const article = articleByDraftKey[draft.id]
                    const style =
                      DRAFT_STATUS_STYLES[
                        article ? 'published' : draft.status || 'draft'
                      ] || DRAFT_STATUS_STYLES.draft

                    return (
                      <tr key={draft.id}>
                        <td>
                          {!String(draft.id).startsWith('legacy-') ? (
                            <input
                              type="checkbox"
                              checked={selectedDraftIds.includes(draft.id)}
                              onChange={() => toggleDraft(draft.id)}
                            />
                          ) : null}
                        </td>

                        <td>
                          <div className="admin-table-title">{draft.title || 'Untitled Draft'}</div>
                          <div className="admin-table-sub">
                            {ticket?.ticket_number ? `TDP-${ticket.ticket_number}` : draft.ticket_id?.slice(0, 8) || '—'}
                            {' · '}
                            {ticket?.title || 'Unknown ticket'}
                          </div>
                        </td>

                        <td className="admin-table-muted">
                          {ticket?.organization?.name || '—'}
                        </td>

                        <td>
                          <span
                            className="admin-status-badge"
                            style={{ background: style.bg, color: style.color }}
                          >
                            {style.label}
                          </span>
                        </td>

                        <td className="admin-table-muted">
                          {formatDate(draft.created_at)}
                        </td>

                        <td>
                          <a href={`/admin/kb/${draft.id}`} className="admin-btn-small">
                            View Draft
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="admin-card" style={{ padding: 0 }}>
          <div className="admin-card-header" style={{ padding: '20px 20px 0' }}>
            <h3>Published Knowledge</h3>
          </div>

          {loading ? (
            <div className="admin-loading" style={{ padding: 40 }}>Loading published knowledge...</div>
          ) : visibleArticles.length === 0 ? (
            <div className="admin-empty-text" style={{ padding: 40 }}>No published knowledge yet.</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Client</th>
                    <th>Published</th>
                    <th>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleArticles.map((article) => {
                    const ticket = ticketMap[article.source_ticket_id]

                    return (
                      <tr key={article.id}>
                        <td>
                          <div className="admin-table-title">{article.title}</div>
                          <div className="admin-table-sub">
                            {article.summary || article.problem || 'No summary available'}
                          </div>
                        </td>

                        <td className="admin-table-muted">
                          {ticket?.organization?.name || '—'}
                        </td>

                        <td className="admin-table-muted">
                          {formatDate(article.published_at || article.created_at)}
                        </td>

                        <td>
                          <a href={`/admin/kb/published/${article.id}`} className="admin-btn-small">
                            Open Article
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}