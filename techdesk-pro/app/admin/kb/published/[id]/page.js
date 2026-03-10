'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

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

export default function PublishedKnowledgeArticlePage() {
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [article, setArticle] = useState(null)
  const [ticket, setTicket] = useState(null)

  useEffect(() => {
    loadArticle()
  }, [id])

  async function loadArticle() {
    setLoading(true)

    try {
      const { data } = await supabase
        .from('kb_articles')
        .select('*')
        .eq('id', id)
        .single()

      setArticle(data || null)

      if (data?.source_ticket_id) {
        const { data: ticketData } = await supabase
          .from('tickets')
          .select(`
            id,
            ticket_number,
            title,
            organization:organizations(name)
          `)
          .eq('id', data.source_ticket_id)
          .single()

        setTicket(ticketData || null)
      }
    } catch (err) {
      console.error('Published article load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="admin-loading">Loading knowledge article...</div>
  if (!article) return <div className="admin-loading">Knowledge article not found.</div>

  return (
    <div>
      <div className="admin-breadcrumb">
        <a href="/admin/kb">← Knowledge Drafts</a>
      </div>

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{article.title}</h1>
          <p className="admin-page-desc">Published internal knowledge article.</p>
        </div>
      </div>

      <div className="admin-grid-2col">
        <div>
          <div className="admin-card" style={{ marginBottom: 20 }}>
            <div className="admin-card-header">
              <h3>Article Content</h3>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <div className="admin-card-section-title">Summary</div>
                <div className="admin-table-muted" style={{ lineHeight: 1.7 }}>
                  {article.summary || '—'}
                </div>
              </div>

              <div>
                <div className="admin-card-section-title">Problem</div>
                <div className="admin-table-muted" style={{ lineHeight: 1.7 }}>
                  {article.problem || '—'}
                </div>
              </div>

              <div>
                <div className="admin-card-section-title">Likely Cause</div>
                <div className="admin-table-muted" style={{ lineHeight: 1.7 }}>
                  {article.likely_cause || '—'}
                </div>
              </div>

              <div>
                <div className="admin-card-section-title">Reusable Fix Guidance</div>
                <div className="admin-table-muted" style={{ lineHeight: 1.7 }}>
                  {article.reusable_fix_guidance || '—'}
                </div>
              </div>

              <div>
                <div className="admin-card-section-title">Future Prevention Note</div>
                <div className="admin-table-muted" style={{ lineHeight: 1.7 }}>
                  {article.future_prevention_note || '—'}
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Steps</h3>
            </div>

            {Array.isArray(article.steps_taken) && article.steps_taken.length > 0 ? (
              <ol style={{ margin: 0, paddingLeft: 20, color: '#4a4a4a', lineHeight: 1.8 }}>
                {article.steps_taken.map((step, idx) => (
                  <li key={`${step}-${idx}`}>{step}</li>
                ))}
              </ol>
            ) : (
              <p className="admin-empty-text">No steps stored for this article.</p>
            )}
          </div>
        </div>

        <div>
          <div className="admin-card" style={{ marginBottom: 20 }}>
            <div className="admin-card-header">
              <h3>Article Metadata</h3>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Status</span>
              <span className="admin-detail-value">{article.status || 'published'}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Slug</span>
              <span className="admin-detail-value">{article.slug}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Published</span>
              <span className="admin-detail-value">{formatDateTime(article.published_at || article.created_at)}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Updated</span>
              <span className="admin-detail-value">{formatDateTime(article.updated_at || article.created_at)}</span>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Source Ticket</h3>
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

                <a href={`/admin/tickets/${ticket.id}`} className="admin-btn-small">
                  Open Support Request
                </a>
              </div>
            ) : (
              <p className="admin-empty-text">No linked source ticket found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}