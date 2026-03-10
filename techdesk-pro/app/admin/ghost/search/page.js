'use client'

import { useState } from 'react'

const TYPE_STYLES = {
  ticket: { bg: '#eef4ff', color: '#1d4ed8', label: 'Ticket' },
  organization: { bg: '#ecfdf3', color: '#067647', label: 'Organization' },
  assessment: { bg: '#fffaeb', color: '#b54708', label: 'Assessment' },
  kb_draft: { bg: '#f3e8ff', color: '#7c3aed', label: 'KB Draft' },
}

const EXAMPLE_QUERIES = [
  'Which tickets are blocked waiting on Microsoft 365 access?',
  'Do we have repeat Google Workspace login issues?',
  'Which leads need review before onboarding?',
  'Have we seen this permissions issue before?',
  'Which resolved tickets should become SOPs?',
]

export default function GhostSearchPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function runSearch(nextQuery) {
    const q = (nextQuery ?? query).trim()
    if (!q) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/ai/ghost-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ghost search failed')

      setResult(data)
      setQuery(q)
    } catch (err) {
      console.error('Ghost search page error:', err)
      setError(err.message || 'Failed to run Ghost search')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="admin-breadcrumb">
        <a href="/admin/ghost">← Ghost Operations</a>
      </div>

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Ghost Search</h1>
          <p className="admin-page-desc">
            Search across support requests, clients, assessments, and knowledge drafts.
          </p>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div className="admin-card-header">
          <h3>Ask Ghost Admin</h3>
        </div>

        <div className="admin-filters" style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask an internal operations question..."
            className="admin-search-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter') runSearch()
            }}
          />
          <button
            type="button"
            className="admin-btn-primary"
            onClick={() => runSearch()}
            disabled={loading || !query.trim()}
          >
            {loading ? 'Searching...' : 'Run Search'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EXAMPLE_QUERIES.map((example) => (
            <button
              key={example}
              type="button"
              className="admin-btn-small"
              onClick={() => runSearch(example)}
            >
              {example}
            </button>
          ))}
        </div>

        {error && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 12px',
              borderRadius: 8,
              background: '#fff5f5',
              border: '1px solid #f8d4d4',
              color: '#b42318',
              fontSize: '0.86rem',
            }}
          >
            {error}
          </div>
        )}
      </div>

      {result && (
        <>
          <div className="admin-card" style={{ marginBottom: 20 }}>
            <div className="admin-card-header">
              <h3>Ghost Answer</h3>
            </div>

            <div className="admin-table-muted" style={{ lineHeight: 1.8, marginBottom: 14 }}>
              {result.answer}
            </div>

            {Array.isArray(result.recommended_actions) && result.recommended_actions.length > 0 && (
              <div>
                <div className="admin-card-section-title">Recommended Actions</div>
                <ul style={{ margin: 0, paddingLeft: 20, color: '#4a4a4a', lineHeight: 1.8 }}>
                  {result.recommended_actions.map((action, idx) => (
                    <li key={`${action}-${idx}`}>{action}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              <span className="admin-status-badge" style={{ background: '#eef4ff', color: '#1d4ed8' }}>
                Tickets: {result.counts?.tickets || 0}
              </span>
              <span className="admin-status-badge" style={{ background: '#ecfdf3', color: '#067647' }}>
                Organizations: {result.counts?.organizations || 0}
              </span>
              <span className="admin-status-badge" style={{ background: '#fffaeb', color: '#b54708' }}>
                Assessments: {result.counts?.assessments || 0}
              </span>
              <span className="admin-status-badge" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                KB Drafts: {result.counts?.kb_drafts || 0}
              </span>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Top Matches</h3>
            </div>

            {!result.matches || result.matches.length === 0 ? (
              <p className="admin-empty-text">No strong matches found.</p>
            ) : (
              <div className="admin-client-list">
                {result.matches.map((match) => {
                  const style = TYPE_STYLES[match.type] || TYPE_STYLES.ticket

                  return (
                    <a
                      key={`${match.type}-${match.id}`}
                      href={match.href}
                      className="admin-action-btn"
                      style={{ alignItems: 'flex-start' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                          <span
                            className="admin-status-badge"
                            style={{ background: style.bg, color: style.color }}
                          >
                            {style.label}
                          </span>
                          <span className="admin-status-badge" style={{ background: '#f0f2f5', color: '#4a4a4a' }}>
                            Score {match.score}
                          </span>
                        </div>

                        <div className="admin-table-title">{match.title}</div>
                        <div className="admin-table-sub">{match.subtitle}</div>

                        {match.reason && (
                          <div className="admin-table-muted" style={{ marginTop: 6, lineHeight: 1.7 }}>
                            {match.reason}
                          </div>
                        )}
                      </div>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}