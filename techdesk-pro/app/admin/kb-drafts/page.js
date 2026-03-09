'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const parseDraft = (body) => {
  if (!body?.includes('KB/SOP Draft JSON:')) return null
  const index = body.indexOf('{')
  if (index < 0) return null
  try {
    return JSON.parse(body.slice(index))
  } catch {
    return null
  }
}

export default function AdminKBDraftsPage() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDrafts()
  }, [])

  async function loadDrafts() {
    setLoading(true)
    const { data } = await supabase
      .from('ticket_messages')
      .select('id, ticket_id, body, created_at')
      .eq('is_internal_note', true)
      .like('body', '%KB/SOP Draft JSON:%')
      .order('created_at', { ascending: false })

    setNotes(data || [])
    setLoading(false)
  }

  const drafts = useMemo(
    () => notes.map((note) => ({ ...note, parsed: parseDraft(note.body) })).filter((x) => x.parsed),
    [notes]
  )

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">KB/SOP Drafts</h1>
          <p className="admin-page-desc">AI-generated internal drafts pulled from resolved/closed support requests.</p>
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-loading">Loading drafts...</div>
        ) : drafts.length === 0 ? (
          <div className="admin-empty-text">No KB/SOP drafts yet. Generate one from a support request detail page.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {drafts.map((draft) => (
              <div key={draft.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <strong>{draft.parsed.title || 'Untitled Draft'}</strong>
                  <a href={`/admin/tickets/${draft.ticket_id}`} className="admin-btn-small">Open Ticket</a>
                </div>
                <div className="admin-table-muted" style={{ marginTop: 6 }}>{draft.parsed.summary || 'No summary provided.'}</div>
                <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                  Last generated: {new Date(draft.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
