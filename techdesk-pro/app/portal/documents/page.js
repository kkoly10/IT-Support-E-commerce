'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

const supabase = createClient()

const DOC_REQUIREMENTS = [
  {
    key: 'agreement',
    title: 'Service agreement',
    description: 'Signed service agreement or approval packet for support activation.',
  },
  {
    key: 'access',
    title: 'Access documentation',
    description: 'Admin access notes, delegated access details, or approved credential process.',
  },
  {
    key: 'environment',
    title: 'Environment reference',
    description: 'Key systems, platforms, locations, business apps, and support notes.',
  },
  {
    key: 'contacts',
    title: 'Primary contact details',
    description: 'Who approves requests, who receives updates, and who can authorize support work.',
  },
]

function fmtDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function DocumentsPage() {
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState(null)
  const [org, setOrg] = useState(null)
  const [documents, setDocuments] = useState([])
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('general')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState([])
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      setProfile(profileData || null)
      setOrg(profileData?.organizations || null)

      let nextDocuments = []

      try {
        const { data: docs } = await supabase
          .from('organization_documents')
          .select('*')
          .eq('organization_id', profileData.organization_id)
          .order('created_at', { ascending: false })

        nextDocuments = docs || []
      } catch {
        nextDocuments = []
      }

      setDocuments(nextDocuments)
    } catch (err) {
      console.error('Documents load error:', err)
      setError(err.message || 'Failed to load documents.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!files.length || !title.trim() || !org?.id || !profile?.id) return

    setUploading(true)
    setError(null)
    setMessage(null)

    try {
      const uploaded = []

      for (const file of files) {
        const path = `${org.id}/${Date.now()}-${file.name}`

        const { error: uploadError } = await supabase.storage
          .from('organization-documents')
          .upload(path, file)

        if (uploadError) throw uploadError

        uploaded.push({
          storage_path: path,
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size || null,
        })
      }

      try {
        const rows = uploaded.map((item) => ({
          organization_id: org.id,
          uploaded_by: profile.id,
          title: title.trim(),
          document_type: docType,
          notes: notes.trim() || null,
          storage_path: item.storage_path,
          file_name: item.file_name,
          mime_type: item.mime_type,
          size_bytes: item.size_bytes,
          status: 'uploaded',
        }))

        await supabase.from('organization_documents').insert(rows)
      } catch (insertErr) {
        console.warn('organization_documents insert skipped or failed:', insertErr)
      }

      setMessage('Documents uploaded successfully.')
      setTitle('')
      setDocType('general')
      setNotes('')
      setFiles([])
      await loadData()
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload documents.')
    } finally {
      setUploading(false)
    }
  }

  const readiness = useMemo(() => {
    return {
      documentationStatus: org?.documentation_status || 'not_started',
      supportReady: !!org?.support_ready,
      blockers: Array.isArray(org?.onboarding_blockers) ? org.onboarding_blockers : [],
    }
  }, [org])

  if (loading) {
    return <div className="portal-page-loading">Loading documents...</div>
  }

  return (
    <div>
      <div className="portal-page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Documents</h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem' }}>
          Upload onboarding and support-related documents so Kocre IT Services can prepare your account for support.
        </p>
      </div>

      <div className="dashboard-stats" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-label">Documentation status</div>
          <div className="stat-card-value" style={{ fontSize: '1.05rem' }}>
            {String(readiness.documentationStatus).replace(/_/g, ' ')}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Support launch</div>
          <div className="stat-card-value" style={{ fontSize: '1.05rem', color: readiness.supportReady ? '#10b981' : '#b45309' }}>
            {readiness.supportReady ? 'Ready' : 'Still in setup'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Uploaded items</div>
          <div className="stat-card-value">{documents.length}</div>
        </div>
      </div>

      <div className="dashboard-section" style={{ marginBottom: 20 }}>
        <div className="dashboard-section-header">
          <h2>Common onboarding documents</h2>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {DOC_REQUIREMENTS.map((item) => (
            <div
              key={item.key}
              style={{
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '14px 16px',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
              <div style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>{item.description}</div>
            </div>
          ))}
        </div>

        {readiness.blockers.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Current blockers</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {readiness.blockers.map((blocker) => (
                <span
                  key={blocker}
                  className="ticket-platform"
                  style={{ background: '#fef3f2', color: '#b42318' }}
                >
                  {blocker}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Upload documents</h3>

        {message && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#059669',
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: '0.88rem',
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: '0.88rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleUpload}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Document title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Signed support agreement"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Document type *</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} style={inputStyle}>
                <option value="general">General</option>
                <option value="agreement">Agreement</option>
                <option value="access">Access</option>
                <option value="environment">Environment</option>
                <option value="contacts">Contacts</option>
                <option value="support_reference">Support Reference</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add context or instructions for these files..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Files *</label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              style={{ fontSize: '0.88rem' }}
            />
            {files.length > 0 && (
              <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading || !title.trim() || files.length === 0}
            className="portal-btn-primary"
            style={{
              background: 'var(--teal)',
              color: 'white',
              border: 'none',
              padding: '12px 22px',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: uploading ? 0.65 : 1,
            }}
          >
            {uploading ? 'Uploading...' : 'Upload Documents'}
          </button>
        </form>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Uploaded documents</h2>
        </div>

        {documents.length === 0 ? (
          <div className="dashboard-empty" style={{ textAlign: 'left' }}>
            <p>No documents uploaded yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 14,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{doc.title || doc.file_name || 'Untitled document'}</div>
                  <div style={{ color: 'var(--ink-muted)', fontSize: '0.84rem', marginTop: 4 }}>
                    {doc.document_type || 'general'} · uploaded {fmtDate(doc.created_at)}
                  </div>
                  {doc.notes && (
                    <div style={{ color: 'var(--ink-muted)', fontSize: '0.84rem', marginTop: 6 }}>
                      {doc.notes}
                    </div>
                  )}
                </div>

                <span
                  className="ticket-platform"
                  style={{
                    background: '#eef4ff',
                    color: '#1d4ed8',
                  }}
                >
                  {doc.status || 'uploaded'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 500,
  marginBottom: 6,
  color: 'var(--ink-light)',
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: '0.9rem',
  fontFamily: 'Outfit, sans-serif',
}