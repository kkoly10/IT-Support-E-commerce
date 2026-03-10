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

export default function AdminKnowledgePage() {
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState([])
  const [articles, setArticles] = useState([])
  const [ticketMap, setTicketMap] = useState({})
  const [search, setSearch] = useState('')

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
    } catch (err) {
      console.error('Knowledge load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const articleByDraftKey = useMemo(() => {
    const map = {}

    for (const article of articles) {
      if (article.source_draft_id) {
        map[article.source_draft_id] = article
      }
      if (article.source_ticket_message_id) {
        map[`legacy-${article.source_ticket_message_id}`] = article
      }
    }

    return map
  }, [articles])

  const filteredDrafts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return drafts

    return drafts.filter((draft) => {
      const ticket = ticketMap[draft.ticket_id]
      return (
        draft.title?.toLowerCase().includes(q) ||
        draft.short_summary?.toLowerCase().includes(q) ||
        draft.problem?.toLowerCase().includes(q) ||
        draft.likely_cause?.toLowerCase().includes(q) ||
        draft.reusable_fix_guidance?.toLowerCase().includes(q) ||
        ticket?.title?.toLowerCase().includes(q) ||
        ticket?.organization?.name?.toLowerCase().includes(q)
      )
    })
  }, [drafts, ticketMap, search])

  const filteredArticles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return articles

    return articles.filter((article) => {
      const ticket = ticketMap[article.source_ticket_id]
      return (
        article.title?.toLowerCase().includes(q) ||
        article.summary?.toLowerCase().includes(q) ||
        article.problem?.toLowerCase().includes(q) ||
        article.likely_cause?.toLowerCase().includes(q) ||
        article.reusable_fix_guidance?.toLowerCase().includes(q) ||
        ticket?.title?.toLowerCase().includes(q) ||
        ticket?.organization?.name?.toLowerCase().includes(q)
      )
    })
  }, [articles, ticketMap, search])

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Knowledge Drafts</h1>
          <p className="admin-page-desc">
            Turn resolved support work into reusable internal knowledge.
          </p>
        </div>
      </div>

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search drafts, published knowledge, clients, tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search-input"
        />
      </div>

      <div className="admin-grid-2col">
        <div className="admin-card" style={{ padding: 0 }}>
          <div className="admin-card-header" style={{ padding: '20px 20px 0' }}>
            <h3>Drafts</h3>
          </div>

          {loading ? (
            <div className="admin-loading" style={{ padding: 40 }}>
              Loading drafts...
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="admin-empty-text" style={{ padding: 40 }}>
              No KB/SOP drafts found yet.
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Draft</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrafts.map((draft) => {
                    const ticket = ticketMap[draft.ticket_id]
                    const article = articleByDraftKey[draft.id]

                    return (
                      <tr key={draft.id}>
                        <td>
                          <div className="admin-table-title">{draft.title || 'Untitled Draft'}</div>
                          <div className="admin-table-sub">
                            {ticket?.ticket_number ? `TDP-${ticket.ticket_number}` : draft.ticket_id ? draft.ticket_id.slice(0, 8) : '—'}
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
                            style={{
                              background: article ? '#ecfdf3' : '#fffaeb',
                              color: article ? '#067647' : '#b54708',
                            }}
                          >
                            {article ? 'Published' : 'Draft'}
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
            <div className="admin-loading" style={{ padding: 40 }}>
              Loading published knowledge...
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="admin-empty-text" style={{ padding: 40 }}>
              No published knowledge articles yet.
            </div>
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
                  {filteredArticles.map((article) => {
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