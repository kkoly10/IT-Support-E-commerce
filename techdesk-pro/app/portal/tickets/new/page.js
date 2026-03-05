// File: app/portal/tickets/new/page.js (replace existing)

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../../lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NewTicketPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('medium')
  const [platform, setPlatform] = useState('')
  const [files, setFiles] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState(null)
  const [orgId, setOrgId] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (profile) setOrgId(profile.organization_id)
    }
    getUser()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title || !description || !category) return

    setLoading(true)
    setError(null)

    try {
      // Create ticket
      const { data: ticket, error: ticketErr } = await supabase
        .from('tickets')
        .insert({
          title,
          description,
          category,
          priority,
          platform: platform || null,
          organization_id: orgId,
          created_by: userId,
        })
        .select()
        .single()

      if (ticketErr) throw ticketErr

      // Upload attachments
      if (files.length > 0) {
        for (const file of files) {
          const filePath = `${orgId}/${ticket.id}/${Date.now()}-${file.name}`
          const { error: uploadErr } = await supabase.storage
            .from('ticket-attachments')
            .upload(filePath, file)

          if (!uploadErr) {
            await supabase.from('ticket_attachments').insert({
              ticket_id: ticket.id,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              mime_type: file.type,
              uploaded_by: userId,
            })
          }
        }
      }

      // Trigger AutoResolve (fire and forget — doesn't block the user)
      fetch('/api/ai/auto-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id }),
      })

      router.push(`/portal/tickets/${ticket.id}`)
    } catch (err) {
      console.error('Error creating ticket:', err)
      setError(err.message || 'Failed to create ticket')
      setLoading(false)
    }
  }

  return (
    <div>
      <a href="/portal/tickets" className="new-ticket-back">← Back to tickets</a>
      <h1 style={{ fontSize: '1.4rem', marginBottom: 4 }}>New Support Ticket</h1>
      <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem', marginBottom: 24 }}>
        Describe your issue and our AI will attempt to help immediately. If it needs human attention, our team will respond within your SLA window.
      </p>

      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: '#fee', color: '#c00', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.88rem' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your issue"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide as much detail as possible — what happened, what you expected, any error messages..."
              rows={5}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select category</option>
                <option value="it_support">IT Support</option>
                <option value="ecommerce">E-Commerce</option>
                <option value="integration">Integration</option>
                <option value="document_processing">Document Processing</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="platform">Platform (optional)</label>
            <select
              id="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="">Select if applicable</option>
              <option value="shopify">Shopify</option>
              <option value="wix">Wix</option>
              <option value="woocommerce">WooCommerce</option>
              <option value="squarespace">Squarespace</option>
              <option value="google_workspace">Google Workspace</option>
              <option value="microsoft_365">Microsoft 365</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Attachments (optional)</label>
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv,.txt"
              onChange={(e) => setFiles(Array.from(e.target.files))}
            />
            {files.length > 0 && (
              <div style={{ marginTop: 6, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading || !title || !description || !category}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>
      </div>
    </div>
  )
}