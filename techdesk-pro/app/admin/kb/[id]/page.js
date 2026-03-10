'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

function formatDateTime(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function AdminKnowledgeDraftDetailPage() {
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState(null)
  const [ticket, setTicket] = useState(null)

  useEffect(() => {
    loadDraft()
  }, [id])

  async function loadDraft() {
    setLoading(true)

    try {
      let nextDraft = null

      if (String(id).startsWith('legacy-')) {
        const messageId = String(id).replace('legacy-', '')

        const { data: message } = await supabase
          .from('ticket_messages')
          .select('id, ticket_id, body, created_at')
          .eq('id', messageId)
          .single()

        nextDraft = extractLegacyDraftFromNote(message)
      } else {
        const { data } = await supabase
          .from('kb_sop_drafts')
          .select('*')
          .eq('id', id)
          .single()

        nextDraft = data || null
      }

      setDraft(nextDraft)

      if (nextDraft?.ticket_id) {
        const { data: ticketData } = await supabase
          .from('tickets')
          .select(`
            id,
            ticket_number,
            title,
            category,
            organization:organizations(name)
          `)
          .eq('id', nextDraft.ticket_id)
          .single()

        setTicket(ticketData || null)
      }
    } catch (err) {
      console.error('KB draft detail load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="admin-loading">Loading KB/SOP draft...</div>
  if (!draft) return <div className="admin-loading">KB/SOP draft not found.</div>

  return (
    <div>
      <div className="admin-breadcrumb">
        <a href="/admin/kb">← Knowledge Drafts</a>
      </div>

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{draft.title || 'Untitled KB/SOP Draft'}</h1>
          <p className="admin-page-desc">
            Internal knowledge draft generated from a support request.
          </p>
        </div>
      </div>

      <div className="admin-grid-2col">
        <div>
          <div className="admin-card" style={{ marginBottom: 20 }}>
            <div className="admin-card-header">
              <h3>Draft Summary</h3>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <div className="admin-card-section-title">Short Summary</div>
                <div className="admin-table-muted" style={{ lineHeight: 1.7 }}>
                  {draft.short_summary || '—'}
                </div>
              </div>

              <div>
                <div className="admin-card-section-title">Problem</div>
                <div className="admin-table-muted" style={{ lineHeight: 1.7 }}>
                  {draft.problem || '—'}
                </div>
              </div>

              <div>
                <div className="admin-card-section-title">Likely Cause</div>
                <div className="admin-table-muted" style={{ lineHeight: 1.7 }}>
                  {draft.likely_cause || '—'}
                </div>
              </div>

              <div>
                <div className="admin-card-section-title">Reusable Fix Guidance</div>
                <div className="admin-table-muted" style={{ lineHeight: 1.7 }}>
                  {draft.reusable_fix_guidance || '—'}
                </div>
              </div>

              <div>
                <div className="admin-card-section-title">Future Prevention Note</div>
                <div className="admin-table-muted" style={{ lineHeight: 1.7 }}>
                  {draft.future_prevention_note || '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Resolution Steps</h3>
            </div>

            {Array.isArray(draft.steps_taken) && draft.steps_taken.length > 0 ? (
              <ol style={{ margin: 0, paddingLeft: 20, color: '#4a4a4a', lineHeight: 1.8 }}>
                {draft.steps_taken.map((step, idx) => (
                  <li key={`${step}-${idx}`}>{step}</li>
                ))}
              </ol>
            ) : (
              <p className="admin-empty-text">No step list stored for this draft.</p>
            )}
          </div>
        </div>

        <div>
          <div className="admin-card" style={{ marginBottom: 20 }}>
            <div className="admin-card-header">
              <h3>Source</h3>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Storage</span>
              <span className="admin-detail-value">
                {draft.source === 'legacy_note' ? 'Legacy internal note' : 'KB draft table'}
              </span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Created</span>
              <span className="admin-detail-value">{formatDateTime(draft.created_at)}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Updated</span>
              <span className="admin-detail-value">{formatDateTime(draft.updated_at || draft.created_at)}</span>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Linked Support Request</h3>
            </div>

            {ticket ? (
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <div className="admin-table-title">{ticket.title}</div>
                  <div className="admin-table-sub">
                    {ticket.ticket_number ? `TDP-${ticket.ticket_number}` : ticket.id.slice(0, 8)}
                  </div>
                </div>

                <div className="admin-table-muted">
                  Client: {ticket.organization?.name || '—'}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a href={`/admin/tickets/${ticket.id}`} className="admin-btn-small">
                    Open Support Request
                  </a>
                </div>
              </div>
            ) : (
              <p className="admin-empty-text">Linked support request not found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}