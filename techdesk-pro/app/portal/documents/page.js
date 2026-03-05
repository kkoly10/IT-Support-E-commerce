// File: app/portal/documents/page.js (replace existing placeholder)

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase/client'

const JOB_TYPES = [
  { value: 'invoice_extraction', label: 'Invoice Data Extraction', desc: 'Extract line items, totals, dates, and vendor info from invoices' },
  { value: 'form_processing', label: 'Form Processing', desc: 'Extract fields and data from business forms' },
  { value: 'document_summary', label: 'Document Summary', desc: 'Generate a concise summary of any document' },
  { value: 'data_entry', label: 'Data Entry Automation', desc: 'Extract structured data for spreadsheet import' },
]

export default function DocumentsPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedType, setSelectedType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState([])
  const [error, setError] = useState(null)
  const [userId, setUserId] = useState(null)
  const [orgId, setOrgId] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    loadJobs()
  }, [])

  async function loadJobs() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profile) setOrgId(profile.organization_id)

    const { data } = await supabase
      .from('document_jobs')
      .select('*')
      .order('created_at', { ascending: false })

    setJobs(data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!files.length || !selectedType || !title) return

    setUploading(true)
    setError(null)

    try {
      const uploadedPaths = []
      for (const file of files) {
        const filePath = `${orgId}/${Date.now()}-${file.name}`
        const { error: uploadErr } = await supabase.storage
          .from('document-jobs')
          .upload(filePath, file)

        if (uploadErr) throw uploadErr
        uploadedPaths.push(filePath)
      }

      const { data: job, error: jobErr } = await supabase
        .from('document_jobs')
        .insert({
          organization_id: orgId,
          created_by: userId,
          title,
          description,
          job_type: selectedType,
          input_files: uploadedPaths,
          status: 'pending',
        })
        .select()
        .single()

      if (jobErr) throw jobErr

      fetch('/api/process-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      })

      setShowUpload(false)
      setTitle('')
      setDescription('')
      setFiles([])
      setSelectedType('')
      loadJobs()
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const statusColor = (status) => {
    const colors = { pending: '#f39c12', processing: '#3498db', completed: '#27ae60', failed: '#e74c3c' }
    return colors[status] || '#8a8a8a'
  }

  const statusIcon = (status) => {
    const icons = { pending: '⏳', processing: '⚙️', completed: '✅', failed: '❌' }
    return icons[status] || '📄'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    })
  }

  return (
    <div>
      <div className="portal-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Documents</h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem' }}>
            Upload documents for AI-powered processing.
          </p>
        </div>
        <button
          className="portal-btn-primary"
          style={{
            background: 'var(--teal)', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: 8, fontWeight: 600,
            fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif'
          }}
          onClick={() => setShowUpload(!showUpload)}
        >
          {showUpload ? 'Cancel' : '+ New Job'}
        </button>
      </div>

      {showUpload && (
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 12,
          padding: 24, marginBottom: 24
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>New Document Job</h3>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: '#fee', color: '#c00', padding: '10px 14px',
                borderRadius: 8, marginBottom: 16, fontSize: '0.88rem'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 6, color: 'var(--ink-light)' }}>
                Job Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. January 2026 Invoices"
                required
                style={{
                  width: '100%', padding: '10px 14px', border: '1px solid var(--border)',
                  borderRadius: 8, fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif'
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 6, color: 'var(--ink-light)' }}>
                Processing Type *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {JOB_TYPES.map((type) => (
                  <div
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    style={{
                      padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                      border: selectedType === type.value ? '2px solid var(--teal)' : '1px solid var(--border)',
                      background: selectedType === type.value ? 'var(--teal-light)' : 'white',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink)' }}>{type.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: 2 }}>{type.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 6, color: 'var(--ink-light)' }}>
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any special instructions or notes..."
                rows={3}
                style={{
                  width: '100%', padding: '10px 14px', border: '1px solid var(--border)',
                  borderRadius: 8, fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif', resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 6, color: 'var(--ink-light)' }}>
                Upload Files * (PDF, images, or documents up to 25MB)
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv"
                onChange={(e) => setFiles(Array.from(e.target.files))}
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
              disabled={uploading || !files.length || !selectedType || !title}
              style={{
                background: 'var(--teal)', color: 'white', border: 'none',
                padding: '12px 24px', borderRadius: 8, fontWeight: 600,
                fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                opacity: uploading ? 0.6 : 1
              }}
            >
              {uploading ? 'Uploading & Processing...' : 'Submit for Processing'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: 40 }}>Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 12,
          padding: 40, textAlign: 'center'
        }}>
          <p style={{ color: 'var(--ink-muted)', marginBottom: 8 }}>No document jobs yet.</p>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
            Upload invoices, forms, or documents and our AI will extract and process the data for you.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {jobs.map((job) => (
            <div
              key={job.id}
              style={{
                background: 'white', border: '1px solid var(--border)', borderRadius: 12,
                padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: 16, flexWrap: 'wrap'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span>{statusIcon(job.status)}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)' }}>{job.title}</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', display: 'flex', gap: 12 }}>
                  <span>{JOB_TYPES.find(t => t.value === job.job_type)?.label || job.job_type}</span>
                  <span>·</span>
                  <span>{job.input_files?.length || 0} file{(job.input_files?.length || 0) !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{formatDate(job.created_at)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  display: 'inline-block', padding: '4px 12px', borderRadius: 100,
                  fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize',
                  background: statusColor(job.status) + '18', color: statusColor(job.status)
                }}>
                  {job.status}
                </span>
                {job.status === 'completed' && job.output_files?.length > 0 && (
                  <button
                    onClick={async () => {
                      const { data } = await supabase.storage
                        .from('document-jobs')
                        .createSignedUrl(job.output_files[0], 3600)
                      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
                    }}
                    style={{
                      background: 'var(--teal)', color: 'white', border: 'none',
                      padding: '6px 14px', borderRadius: 6, fontSize: '0.78rem',
                      fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif'
                    }}
                  >
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}