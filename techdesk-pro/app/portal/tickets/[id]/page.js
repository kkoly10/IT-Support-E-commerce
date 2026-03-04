'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../../../lib/supabase/client'
import { useParams } from 'next/navigation'

export default function TicketDetailPage() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [attachments, setAttachments] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const messagesEndRef = useRef(null)
  const supabase = createClient()

  useEffect(() => {
    loadTicket()
    setupRealtime()
    return () => {
      supabase.removeAllChannels()
    }
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadTicket() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: ticket } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single()

    setTicket(ticket)

    const { data: msgs } = await supabase
      .from('ticket_messages')
      .select('*, profiles(full_name, avatar_url)')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    setMessages(msgs || [])

    const { data: atts } = await supabase
      .from('ticket_attachments')
      .select('*')
      .eq('ticket_id', id)

    setAttachments(atts || [])
    setLoading(false)
  }

  function setupRealtime() {
    supabase
      .channel(`ticket-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_messages',
        filter: `ticket_id=eq.${id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tickets',
        filter: `id=eq.${id}`,
      }, (payload) => {
        setTicket(payload.new)
      })
      .subscribe()
  }

  async function handleSendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim() || !userId) return
    setSending(true)

    await supabase.from('ticket_messages').insert({
      ticket_id: id,
      sender_id: userId,
      sender_type: 'client',
      body: newMessage.trim(),
    })

    setNewMessage('')
    setSending(false)
    loadTicket() // Refresh to get the profile join data
  }

  const statusColor = (status) => {
    const colors = {
      open: '#f59e0b', in_progress: '#3b82f6', waiting_client: '#8b5cf6',
      waiting_vendor: '#6b7280', resolved: '#10b981', closed: '#6b7280',
    }
    return colors[status] || '#6b7280'
  }

  const priorityColor = (priority) => {
    const colors = { low: '#6b7280', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' }
    return colors[priority] || '#6b7280'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    })
  }

  if (loading) return <div className="portal-page-loading">Loading ticket...</div>
  if (!ticket) return <div className="portal-page-loading">Ticket not found.</div>

  return (
    <div className="ticket-detail">
      <a href="/portal/tickets" className="new-ticket-back">← Back to tickets</a>

      {/* Ticket Header */}
      <div className="ticket-detail-header">
        <div className="ticket-detail-title-row">
          <span className="ticket-number">TDP-{ticket.ticket_number}</span>
          <h1>{ticket.title}</h1>
        </div>
        <div className="ticket-detail-meta">
          <span className="ticket-status" style={{ background: statusColor(ticket.status) + '20', color: statusColor(ticket.status) }}>
            {ticket.status.replace('_', ' ')}
          </span>
          <span className="ticket-priority-badge" style={{ color: priorityColor(ticket.priority) }}>
            {ticket.priority}
          </span>
          <span className="ticket-category">{ticket.category.replace('_', ' ')}</span>
          {ticket.platform && <span className="ticket-platform">{ticket.platform}</span>}
          <span className="ticket-date">Created {formatDate(ticket.created_at)}</span>
        </div>
      </div>

      {/* Resolved Banner */}
      {(ticket.status === 'resolved' || ticket.status === 'closed') && (
        <div className="ticket-resolved-banner">
          This ticket was {ticket.status} on {formatDate(ticket.resolved_at || ticket.closed_at || ticket.updated_at)}.
        </div>
      )}

      {/* Description */}
      <div className="ticket-description">
        <div className="ticket-description-label">Description</div>
        <p>{ticket.description}</p>
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="ticket-attachments">
          <div className="ticket-description-label">Attachments</div>
          <div className="ticket-attachment-list">
            {attachments.map((att) => (
              <div key={att.id} className="ticket-attachment-item">
                📎 {att.file_name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversation */}
      <div className="ticket-conversation">
        <div className="ticket-description-label">Conversation</div>

        {messages.length === 0 ? (
          <div className="ticket-no-messages">
            No messages yet. Our team will respond within your SLA window.
          </div>
        ) : (
          <div className="message-list">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.sender_type === 'client' ? 'message-client' : msg.sender_type === 'system' ? 'message-system' : 'message-agent'}`}
              >
                {msg.sender_type === 'system' ? (
                  <div className="message-system-text">{msg.body}</div>
                ) : (
                  <>
                    <div className="message-header">
                      <span className="message-sender">
                        {msg.profiles?.full_name || (msg.sender_type === 'ai' ? 'AI Assistant' : msg.sender_type === 'agent' ? 'Support Agent' : 'You')}
                      </span>
                      <span className="message-time">{formatDate(msg.created_at)}</span>
                      {msg.ai_generated && <span className="message-ai-badge">AI</span>}
                    </div>
                    <div className="message-body">{msg.body}</div>
                  </>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Reply Form */}
        {ticket.status !== 'closed' && (
          <form onSubmit={handleSendMessage} className="message-form">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your reply..."
              rows={3}
              required
            />
            <button type="submit" disabled={sending || !newMessage.trim()}>
              {sending ? 'Sending...' : 'Send Reply'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}