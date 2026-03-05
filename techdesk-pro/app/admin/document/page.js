// File: app/admin/documents/page.js (new — create folder: mkdir -p app/admin/documents)

'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const JOB_TYPE_LABELS = {
  invoice_extraction: 'Invoice Extraction',
  form_processing: 'Form Processing',
  document_summary: 'Document Summary',
  data_entry: 'Data Entry',
}

export default function AdminDocuments() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadJobs()
  }, [statusFilter])

  async function loadJobs() {
    setLoading(true)
    try {
      let query = supabase
        .from('document_jobs')
        .select('*, organization:organizations(name), creator:profiles!document_jobs_created_by_fkey(full_name)')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data } = await query
      setJobs(data || [])
    } catch (err) {
      console.error('Error loading jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  const statusColor = (status) => {
    const colors = { pending: '#f39c12', processing: '#3498db', completed: '#27ae60', failed: '#e74c3c' }
    return colors[status] || '#8a8a8a'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    })
  }

  const formatDuration = (ms) => {
    if (!ms) return '—'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Document Jobs</h1>
          <p className="admin-page-desc">{jobs.length} job{jobs.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="admin-filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-filter-select"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        {loading ? (
          <div className="admin-loading" style={{ padding: 40 }}>Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="admin-empty-text" style={{ padding: 40 }}>No document jobs found</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Files</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div className="admin-table-title">{job.title}</div>
                      {job.description && (
                        <div className="admin-table-sub">{job.description.slice(0, 60)}{job.description.length > 60 ? '...' : ''}</div>
                      )}
                    </td>
                    <td className="admin-table-muted">{job.organization?.name || '—'}</td>
                    <td className="admin-table-muted">{JOB_TYPE_LABELS[job.job_type] || job.job_type}</td>
                    <td className="admin-table-muted">{job.input_files?.length || 0}</td>
                    <td>
                      <span
                        className="admin-status-badge"
                        style={{ background: statusColor(job.status) + '18', color: statusColor(job.status) }}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="admin-table-muted">{formatDuration(job.processing_time_ms)}</td>
                    <td className="admin-table-muted">{formatDate(job.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}