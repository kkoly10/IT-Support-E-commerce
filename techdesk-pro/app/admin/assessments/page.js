'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'converted', 'archived']

export default function AdminAssessmentsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    setLoading(true)
    const { data, error } = await supabase
      .from('assessment_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setItems(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    await supabase.from('assessment_submissions').update({ status }).eq('id', id)
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Free Assessments</h1>
          <p className="admin-page-desc">Track intake submissions and move them into onboarding.</p>
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        {loading ? (
          <div className="admin-loading" style={{ padding: 32 }}>Loading assessments...</div>
        ) : items.length === 0 ? (
          <div className="admin-empty-text" style={{ padding: 32 }}>No assessment submissions yet.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Contact</th>
                  <th>Team</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Convert</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="admin-table-title">{item.business_name}</div>
                      <div className="admin-table-sub">{item.environment}</div>
                    </td>
                    <td className="admin-table-muted">
                      {item.full_name}<br />{item.email}
                    </td>
                    <td className="admin-table-muted">{item.team_size_range || '—'}</td>
                    <td className="admin-table-muted">{item.urgency || '—'}</td>
                    <td>
                      <select value={item.status || 'new'} onChange={(e) => updateStatus(item.id, e.target.value)} className="admin-filter-select">
                        {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </td>
                    <td className="admin-table-muted">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td>
                      <a href={`/signup?assessment=${item.id}&email=${encodeURIComponent(item.email || '')}&company=${encodeURIComponent(item.business_name || '')}&name=${encodeURIComponent(item.full_name || '')}`} className="admin-btn-small">
                        Open Signup
                      </a>
                    </td>
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
