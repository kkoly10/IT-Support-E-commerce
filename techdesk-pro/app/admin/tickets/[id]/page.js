'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AdminTicketDetail() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [updating, setUpdating] = useState(false)
  const messagesEndRef = useRef(null)

  const [ghostLoading, setGhostLoading] = useState(false)
  const [ghostData, setGhostData] = useState(null)
  const [showCoach, setShowCoach] = useState(false)

  const [triageLoading, setTriageLoading] = useState(false)

  useEffect(() => {
    loadTicket()
    loadCurrentUser()
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
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
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

  async function loadCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) setCurrentUser(user)
  }

  async function loadTicket() {
    try {
      const { data: ticketData, error: ticketErr } = await supabase
        .from('tickets')
        .select('*, organization:organizations(name), creator:profiles!tickets_created_by_fkey(full_name, email)')
        .eq('id', id)
        .single()

      if (ticketErr) throw ticketErr

      setTicket(ticketData)
      setStatus(ticketData.status)
      setPriority(ticketData.priority)

      const { data: msgs } = await supabase
        .from('ticket_messages')
        .select('*, sender:profiles!ticket_messages_sender_id_fkey(full_name, role)')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })

      setMessages(msgs || [])
    } catch (err) {
      console.error('Error loading ticket:', err)
    } finally {
      setLoading(false)
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

      if (!response.ok) {
        throw new Error(data.error || 'Triage failed')
      }

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

      if (data.suggested_reply) {
        setGhostData(data)
        setReply(data.suggested_reply)
        setShowCoach(true)
      }
    } catch (err) {
      console.error('Ghost Admin error:', err)
    } finally {
      setGhostLoading(false)
    }
  }

  async function handleAutoResolve() {
    try {
      const response = await fetch('/api/ai/auto-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'AutoResolve failed')
      }

      await loadTicket()

      if (!data.resolved && data.message) {
        alert(data.message)
      }
    } catch (err) {
      console.error('AutoResolve error:', err)
      alert(err.message || 'AutoResolve failed')
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
        body: reply.trim(),
        sender_type: 'agent',
      })

      if (error) throw error

      setReply('')
      setGhostData(null)
      setShowCoach(false)

      if (status === 'open') {
        await supabase.from('tickets').update({ status: 'in_progress' }).eq('id', id)
        setStatus('in_progress')
        setTicket((prev) => ({ ...prev, status: 'in_progress' }))
      }
    } catch (err) {
      console.error('Send error:', err)
      alert('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  async function handleStatusChange(newStatus) {
    setUpdating(true)
    try {
      const { error } = await supabase.from('tickets').update({ status: newStatus }).eq('id', id)
      if (error) throw error
      setStatus(newStatus)
      setTicket((prev) => ({ ...prev, status: newStatus }))
    } catch (err) {
      alert('Failed to update status')
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
      alert('Failed to assign ticket')
    } finally {
      setUpdating(false)
    }
  }

  const statusColor = (s) => {
    const colors = {
      open: '#e74c3c',
      in_progress: '#f39c12',
      waiting_on_client: '#9b59b6',
      resolved: '#27ae60',
      closed: '#95a5a6',
    }
    return colors[s] || '#8a8a8a'
  }

  const difficultyColor = (d) => {
    const colors = { easy: '#27ae60', medium: '#f39c12', advanced: '#e74c3c' }
    return colors[d] || '#8a8a8a'
  }

  const boolLabel = (value) => {
    if (value === true) return 'Yes'
    if (value === false) return 'No'
    return '—'
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (loading) return <div className="admin-loading">Loading ticket...</div>
  if (!ticket) return <div className="admin-loading">Ticket not found</div>

  return (
    <div>
      <div className="admin-breadcrumb">
        <a href="/admin/tickets">← All Tickets</a>
      </div>

      <div className="admin-ticket-layout">
        <div className="admin-ticket-main">
          <div className="admin-card">
            <div className="admin-ticket-header">
              <h1 className="admin-ticket-title">{ticket.title}</h1>

              <div className="admin-ticket-meta-row">
                <span
                  className="admin-status-badge"
                  style={{ background: statusColor(status) + '18', color: statusColor(status) }}
                >
                  {status.replace(/_/g, ' ')}
                </span>
                <span className="admin-table-muted">by {ticket.creator?.full_name || 'Unknown'}</span>
                <span className="admin-table-muted">·</span>
                <span className="admin-table-muted">{formatTime(ticket.created_at)}</span>
              </div>

              {ticket.description && <p className="admin-ticket-desc">{ticket.description}</p>}

              {ticket.ai_summary && (
                <div
                  style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#f0f7ff',
                    border: '1px solid #cce0ff',
                    fontSize: '0.85rem',
                    color: '#1a5276',
                  }}
                >
                  🧠 <strong>AI Summary:</strong> {ticket.ai_summary}
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: '1px solid #f0ede8',
              }}
            >
              <button
                onClick={handleRunTriage}
                disabled={triageLoading}
                className="admin-btn-primary"
              >
                {triageLoading ? 'Running Triage...' : 'Run AI Triage'}
              </button>

              <button
                onClick={handleGhostAdmin}
                disabled={ghostLoading}
                className="admin-btn-small"
                style={{ padding: '10px 20px', fontSize: '0.85rem' }}
              >
                {ghostLoading ? 'Thinking...' : 'Ghost Admin + Coach'}
              </button>

              <button
                onClick={handleAutoResolve}
                className="admin-btn-success"
              >
                Attempt AutoResolve
              </button>
            </div>

            <div className="admin-messages">
              {messages.filter((m) => !m.is_internal_note).map((msg, i) => (
                <div key={msg.id || i} className={`admin-message ${msg.sender_type}`}>
                  <div className="admin-message-header">
                    <span className="admin-message-sender">
                      {msg.sender?.full_name ||
                        (msg.sender_type === 'ai'
                          ? 'AutoResolve AI'
                          : msg.sender_type === 'system'
                            ? 'System'
                            : 'Unknown')}
                    </span>
                    <span className={`admin-message-badge ${msg.sender_type}`}>{msg.sender_type}</span>
                    {msg.ai_generated && <span className="admin-message-badge ai">AI Generated</span>}
                    <span className="admin-message-time">{formatTime(msg.created_at)}</span>
                  </div>
                  <div className="admin-message-body">{msg.body}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {status !== 'closed' && (
              <div className="admin-reply-box">
                <form onSubmit={handleReply}>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply... or use Ghost Admin first"
                    rows={4}
                    className="admin-reply-input"
                  />
                  <div className="admin-reply-actions">
                    <button type="submit" className="admin-btn-primary" disabled={sending || !reply.trim()}>
                      {sending ? 'Sending...' : 'Send Reply'}
                    </button>

                    {status !== 'resolved' && (
                      <button
                        type="button"
                        className="admin-btn-success"
                        onClick={() => handleStatusChange('resolved')}
                        disabled={updating}
                      >
                        Resolve Ticket
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>

          {showCoach && ghostData?.coach && (
            <div className="admin-card" style={{ marginTop: 16, border: '1px solid #e0d4f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.2rem' }}>🧠</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>AI Coach</h3>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 100,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: difficultyColor(ghostData.coach.difficulty) + '18',
                      color: difficultyColor(ghostData.coach.difficulty),
                      textTransform: 'uppercase',
                    }}
                  >
                    {ghostData.coach.difficulty}
                  </span>

                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 100,
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: '#f0f2f5',
                      color: '#4a4a4a',
                    }}
                  >
                    ⏱️ {ghostData.coach.estimated_time}
                  </span>
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: '#fafaf8',
                  marginBottom: 16,
                  fontSize: '0.9rem',
                  color: 'var(--ink)',
                }}
              >
                <strong>What’s happening:</strong> {ghostData.coach.summary}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
                  Step-by-step resolution:
                </div>

                {ghostData.coach.steps.map((step, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '8px 0',
                      borderBottom: i < ghostData.coach.steps.length - 1 ? '1px solid #f0ede8' : 'none',
                    }}
                  >
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        flexShrink: 0,
                        background: 'var(--teal-light)',
                        color: 'var(--teal)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '0.88rem', color: 'var(--ink-light)', lineHeight: 1.5 }}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>

              {ghostData.coach.what_to_tell_client && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#e8f5f0',
                    border: '1px solid #c8e6d8',
                    marginBottom: 12,
                    fontSize: '0.85rem',
                  }}
                >
                  💬 <strong>Tell the client:</strong> "{ghostData.coach.what_to_tell_client}"
                </div>
              )}

              {ghostData.coach.learn_more && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#f0f7ff',
                    border: '1px solid #cce0ff',
                    fontSize: '0.85rem',
                    color: '#1a5276',
                  }}
                >
                  📚 <strong>Learn:</strong> {ghostData.coach.learn_more}
                </div>
              )}

              {ghostData.coach.escalation_needed && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#fff5f5',
                    border: '1px solid #ffcccc',
                    marginTop: 12,
                    fontSize: '0.85rem',
                    color: '#c0392b',
                  }}
                >
                  ⚠️ <strong>Escalation needed:</strong> {ghostData.coach.escalation_reason}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="admin-ticket-sidebar">
          <div className="admin-card">
            <h4 className="admin-card-section-title">Details</h4>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Status</span>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="admin-detail-select"
                disabled={updating}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_on_client">Waiting on Client</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Priority</span>
              <select
                value={priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="admin-detail-select"
                disabled={updating}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Category</span>
              <span className="admin-detail-value">{ticket.category || '—'}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Platform</span>
              <span className="admin-detail-value">{ticket.platform || '—'}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Assigned</span>
              <div>
                {ticket.assigned_to === currentUser?.id ? (
                  <span className="admin-detail-value" style={{ color: 'var(--teal)' }}>
                    You
                  </span>
                ) : ticket.assigned_to ? (
                  <span className="admin-detail-value">Agent assigned</span>
                ) : (
                  <button className="admin-btn-small" onClick={handleAssignToMe} disabled={updating}>
                    Assign to me
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: 16 }}>
            <h4 className="admin-card-section-title">AI Triage</h4>

            <div className="admin-detail-row">
              <span className="admin-detail-label">AI Category</span>
              <span className="admin-detail-value">{ticket.ai_category || '—'}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">AI Priority</span>
              <span className="admin-detail-value">{ticket.ai_priority_recommendation || '—'}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Difficulty</span>
              <span className="admin-detail-value">{ticket.ai_difficulty || '—'}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Est. Time</span>
              <span className="admin-detail-value">{ticket.ai_estimated_time || '—'}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Access Needed</span>
              <span className="admin-detail-value">{boolLabel(ticket.ai_access_needed)}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Auto Resolve</span>
              <span className="admin-detail-value">{boolLabel(ticket.ai_can_auto_resolve)}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Project Flag</span>
              <span className="admin-detail-value">{boolLabel(ticket.ai_project_flag)}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Escalation</span>
              <span className="admin-detail-value">{boolLabel(ticket.ai_escalation_needed)}</span>
            </div>

            <div className="admin-detail-row">
              <span className="admin-detail-label">Confidence</span>
              <span className="admin-detail-value">
                {typeof ticket.ai_confidence === 'number'
                  ? `${Math.round(ticket.ai_confidence * 100)}%`
                  : '—'}
              </span>
            </div>
          </div>

          <div className="admin-card" style={{ marginTop: 16 }}>
            <h4 className="admin-card-section-title">Client</h4>
            <div className="admin-client-row" style={{ padding: 0, border: 'none' }}>
              <div className="admin-client-avatar">{ticket.organization?.name?.charAt(0) || '?'}</div>
              <div>
                <div className="admin-client-name">{ticket.organization?.name || 'Unknown'}</div>
                <div className="admin-client-meta">{ticket.creator?.email}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}