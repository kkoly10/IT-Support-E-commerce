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

  useEffect(() => {
    loadTicket()
    loadCurrentUser()
  }, [id])

  useEffect(() => {
    if (!id) return
    const channel = supabase
      .channel(`admin-ticket-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_messages',
        filter: `ticket_id=eq.${id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
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

  async function handleReply(e) {
    e.preventDefault()
    if (!reply.trim() || !currentUser) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: id,
          sender_id: currentUser.id,
          message: reply.trim(),
          message_type: 'agent',
        })

      if (error) throw error
      setReply('')

      // Auto-set to in_progress if was open
      if (status === 'open') {
        await supabase.from('tickets').update({ status: 'in_progress' }).eq('id', id)
        setStatus('in_progress')
        setTicket(prev => ({ ...prev, status: 'in_progress' }))
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
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      setStatus(newStatus)
      setTicket(prev => ({ ...prev, status: newStatus }))
    } catch (err) {
      alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  async function handlePriorityChange(newPriority) {
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ priority: newPriority })
        .eq('id', id)

      if (error) throw error
      setPriority(newPriority)
      setTicket(prev => ({ ...prev, priority: newPriority }))
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
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_to: currentUser.id })
        .eq('id', id)

      if (error) throw error
      setTicket(prev => ({ ...prev, assigned_to: currentUser.id }))
    } catch (err) {
      alert('Failed to assign ticket')
    } finally {
      setUpdating(false)
    }
  }

  const statusColor = (s) => {
    const colors = { open: '#e74c3c', in_progress: '#f39c12', waiting_on_client: '#9b59b6', resolved: '#27ae60', closed: '#95a5a6' }
    return colors[s] || '#8a8a8a'
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    })
  }

  if (loading) {
    return <div className="admin-loading">Loading ticket...</div>
  }

  if (!ticket) {
    return <div className="admin-loading">Ticket not found</div>
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="admin-breadcrumb">
        <a href="/admin/tickets">← All Tickets</a>
      </div>

      <div className="admin-ticket-layout">
        {/* Main conversation */}
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
              {ticket.description && (
                <p className="admin-ticket-desc">{ticket.description}</p>
              )}
            </div>

            {/* Messages */}
            <div className="admin-messages">
              {messages.map((msg, i) => (
                <div key={msg.id || i} className={`admin-message ${msg.message_type}`}>
                  <div className="admin-message-header">
                    <span className="admin-message-sender">
                      {msg.sender?.full_name || 'System'}
                    </span>
                    <span className={`admin-message-badge ${msg.message_type}`}>
                      {msg.message_type}
                    </span>
                    <span className="admin-message-time">{formatTime(msg.created_at)}</span>
                  </div>
                  <div className="admin-message-body">{msg.message}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply box */}
            {status !== 'closed' && (
              <div className="admin-reply-box">
                <form onSubmit={handleReply}>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    rows={4}
                    className="admin-reply-input"
                  />
                  <div className="admin-reply-actions">
                    <button
                      type="submit"
                      className="admin-btn-primary"
                      disabled={sending || !reply.trim()}
                    >
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
        </div>

        {/* Sidebar */}
        <div className="admin-ticket-sidebar">
          {/* Details card */}
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
                  <span className="admin-detail-value" style={{ color: 'var(--teal)' }}>You</span>
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

          {/* Client card */}
          <div className="admin-card" style={{ marginTop: 16 }}>
            <h4 className="admin-card-section-title">Client</h4>
            <div className="admin-client-row" style={{ padding: 0, border: 'none' }}>
              <div className="admin-client-avatar">
                {ticket.organization?.name?.charAt(0) || '?'}
              </div>
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