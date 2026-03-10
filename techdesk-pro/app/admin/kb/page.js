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
  const [ticketMap, setTicketMap] = useState({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadDrafts()
  }, [])

  async function loadDrafts() {
    setLoading(true)

    try {
      const { data: kbDrafts } = await supabase
        .from('kb_sop_drafts')
        .select('*')
        .order('created_at', { ascending: false })

      let nextDrafts = kbDrafts || []

      if (nextDrafts.length === 0) {
        const { data: legacyNotes } = await supabase
          .from('ticket_messages')
          .select('id, ticket_id, body, created_at')
          .eq('is_internal_note', true)
          .ilike('body', '%KB/SOP Draft JSON:%')
          .order('created_at', { ascending: false })

        nextDrafts = (legacyNotes || [])
          .map(extractLegacyDraftFromNote)
          .filter(Boolean)
      }

      const ticketIds = [...new Set(nextDrafts.map((d) => d.ticket_id).filter(Boolean))]

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
      setTicketMap(nextTicketMap)
    } catch (err) {
      console.error('KB drafts load error:', err)
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Knowledge Drafts</h1>
          <p className="admin-page-desc">
            Browse KB/SOP drafts generated from resolved support requests.
          </p>
        </div>
      </div>

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search drafts, clients, tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search-input"
        />
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        {loading ? (
          <div className="admin-loading" style={{ padding: 40 }}>
            Loading KB/SOP drafts...
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
                  <th>Source Ticket</th>
                  <th>Client</th>
                  <th>Source</th>
                  <th>Created</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrafts.map((draft) => {
                  const ticket = ticketMap[draft.ticket_id]

                  return (
                    <tr key={draft.id}>
                      <td>
                        <div className="admin-table-title">{draft.title || 'Untitled Draft'}</div>
                        <div className="admin-table-sub">
                          {draft.short_summary || draft.problem || 'No summary available'}
                        </div>
                      </td>

                      <td className="admin-table-muted">
                        {ticket?.ticket_number ? `TDP-${ticket.ticket_number}` : draft.ticket_id ? draft.ticket_id.slice(0, 8) : '—'}
                        <div className="admin-table-sub">{ticket?.title || 'Unknown ticket'}</div>
                      </td>

                      <td className="admin-table-muted">
                        {ticket?.organization?.name || '—'}
                      </td>

                      <td>
                        <span
                          className="admin-status-badge"
                          style={{
                            background: draft.source === 'legacy_note' ? '#f59e0b18' : '#0D7C6618',
                            color: draft.source === 'legacy_note' ? '#b45309' : '#0D7C66',
                          }}
                        >
                          {draft.source === 'legacy_note' ? 'Legacy Note' : 'KB Table'}
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
    </div>
  )
}