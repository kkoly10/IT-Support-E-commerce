// File: app/admin/clients/page.js (replace existing)

'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const STATUS_COLORS = {
  lead: '#f39c12',
  onboarding: '#3498db',
  active: '#27ae60',
  paused: '#95a5a6',
  former: '#e74c3c',
}

const STATUS_LABELS = {
  lead: 'Lead',
  onboarding: 'Onboarding',
  active: 'Active',
  paused: 'Paused',
  former: 'Former',
}

const SERVICE_LABELS = {
  it: 'IT Support',
}

export default function AdminClients() {
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingOrg, setEditingOrg] = useState(null)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadOrgs()
  }, [statusFilter])

  async function loadOrgs() {
    setLoading(true)
    let query = supabase
      .from('organizations')
      .select('*, profiles(id, full_name, email, role)')
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('client_status', statusFilter)
    }

    const { data } = await query
    setOrgs(data || [])
    setLoading(false)
  }

  async function handleSave(orgId, updates) {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', orgId)

      if (error) throw error
      setEditingOrg(null)
      loadOrgs()
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  }

  // Stats
  const totalOrgs = orgs.length
  const activeCount = orgs.filter(o => o.client_status === 'active').length
  const leadCount = orgs.filter(o => o.client_status === 'lead').length
  const onboardingCount = orgs.filter(o => o.client_status === 'onboarding').length
  const needsReview = orgs.filter(o => o.needs_human_review).length

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Clients</h1>
          <p className="admin-page-desc">{totalOrgs} organization{totalOrgs !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Active', val: activeCount, color: '#27ae60' },
          { label: 'Onboarding', val: onboardingCount, color: '#3498db' },
          { label: 'Leads', val: leadCount, color: '#f39c12' },
          { label: 'Total', val: totalOrgs, color: 'var(--ink)' },
          { label: 'Needs Review', val: needsReview, color: '#e74c3c' },
        ].map((s, i) => (
          <div key={i} className="admin-stat-card">
            <div className="admin-stat-label">{s.label}</div>
            <div className="admin-stat-value" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-filter-select"
        >
          <option value="all">All Statuses</option>
          <option value="lead">Leads</option>
          <option value="onboarding">Onboarding</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="former">Former</option>
        </select>
      </div>

      {/* Client list */}
      <div className="admin-card" style={{ padding: 0 }}>
        {loading ? (
          <div className="admin-loading" style={{ padding: 40 }}>Loading clients...</div>
        ) : orgs.length === 0 ? (
          <div className="admin-empty-text" style={{ padding: 40 }}>No organizations found</div>
        ) : (
          <div>
            {orgs.map((org, i) => {
              const isEditing = editingOrg === org.id
              const memberCount = org.profiles?.length || 0

              return (
                <div key={org.id} style={{
                  padding: '16px 20px',
                  borderBottom: i < orgs.length - 1 ? '1px solid #f0ede8' : 'none',
                  background: org.needs_human_review ? '#fffdf5' : 'transparent',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    {/* Left: Org info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div className="admin-client-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                          {org.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="admin-client-name" style={{ fontSize: '0.95rem' }}>{org.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                            {memberCount} member{memberCount !== 1 ? 's' : ''} · Since {formatDate(org.created_at)}
                          </div>
                        </div>
                      </div>

                      {/* Tags row */}
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        <span className="admin-status-badge" style={{
                          background: (STATUS_COLORS[org.client_status] || '#8a8a8a') + '18',
                          color: STATUS_COLORS[org.client_status] || '#8a8a8a',
                        }}>
                          {STATUS_LABELS[org.client_status] || org.client_status}
                        </span>
                        <span className="admin-status-badge" style={{ background: '#0D7C6618', color: '#0D7C66' }}>
                          {org.plan || 'starter'}
                        </span>
                        {(org.service_types || []).map((st) => (
                          <span key={st} className="admin-status-badge" style={{ background: '#f0f2f5', color: '#4a4a4a' }}>
                            {SERVICE_LABELS[st] || st}
                          </span>
                        ))}
                        {org.needs_human_review && (
                          <span className="admin-status-badge" style={{ background: '#e74c3c18', color: '#e74c3c' }}>
                            ⚠️ Needs Review
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <button
                      onClick={() => setEditingOrg(isEditing ? null : org.id)}
                      style={{
                        padding: '6px 14px', borderRadius: 6,
                        border: '1px solid var(--border)', background: 'white',
                        fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'Outfit, sans-serif',
                      }}
                    >
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  {/* Edit panel */}
                  {isEditing && (
                    <EditPanel
                      org={org}
                      saving={saving}
                      onSave={(updates) => handleSave(org.id, updates)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function EditPanel({ org, saving, onSave }) {
  const [primaryService, setPrimaryService] = useState(org.primary_service || 'it')
  const [serviceTypes, setServiceTypes] = useState(org.service_types || ['it'])
  const [clientStatus, setClientStatus] = useState(org.client_status || 'lead')
  const [plan, setPlan] = useState(org.plan || 'starter')
  const [teamSize, setTeamSize] = useState(org.team_size || '')
  const [industry, setIndustry] = useState(org.industry || '')
  const [agreementStatus, setAgreementStatus] = useState(org.agreement_status || 'none')
  const [paymentStatus, setPaymentStatus] = useState(org.payment_status || 'none')
  const [onboardingStatus, setOnboardingStatus] = useState(org.onboarding_status || 'not_started')
  const [needsReview, setNeedsReview] = useState(org.needs_human_review || false)

  function toggleService(svc) {
    setServiceTypes(prev =>
      prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]
    )
  }

  function handleSubmit() {
    onSave({
      primary_service: primaryService,
      service_types: serviceTypes,
      client_status: clientStatus,
      plan,
      team_size: teamSize || null,
      industry: industry || null,
      agreement_status: agreementStatus,
      payment_status: paymentStatus,
      onboarding_status: onboardingStatus,
      needs_human_review: needsReview,
    })
  }

  const fieldStyle = { marginBottom: 14 }
  const labelStyle = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }
  const selectStyle = { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif' }
  const inputStyle = { ...selectStyle }

  return (
    <div style={{
      marginTop: 16, padding: 20, background: '#fafaf8', borderRadius: 10,
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Client Status</label>
          <select value={clientStatus} onChange={e => setClientStatus(e.target.value)} style={selectStyle}>
            <option value="lead">Lead</option>
            <option value="onboarding">Onboarding</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="former">Former</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Plan</label>
          <select value={plan} onChange={e => setPlan(e.target.value)} style={selectStyle}>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="scale">Scale</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Primary Service</label>
          <select value={primaryService} onChange={e => setPrimaryService(e.target.value)} style={selectStyle}>
            <option value="it">IT Support</option>
                      </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Service Types</label>
          <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
            {['it'].map(svc => (
              <label key={svc} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={serviceTypes.includes(svc)} onChange={() => toggleService(svc)} />
                {SERVICE_LABELS[svc]}
              </label>
            ))}
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Team Size</label>
          <input type="number" value={teamSize} onChange={e => setTeamSize(e.target.value)} placeholder="e.g. 12" style={inputStyle} />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Industry</label>
          <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Legal, Retail" style={inputStyle} />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Agreement</label>
          <select value={agreementStatus} onChange={e => setAgreementStatus(e.target.value)} style={selectStyle}>
            <option value="none">None</option>
            <option value="sent">Sent</option>
            <option value="signed">Signed</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Payment</label>
          <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} style={selectStyle}>
            <option value="none">None</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="past_due">Past Due</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Onboarding</label>
          <select value={onboardingStatus} onChange={e => setOnboardingStatus(e.target.value)} style={selectStyle}>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={needsReview} onChange={e => setNeedsReview(e.target.checked)} />
          Needs human review
        </label>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            padding: '8px 20px', background: 'var(--teal)', color: 'white',
            border: 'none', borderRadius: 6, fontWeight: 600, fontSize: '0.85rem',
            cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
            opacity: saving ? 0.5 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}