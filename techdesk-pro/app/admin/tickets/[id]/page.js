'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { CATEGORY_LABELS, STATUS_COLORS, STATUS_LABELS, toLabel } from '../../../../lib/support-ui'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const FOLLOW_UP_DRAFT_TYPES = [
  { key: 'waiting_on_client', label: 'Waiting on Client Draft' },
  { key: 'still_working', label: 'Still Working Update' },
  { key: 'confirm_resolution', label: 'Confirm Resolution Draft' },
  { key: 'stale_nudge', label: 'Stale Ticket Nudge' },
]

const boolLabel = (value) => {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  return '—'
}

const formatTime = (date) =>
  new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

const extractKBDraftFromNote = (body) => {
  if (!body || !body.includes('KB/SOP Draft JSON:')) return null

  try {
    const jsonStart = body.indexOf('{')
    if (jsonStart === -1) return null
    return JSON.parse(body.slice(jsonStart))
  } catch {
    return null
  }
}

export default function AdminTicketDetail() {
  const { id } = useParams()

  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  const [reply, setReply] = useState('')
  const [internalNote, setInternalNote] = useState('')

  const [status, setStatus] = useState('open')
  const [priority, setPriority] = useState('medium')

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [updating, setUpdating] = useState(false)

  const [triageLoading, setTriageLoading] = useState(false)
  const [ghostLoading, setGhostLoading] = useState(false)
  const [autoResolveLoading, setAutoResolveLoading] = useState(false)
  const [kbDraftLoading, setKbDraftLoading] = useState(false)
  const [followUpLoading, setFollowUpLoading] = useState(false)
  const [lastFollowUpType, setLastFollowUpType] = useState('')
  const [suggestedFollowUpStatus, setSuggestedFollowUpStatus] = useState('')

  const [showCoach, setShowCoach] = useState(false)
  const [kbDraft, setKbDraft] = useState(null)
  const [ghostData, setGhostData] = useState(null)

  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadAll()
  }, [id])

  useEffect(() => {
    if (!id) return

    const channel = supabase
      .channel(`admin-ticket-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${id}`,
        },
        () => {
          loadMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadCurrentUser(), loadTicket(), loadMessages()])
    setLoading(false)
  }

  async function loadCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) setCurrentUser(user)
  }

  async function loadTicket() {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          organization:organizations(name),
          creator:profiles!tickets_created_by_fkey(full_name, email)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      setTicket(data)
      setStatus(data.status || 'open')
      setPriority(data.priority || 'medium')
    } catch (err) {
      console.error('Error loading ticket:', err)
    }
  }

  async function loadMessages() {
    try {
      const { data } = await supabase
        .from('ticket_messages')
        .select('*, sender:profiles!ticket_messages_sender_id_fkey(full_name, role)')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })

      const nextMessages = data || []
      setMessages(nextMessages)

      const latestDraftNote = [...nextMessages]
        .reverse()
        .find((msg) => msg.is_internal_note && msg.body?.includes('KB/SOP Draft JSON:'))

      if (latestDraftNote) {
        const parsed = extractKBDraftFromNote(latestDraftNote.body)
        if (parsed) setKbDraft(parsed)
      }
    } catch (err) {
      console.error('Error loading messages:', err)
    }
  }

  async function handleRunTriage() {
    setTriageLoading(true)
    try {
      const response = await fetch('/api/ai/triage-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: id }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'AI triage failed')

      await loadTicket()
    } catch (err) {
      console.error('AI triage error:', err)
      alert(err.message || 'AI triage failed')
    } finally {
      setTriageLoading(false)
    }
  }

  async function handleGhostAdmin() {
    setGhostLoading(true)
    setGhostData(null)

    try {
      const response = await fetch('/api/ai/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: id }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ghost Admin failed')

      if (data?.suggested_reply) {
        setGhostData(data)
        setReply(data.suggested_reply)
        setShowCoach(true)
      }
    } catch (err) {
      console.error('Ghost Admin error:', err)
      alert(err.message || 'Ghost Admin failed')
    } finally {
      setGhostLoading(false)
    }
  }

  async function handleAutoResolve() {
    setAutoResolveLoading(true)
    try {
      const response = await fetch('/api/ai/auto-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: id }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'AutoResolve failed')

      await Promise.all([loadTicket(), loadMessages()])

      if (!data.resolved && data.message) alert(data.message)
    } catch (err) {
      console.error('AutoResolve error:', err)
      alert(err.message || 'AutoResolve failed')
    } finally {
      setAutoResolveLoading(false)
    }
  }

  async function handleReply(e) {
    e.preventDefault()
    if (!reply.trim() || !currentUser) return

    setSending(true)
    try {
      const { error } = await supabase.from('ticket_messages').insert({
        ticket_id: id,
        sender_id: currentUser.id,
        sender_type: 'agent',
        body: reply.trim(),
      })

      if (error) throw error

      setReply('')
      setShowCoach(false)
      setGhostData(null)

      if (status === 'open') {
        await handleStatusChange('in_progress', false)
      }

      await loadMessages()
    } catch (err) {
      console.error('Send reply error:', err)
      alert('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  async function handleSaveInternalNote(e) {
    e.preventDefault()
    if (!internalNote.trim() || !currentUser) return

    setSavingNote(true)
    try {
      const { error } = await supabase.from('ticket_messages').insert({
        ticket_id: id,
        sender_id: currentUser.id,
        sender_type: 'agent',
        body: internalNote.trim(),
        is_internal_note: true,
      })

      if (error) throw error

      setInternalNote('')
      await loadMessages()
    } catch (err) {
      console.error('Internal note error:', err)
      alert('Failed to save internal note')
    } finally {
      setSavingNote(false)
    }
  }

  async function handleStatusChange(newStatus, showAlert = true) {
    setUpdating(true)
    try {
      const { error } = await supabase.from('tickets').update({ status: newStatus }).eq('id', id)
      if (error) throw error

      setStatus(newStatus)
      setTicket((prev) => ({ ...prev, status: newStatus }))
    } catch (err) {
      console.error('Status update error:', err)
      if (showAlert) alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  async function handlePriorityChange(newPriority) {
    setUpdating(true)
    try {
      const { error } = await supabase.from('tickets').update({ priority: newPriority }).eq('id', id)
      if (error) throw error

      setPriority(newPriority)
      setTicket((prev) => ({ ...prev, priority: newPriority }))
    } catch (err) {
      console.error('Priority update error:', err)
      alert('Failed to update priority')
    } finally {
      setUpdating(false)
    }
  }

  async function handleAssignToMe() {
    if (!currentUser) return

    setUpdating(true)
    try {
      const { error } = await supabase.from('tickets').update({ assigned_to: currentUser.id }).eq('id', id)
      if (error) throw error

      setTicket((prev) => ({ ...prev, assigned_to: currentUser.id }))
    } catch (err) {
      console.error('Assign error:', err)
      alert('Failed to assign ticket')
    } finally {
      setUpdating(false)
    }
  }

  async function handleGenerateKBDraft() {
    setKbDraftLoading(true)
    try {
      const response = await fetch('/api/ai/generate-kb-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: id }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'KB/SOP draft generation failed')

      setKbDraft(data.draft || null)
      await loadMessages()
    } catch (err) {
      console.error('KB draft error:', err)
      alert(err.message || 'Failed to generate KB/SOP draft')
    } finally {
      setKbDraftLoading(false)
    }
  }


  async function handleGenerateFollowUpDraft(draftType) {
    setFollowUpLoading(true)
    setLastFollowUpType(draftType)

    try {
      const response = await fetch('/api/ai/generate-followup-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: id, draftType }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to generate follow-up draft')

      if (data.draft) {
        setReply(data.draft)
      }

      if (data.suggested_status && STATUS_LABELS[data.suggested_status]) {
        setSuggestedFollowUpStatus(data.suggested_status)
      } else {
        setSuggestedFollowUpStatus('')
      }
    } catch (err) {
      console.error('Follow-up draft generation error:', err)
      alert(err.message || 'Failed to generate follow-up draft')
    } finally {
      setFollowUpLoading(false)
      setLastFollowUpType('')
    }
  }

  const clientMessages = useMemo(() => messages.filter((m) => !m.is_internal_note), [messages])
  const internalNotes = useMemo(() => messages.filter((m) => m.is_internal_note), [messages])

  if (loading) return <div className="admin-loading">Loading support request...</div>
  if (!ticket) return <div className="admin-loading">Support request not found</div>

  const aiConfidence = typeof ticket.ai_confidence === 'number' ? `${Math.round(ticket.ai_confidence * 100)}%` : '—'

  return (
    <div>
      <div className="admin-breadcrumb">
        <a href="/admin/tickets">← Support Requests</a>
      </div>

      <div className="admin-ticket-layout">
        <div className="admin-ticket-main">
          <div className="admin-card">
            <div className="admin-ticket-header" style={{ marginBottom: 14 }}>
              <h1 className="admin-ticket-title">{ticket.title}</h1>

              <div className="admin-ticket-meta-row">
                <span
                  className="admin-status-badge"
                  style={{
                    background: `${STATUS_COLORS[status] || '#6b7280'}18`,
                    color: STATUS_COLORS[status] || '#6b7280',
                  }}
                >
                  {toLabel(status, STATUS_LABELS)}
                </span>
                <span className="admin-table-muted">{ticket.ticket_number ? `TDP-${ticket.ticket_number}` : `#${ticket.id.slice(0, 8)}`}</span>
                <span className="admin-table-muted">·</span>
                <span className="admin-table-muted">{ticket.organization?.name || 'Unknown organization'}</span>
                <span className="admin-table-muted">·</span>
                <span className="admin-table-muted">Opened {formatTime(ticket.created_at)}</span>
              </div>

              {ticket.description && <p className="admin-ticket-desc">{ticket.description}</p>}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: '1px solid #f0ede8',
              }}
            >
              <button onClick={handleRunTriage} disabled={triageLoading} className="admin-btn-primary">
                {triageLoading ? 'Running AI Triage...' : 'Run AI Triage'}
              </button>

              <button onClick={handleGhostAdmin} disabled={ghostLoading} className="admin-btn-small" style={{ padding: '10px 18px' }}>
                {ghostLoading ? 'Preparing...' : 'Ghost Admin + Coach'}
              </button>

              <button onClick={handleAutoResolve} disabled={autoResolveLoading} className="admin-btn-success">
                {autoResolveLoading ? 'Attempting...' : 'Attempt AutoResolve'}
              </button>

              <button
                onClick={handleGenerateKBDraft}
                disabled={kbDraftLoading || (status !== 'resolved' && status !== 'closed')}
                className="admin-btn-small"
              >
                {kbDraftLoading ? 'Drafting KB/SOP...' : 'Generate KB/SOP Draft'}
              </button>

              {status !== 'resolved' && status !== 'closed' && (
                <button type="button" className="admin-btn-small" onClick={() => handleStatusChange('resolved')} disabled={updating}>
                  Resolve Request
                </button>
              )}
            </div>

            <div
              style={{
                marginBottom: 16,
                padding: '12px 14px',
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #e7edf4',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>AI Triage Snapshot</h3>
                <span className="admin-table-muted">Confidence {aiConfidence}</span>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <span className="ticket-platform">Category: {toLabel(ticket.ai_category, CATEGORY_LABELS)}</span>
                <span className="ticket-platform">Priority: {toLabel(ticket.ai_priority_recommendation)}</span>
                <span className="ticket-platform">Difficulty: {toLabel(ticket.ai_difficulty)}</span>
                <span className="ticket-platform">Est. time: {ticket.ai_estimated_time || '—'}</span>
                <span className="ticket-platform">Access needed: {boolLabel(ticket.ai_access_needed)}</span>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ticket.ai_can_auto_resolve === true && (
                  <span className="admin-status-badge" style={{ background: '#10b9811c', color: '#10b981' }}>
                    Auto-resolve eligible
                  </span>
                )}
                {ticket.ai_project_flag === true && (
                  <span className="admin-status-badge" style={{ background: '#f59e0b1f', color: '#b45309' }}>
                    Project / Scoped
                  </span>
                )}
                {ticket.ai_escalation_needed === true && (
                  <span className="admin-status-badge" style={{ background: '#ef44441f', color: '#b91c1c' }}>
                    Escalation needed
                  </span>
                )}
              </div>

              {ticket.ai_summary && (
                <div style={{ marginTop: 10, fontSize: '0.86rem', color: '#1f2937' }}>
                  <strong>AI summary:</strong> {ticket.ai_summary}
                </div>
              )}
            </div>

            {showCoach && ghostData?.coach && (
              <div className="admin-card" style={{ marginBottom: 16, border: '1px solid #e7dcfa', background: '#fcfaff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>Ghost Coach Guidance</h3>
                  <button type="button" className="admin-btn-small" onClick={() => setShowCoach(false)}>
                    Hide
                  </button>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  <div>
                    <div className="admin-table-title" style={{ fontSize: '0.82rem' }}>Recommended tone</div>
                    <div className="admin-table-muted">{ghostData.coach.tone || 'Professional and clear'}</div>
                  </div>

                  <div>
                    <div className="admin-table-title" style={{ fontSize: '0.82rem' }}>Actionable next steps</div>
                    <ul style={{ margin: '6px 0 0 18px', padding: 0, color: 'var(--ink-muted)', fontSize: '0.86rem' }}>
                      {(ghostData.coach.next_steps || []).length > 0 ? (
                        ghostData.coach.next_steps.map((step, idx) => <li key={`${step}-${idx}`}>{step}</li>)
                      ) : (
                        <li>Confirm root cause and share a concrete resolution plan.</li>
                      )}
                    </ul>
                  </div>

                  {ghostData.coach.internal_note && (
                    <div>
                      <div className="admin-table-title" style={{ fontSize: '0.82rem' }}>Internal note suggestion</div>
                      <div className="admin-table-muted">{ghostData.coach.internal_note}</div>
                    </div>
                  )}

                  {ghostData.coach.escalation_reason && (
                    <div style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #f8d4d4', background: '#fff5f5', color: '#b42318', fontSize: '0.86rem' }}>
                      <strong>Escalation reason:</strong> {ghostData.coach.escalation_reason}
                    </div>
                  )}
                </div>
              </div>
            )}

            {kbDraft && (
              <div className="admin-card" style={{ marginBottom: 16, border: '1px solid #d6e9ff', background: '#f7fbff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>KB/SOP Draft (MVP)</h3>
                  <span className="admin-table-muted">Saved as internal note</span>
                </div>

                <div style={{ display: 'grid', gap: 8, fontSize: '0.86rem' }}>
                  <div><strong>Title:</strong> {kbDraft.title || '—'}</div>
                  <div><strong>Short summary:</strong> {kbDraft.short_summary || '—'}</div>
                  <div><strong>Problem:</strong> {kbDraft.problem || '—'}</div>
                  <div><strong>Likely cause:</strong> {kbDraft.likely_cause || '—'}</div>
                  <div><strong>Steps taken:</strong> {Array.isArray(kbDraft.steps_taken) ? kbDraft.steps_taken.join(' • ') : (kbDraft.steps_taken || '—')}</div>
                  <div><strong>Reusable fix guidance:</strong> {kbDraft.reusable_fix_guidance || '—'}</div>
                  <div><strong>Future prevention note:</strong> {kbDraft.future_prevention_note || '—'}</div>
                </div>
              </div>
            )}


            <div className="dashboard-section-header" style={{ marginBottom: 10 }}>
              <h2>Client conversation</h2>
            </div>

            <div className="admin-messages">
              {clientMessages.length === 0 ? (
                <div className="admin-empty-text">No client-facing messages yet.</div>
              ) : (
                clientMessages.map((msg) => (
                  <div key={msg.id} className={`admin-message ${msg.sender_type}`}>
                    <div className="admin-message-header">
                      <span className="admin-message-sender">
                        {msg.sender?.full_name ||
                          (msg.sender_type === 'ai' ? 'AutoResolve AI' : msg.sender_type === 'system' ? 'System' : 'Unknown')}
                      </span>
                      <span className={`admin-message-badge ${msg.sender_type}`}>{msg.sender_type}</span>
                      {msg.ai_generated && <span className="admin-message-badge ai">AI Generated</span>}
                      <span className="admin-message-time">{formatTime(msg.created_at)}</span>
                    </div>
                    <div className="admin-message-body">{msg.body}</div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {status !== 'closed' && (
              <div className="admin-reply-box" style={{ marginTop: 16 }}>
                <form onSubmit={handleReply}>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Send a clear update to the client. Tip: use follow-up drafts or Ghost Admin + Coach."
                    rows={4}
                    className="admin-reply-input"
                  />

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {FOLLOW_UP_DRAFT_TYPES.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className="admin-btn-small"
                        onClick={() => handleGenerateFollowUpDraft(item.key)}
                        disabled={followUpLoading}
                      >
                        {followUpLoading && lastFollowUpType === item.key ? 'Drafting...' : item.label}
                      </button>
                    ))}
                  </div>

                  {suggestedFollowUpStatus && (
                    <div style={{ marginBottom: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="admin-table-muted">Suggested status after this update:</span>
                      <span
                        className="admin-status-badge"
                        style={{
                          background: `${STATUS_COLORS[suggestedFollowUpStatus] || '#8a8a8a'}18`,
                          color: STATUS_COLORS[suggestedFollowUpStatus] || '#8a8a8a',
                        }}
                      >
                        {toLabel(suggestedFollowUpStatus, STATUS_LABELS)}
                      </span>
                      {status !== suggestedFollowUpStatus && (
                        <button
                          type="button"
                          className="admin-btn-small"
                          onClick={() => handleStatusChange(suggestedFollowUpStatus)}
                          disabled={updating}
                        >
                          Apply Suggested Status
                        </button>
                      )}
                    </div>
                  )}

                  <div className="admin-reply-actions">
                    <button type="submit" className="admin-btn-primary" disabled={sending || !reply.trim()}>
                      {sending ? 'Sending...' : 'Send Reply'}
                    </button>

                    {status !== 'resolved' && (
                      <button type="button" className="admin-btn-success" onClick={() => handleStatusChange('resolved')} disabled={updating}>
                        Resolve Request
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className="admin-card" style={{ marginTop: 16 }}>
            <div className="dashboard-section-header" style={{ marginBottom: 10 }}>
              <h2>Internal notes</h2>
            </div>

            <form onSubmit={handleSaveInternalNote} style={{ marginBottom: 14 }}>
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Capture internal context, handoff notes, blockers, or risks."
                rows={3}
                className="admin-reply-input"
              />
              <div className="admin-reply-actions">
                <button type="submit" className="admin-btn-small" disabled={savingNote || !internalNote.trim()}>
                  {savingNote ? 'Saving...' : 'Add Internal Note'}
                </button>
              </div>
            </form>

            <div className="admin-messages" style={{ maxHeight: 280 }}>
              {internalNotes.length === 0 ? (
                <div className="admin-empty-text">No internal notes yet.</div>
              ) : (
                internalNotes.map((msg) => (
                  <div key={msg.id} className="admin-message agent" style={{ background: '#fbfbfd' }}>
                    <div className="admin-message-header">
                      <span className="admin-message-sender">{msg.sender?.full_name || 'Team Member'}</span>
                      <span className="admin-message-badge system">internal</span>
                      <span className="admin-message-time">{formatTime(msg.created_at)}</span>
                    </div>
                    <div className="admin-message-body">{msg.body}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="admin-ticket-sidebar">
          <div className="admin-card">
            <h4 className="admin-card-section-title">Request controls</h4>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Status</span>
              <select value={status} onChange={(e) => handleStatusChange(e.target.value)} className="admin-detail-select" disabled={updating}>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_on_client">Waiting on Client</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Priority</span>
              <select value={priority} onChange={(e) => handlePriorityChange(e.target.value)} className="admin-detail-select" disabled={updating}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Assigned</span>
              <div>
                {ticket.assigned_to === currentUser?.id ? (
                  <span className="admin-detail-value" style={{ color: 'var(--teal)' }}>You</span>
                ) : ticket.assigned_to ? (
                  <span className="admin-detail-value">Agent assigned</span>
                ) : (
                  <button className="admin-btn-small" onClick={handleAssignToMe} disabled={updating}>Assign to me</button>
                )}
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: 16 }}>
            <h4 className="admin-card-section-title">Ticket details</h4>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Category</span>
              <span className="admin-detail-value">{toLabel(ticket.category, CATEGORY_LABELS)}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Platform</span>
              <span className="admin-detail-value">{ticket.platform || '—'}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Created by</span>
              <span className="admin-detail-value">{ticket.creator?.full_name || 'Unknown'}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Email</span>
              <span className="admin-detail-value">{ticket.creator?.email || '—'}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Opened</span>
              <span className="admin-detail-value">{formatTime(ticket.created_at)}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Last updated</span>
              <span className="admin-detail-value">{formatTime(ticket.updated_at || ticket.created_at)}</span>
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: 16 }}>
            <h4 className="admin-card-section-title">AI triage details</h4>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Category</span>
              <span className="admin-detail-value">{toLabel(ticket.ai_category, CATEGORY_LABELS)}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-label">Priority recommendation</span>
              <span className="admin-detail-value">{toLabel(ticket.ai_priority_recommendation)}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-label">Difficulty</span>
              <span className="admin-detail-value">{toLabel(ticket.ai_difficulty)}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-label">Estimated time</span>
              <span className="admin-detail-value">{ticket.ai_estimated_time || '—'}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-label">Access needed</span>
              <span className="admin-detail-value">{boolLabel(ticket.ai_access_needed)}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-label">Auto-resolve eligible</span>
              <span className="admin-detail-value">{boolLabel(ticket.ai_can_auto_resolve)}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-label">Project / Scoped</span>
              <span className="admin-detail-value">{boolLabel(ticket.ai_project_flag)}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-label">Escalation needed</span>
              <span className="admin-detail-value">{boolLabel(ticket.ai_escalation_needed)}</span>
            </div>
            <div className="admin-detail-row">
              <span className="admin-detail-label">Confidence</span>
              <span className="admin-detail-value">{aiConfidence}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
