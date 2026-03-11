'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const DOC_TYPE_LABELS = {
  general: 'General',
  agreement: 'Agreement',
  access: 'Access',
  environment: 'Environment',
  contacts: 'Contacts',
  support_reference: 'Support Reference',
}

const STATUS_STYLES = {
  uploaded: { bg: '#eef4ff', color: '#1d4ed8' },
  reviewed: { bg: '#ecfdf3', color: '#067647' },
  needs_followup: { bg: '#fffaeb', color: '#b54708' },
  archived: { bg: '#f3f4f6', color: '#6b7280' },
}

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

export default function AdminDocumentsPage() {
  const [loading, setLoading] = useState(true)
  const [docs, setDocs] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('organization_documents')
        .select(`
          *,
          organization:organizations(id, name, client_status, onboarding_status, support_ready),
          uploader:profiles!organization_documents_uploaded_by_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })

      setDocs(data || [])
    } catch (err) {
      console.error('Documents load error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(id, status) {
    try {
      const { error } = await supabase
        .from('organization_documents')
        .update({ status })
        .eq('id', id)

      if (error) throw error

      setDocs((prev) => prev.map((doc) => (doc.id === id ? { ...doc, status } : doc)))
    } catch (err) {
      console.error('Document status update error:', err)
      alert(err.message || 'Failed to update document status')
    }
  }

  async function openDocument(doc) {
    try {
      const { data, error } = await supabase.storage
        .from('organization-documents')
        .createSignedUrl(doc.storage_path, 3600)

      if (error) throw error
      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    } catch (err) {
      console.error('Signed URL error:', err)
      alert(err.message || 'Failed to open document')
    }
  }

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase()

    return docs.filter((doc) => {
      if (statusFilter !== 'all' && doc.status !== statusFilter) return false
      if (typeFilter !== 'all' && doc.document_type !== typeFilter) return false

      if (!q) return true

      const blob = [
        doc.title,
        doc.file_name,
        doc.notes,
        doc.document_type,
        doc.organization?.name,
        doc.uploader?.full_name,
        doc.uploader?.email,
      ]
        .join(' ')
        .toLowerCase()

      return blob.includes(q)
    })
  }, [docs, statusFilter, typeFilter, search])

  const stats = useMemo(() => {
    return {
      total: docs.length,
      uploaded: docs.filter((d) => d.status === 'uploaded').length,
      reviewed: docs.filter((d) => d.status === 'reviewed').length,
      needsFollowup: docs.filter((d) => d.status === 'needs_followup').length,
    }
  }, [docs])

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Documents</h1>
          <p className="admin-page-desc">
            Review client onboarding and support-reference documents.
          </p>
        </div>
      </div>

      <div className="admin-stats-row" style={{ marginBottom: 18 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total</div>
          <div className="admin-stat-value">{stats.total}</div>
        </div>
        <div className="admin-stat-card accent-teal">
          <div className="admin-stat-label">Uploaded</div>
          <div className="admin-stat-value">{stats.uploaded}</div>
        </div>
        <div className="admin-stat-card accent-green">
          <div className="admin-stat-label">Reviewed</div>
          <div className="admin-stat-value">{stats.reviewed}</div>
        </div>
        <div className="admin-stat-card accent-yellow">
          <div className="admin-stat-label">Needs Follow-up</div>
          <div className="admin-stat-value">{stats.needsFollowup}</div>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 18 }}>
        <div className="admin-filters" style={{ marginTop: 0 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client, file, title, or notes..."
            className="admin-search-input"
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="admin-filter-select"
          >
            <option value="all">All Types</option>
            <option value="general">General</option>
            <option value="agreement">Agreement</option>
            <option value="access">Access</option>
            <option value="environment">Environment</option>
            <option value="contacts">Contacts</option>
            <option value="support_reference">Support Reference</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="uploaded">Uploaded</option>
            <option value="reviewed">Reviewed</option>
            <option value="needs_followup">Needs Follow-up</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        {loading ? (
          <div className="admin-loading" style={{ padding: 40 }}>Loading documents...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="admin-empty-text" style={{ padding: 40 }}>No documents found</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => {
                  const style = STATUS_STYLES[doc.status] || STATUS_STYLES.uploaded

                  return (
                    <tr key={doc.id}>
                      <td>
                        <div className="admin-table-title">
                          {doc.title || doc.file_name || 'Untitled document'}
                        </div>
                        <div className="admin-table-sub">
                          {doc.file_name || 'No file name'}
                        </div>
                        {doc.notes && (
                          <div className="admin-table-muted" style={{ marginTop: 4 }}>
                            {doc.notes}
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="admin-table-title" style={{ fontSize: '0.84rem' }}>
                          {doc.organization?.name || 'Unknown client'}
                        </div>
                        <div className="admin-table-sub">
                          {doc.organization?.client_status || '—'} · onboarding {doc.organization?.onboarding_status || '—'}
                        </div>
                      </td>

                      <td className="admin-table-muted">
                        {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                      </td>

                      <td>
                        <span
                          className="admin-status-badge"
                          style={{ background: style.bg, color: style.color }}
                        >
                          {doc.status || 'uploaded'}
                        </span>
                      </td>

                      <td className="admin-table-muted">
                        <div>{fmtDate(doc.created_at)}</div>
                        <div style={{ marginTop: 4, fontSize: '0.75rem' }}>
                          {doc.uploader?.full_name || doc.uploader?.email || 'Unknown uploader'}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button onClick={() => openDocument(doc)} className="admin-btn-small">
                            Open
                          </button>

                          <button
                            onClick={() => updateStatus(doc.id, 'reviewed')}
                            className="admin-btn-small"
                          >
                            Mark Reviewed
                          </button>

                          <button
                            onClick={() => updateStatus(doc.id, 'needs_followup')}
                            className="admin-btn-small"
                          >
                            Needs Follow-up
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}