'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../../../lib/supabase/client'
import { useParams } from 'next/navigation'
import { CATEGORY_LABELS, PRIORITY_COLORS, STATUS_COLORS, STATUS_LABELS, toLabel } from '../../../../lib/support-ui'

export default function TicketDetailPage() {
  const { id } = useParams()
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [attachments, setAttachments] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [orgId, setOrgId] = useState(null)
  const messagesEndRef = useRef(null)
  const supabase = createClient()

  // Rating state
  const [existingRating, setExistingRating] = useState(null)
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedRating, setSelectedRating] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)

  useEffect(() => {
    loadTicket()
    setupRealtime()
    return () => { supabase.removeAllChannels() }
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadTicket() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profile) setOrgId(profile.organization_id)

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

    // Check for existing rating
    const { data: rating } = await supabase
      .from('ticket_ratings')
      .select('*')
      .eq('ticket_id', id)
      .eq('rated_by', user.id)
      .single()

    if (rating) {
      setExistingRating(rating)
      setSelectedRating(rating.rating)
    }

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
    loadTicket()
  }

  async function handleSubmitRating() {
    if (!selectedRating || !userId || !orgId) return
    setSubmittingRating(true)

    try {
      await supabase.from('ticket_ratings').insert({
        ticket_id: id,
        organization_id: orgId,
        rated_by: userId,
        rating: selectedRating,
        comment: ratingComment.trim() || null,
      })

      setExistingRating({ rating: selectedRating, comment: ratingComment })
      setRatingSubmitted(true)
    } catch (err) {
      console.error('Rating error:', err)
    } finally {
      setSubmittingRating(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    })
  }

  const starLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

  if (loading) return <div className="portal-page-loading">Loading support request...</div>
  if (!ticket) return <div className="portal-page-loading">Support request not found.</div>

  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed'

  return (
    <div className="ticket-detail">
      <a href="/portal/tickets" className="new-ticket-back">← Back to Support Requests</a>

      {/* Support Request Header */}
      <div className="ticket-detail-header">
        <div className="ticket-detail-title-row">
          <span className="ticket-number">{ticket.ticket_number ? `TDP-${ticket.ticket_number}` : `#${ticket.id.slice(0, 8)}`}</span>
          <h1>{ticket.title}</h1>
        </div>
        <div className="ticket-detail-meta">
          <span
            className="ticket-status"
            style={{
              background: `${STATUS_COLORS[ticket.status] || '#6b7280'}20`,
              color: STATUS_COLORS[ticket.status] || '#6b7280',
            }}
          >
            {toLabel(ticket.status, STATUS_LABELS)}
          </span>
          <span className="ticket-priority-badge" style={{ color: PRIORITY_COLORS[ticket.priority] || '#6b7280' }}>
            {toLabel(ticket.priority)}
          </span>
          <span className="ticket-category">{toLabel(ticket.category, CATEGORY_LABELS)}</span>
          {ticket.platform && <span className="ticket-platform">{ticket.platform}</span>}
          <span className="ticket-date">Created {formatDate(ticket.created_at)}</span>
        </div>
      </div>

      {/* Resolved Banner */}
      {isResolved && (
        <div className="ticket-resolved-banner">
          This support request was {toLabel(ticket.status, STATUS_LABELS)} on {formatDate(ticket.resolved_at || ticket.closed_at || ticket.updated_at)}.
        </div>
      )}

      {/* Satisfaction Survey */}
      {isResolved && !existingRating && !ratingSubmitted && (
        <div style={{
          background: 'white', border: '2px solid var(--teal)', borderRadius: 14,
          padding: 24, marginBottom: 24, textAlign: 'center',
        }}>
          <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>⭐</div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>How was your experience?</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginBottom: 16 }}>
            Your feedback helps us improve our service.
          </p>

          {/* Stars */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setSelectedRating(star)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '2rem', transition: 'transform 0.15s',
                  transform: (hoverRating || selectedRating) >= star ? 'scale(1.15)' : 'scale(1)',
                  filter: (hoverRating || selectedRating) >= star ? 'none' : 'grayscale(1) opacity(0.3)',
                }}
              >
                ⭐
              </button>
            ))}
          </div>
          {(hoverRating || selectedRating) > 0 && (
            <div style={{ fontSize: '0.85rem', color: 'var(--teal)', fontWeight: 600, marginBottom: 12 }}>
              {starLabels[hoverRating || selectedRating]}
            </div>
          )}

          {selectedRating > 0 && (
            <>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Any additional feedback? (optional)"
                rows={2}
                style={{
                  width: '100%', maxWidth: 400, padding: '10px 14px',
                  border: '1px solid var(--border)', borderRadius: 8,
                  fontSize: '0.88rem', fontFamily: 'Outfit, sans-serif',
                  resize: 'none', margin: '0 auto', display: 'block',
                }}
              />
              <button
                onClick={handleSubmitRating}
                disabled={submittingRating}
                style={{
                  marginTop: 12, padding: '10px 24px', background: 'var(--teal)',
                  color: 'white', border: 'none', borderRadius: 8,
                  fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                {submittingRating ? 'Submitting...' : 'Submit Rating'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Already rated */}
      {(existingRating || ratingSubmitted) && (
        <div style={{
          background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 14,
          padding: '16px 24px', marginBottom: 24, textAlign: 'center',
        }}>
          <span style={{ fontSize: '0.9rem', color: '#059669' }}>
            {'⭐'.repeat(existingRating?.rating || selectedRating)} — Thanks for your feedback!
          </span>
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
            No updates yet. Our support team will post the first update soon.
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
              placeholder="Share a reply or update for the support team..."
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
