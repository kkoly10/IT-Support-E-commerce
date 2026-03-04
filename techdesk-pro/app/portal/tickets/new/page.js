'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../../../lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NewTicketPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('it_support')
  const [priority, setPriority] = useState('medium')
  const [platform, setPlatform] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [orgId, setOrgId] = useState(null)
  const [userId, setUserId] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, organizations(store_url, platform)')
        .eq('id', user.id)
        .single()

      if (profile) {
        setOrgId(profile.organization_id)
        if (profile.organizations?.platform) setPlatform(profile.organizations.platform)
      }
    }
    loadUser()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!orgId || !userId) return
    setLoading(true)
    setError(null)

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        organization_id: orgId,
        created_by: userId,
        title,
        description,
        category,
        priority,
        platform: platform || null,
      })
      .select()
      .single()

    if (ticketError) {
      setError(ticketError.message)
      setLoading(false)
      return
    }

    // Upload attachments
    if (files.length > 0) {
      for (const file of files) {
        const filePath = `${orgId}/${ticket.id}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(filePath, file)

        if (!uploadError) {
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

    router.push(`/portal/tickets/${ticket.id}`)
  }

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files)
    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="new-ticket-page">
      <div className="new-ticket-header">
        <a href="/portal/tickets" className="new-ticket-back">← Back to tickets</a>
        <h1>Create New Ticket</h1>
        <p>Describe your issue and we&apos;ll get on it.</p>
      </div>

      <form onSubmit={handleSubmit} className="new-ticket-form">
        {error && <div className="auth-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary of the issue"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="it_support">IT Support</option>
              <option value="ecommerce">E-Commerce</option>
              <option value="integration">Integration</option>
              <option value="document_processing">Document Processing</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority *</label>
            <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="platform">Platform</label>
            <select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option value="">Select...</option>
              <option value="shopify">Shopify</option>
              <option value="wix">Wix</option>
              <option value="woocommerce">WooCommerce</option>
              <option value="squarespace">Squarespace</option>
              <option value="quickbooks">QuickBooks</option>
              <option value="klaviyo">Klaviyo</option>
              <option value="zapier">Zapier</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail. Include any error messages, URLs, or steps to reproduce."
            rows={8}
            required
          />
        </div>

        <div className="form-group">
          <label>Attachments</label>
          <div className="file-upload-zone">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              id="fileInput"
              style={{ display: 'none' }}
            />
            <label htmlFor="fileInput" className="file-upload-label">
              <span>📎 Click to attach files</span>
              <span className="file-upload-hint">Max 10MB per file</span>
            </label>
          </div>
          {files.length > 0 && (
            <div className="file-list">
              {files.map((file, i) => (
                <div key={i} className="file-item">
                  <span>{file.name}</span>
                  <button type="button" onClick={() => removeFile(i)} className="file-remove">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="new-ticket-actions">
          <a href="/portal/tickets" className="btn-cancel">Cancel</a>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  )
}