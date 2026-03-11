'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { CONTACT_ROLE_LABELS, CONTACT_ROLE_OPTIONS, deriveContactMatrixSummary } from '../../../lib/contacts'

const supabase = createClient()

export default function PortalContactsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [orgId, setOrgId] = useState(null)
  const [contacts, setContacts] = useState([])
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [roleType, setRoleType] = useState('general')
  const [isPrimaryContact, setIsPrimaryContact] = useState(false)
  const [isAuthorizedRequester, setIsAuthorizedRequester] = useState(false)
  const [receivesBillingNotices, setReceivesBillingNotices] = useState(false)
  const [receivesSecurityNotices, setReceivesSecurityNotices] = useState(false)
  const [receivesEmergencyNotices, setReceivesEmergencyNotices] = useState(false)
  const [notes, setNotes] = useState('')

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
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      setOrgId(profileData.organization_id)

      const { data: rows } = await supabase
        .from('organization_contacts')
        .select('*')
        .eq('organization_id', profileData.organization_id)
        .order('created_at', { ascending: true })

      setContacts(rows || [])
    } catch (err) {
      console.error('Contacts load error:', err)
      setError(err.message || 'Failed to load contacts.')
    } finally {
      setLoading(false)
    }
  }

  async function resetPrimaryIfNeeded() {
    if (!orgId || !isPrimaryContact) return
    await supabase
      .from('organization_contacts')
      .update({ is_primary_contact: false })
      .eq('organization_id', orgId)
  }

  async function handleAddContact(e) {
    e.preventDefault()
    if (!orgId || !fullName.trim()) return

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      await resetPrimaryIfNeeded()

      const { error: insertError } = await supabase
        .from('organization_contacts')
        .insert({
          organization_id: orgId,
          full_name: fullName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          role_type: roleType,
          is_primary_contact: isPrimaryContact,
          is_authorized_requester: isAuthorizedRequester,
          receives_billing_notices: receivesBillingNotices,
          receives_security_notices: receivesSecurityNotices,
          receives_emergency_notices: receivesEmergencyNotices,
          notes: notes.trim() || null,
        })

      if (insertError) throw insertError

      setFullName('')
      setEmail('')
      setPhone('')
      setRoleType('general')
      setIsPrimaryContact(false)
      setIsAuthorizedRequester(false)
      setReceivesBillingNotices(false)
      setReceivesSecurityNotices(false)
      setReceivesEmergencyNotices(false)
      setNotes('')
      setMessage('Contact added successfully.')
      await loadData()
    } catch (err) {
      console.error('Add contact error:', err)
      setError(err.message || 'Failed to add contact.')
    } finally {
      setSaving(false)
    }
  }

  const summary = useMemo(() => deriveContactMatrixSummary(contacts), [contacts])

  if (loading) {
    return <div className="portal-page-loading">Loading contacts...</div>
  }

  return (
    <div>
      <div className="portal-page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Contacts</h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem' }}>
          Maintain your support, billing, security, and escalation contact matrix.
        </p>
      </div>

      <div className="dashboard-stats" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-value">{summary.total}</div>
          <div className="stat-card-label">Total contacts</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: summary.hasPrimary ? '#067647' : '#b54708' }}>
            {summary.hasPrimary ? 'Present' : 'Missing'}
          </div>
          <div className="stat-card-label">Primary contact</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{summary.authorizedCount}</div>
          <div className="stat-card-label">Authorized requesters</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{summary.emergencyCount}</div>
          <div className="stat-card-label">Emergency contacts</div>
        </div>
      </div>

      {message && (
        <div style={successStyle}>{message}</div>
      )}

      {error && (
        <div style={errorStyle}>{error}</div>
      )}

      <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>Add contact</h3>

        <form onSubmit={handleAddContact}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Full name *</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Role</label>
            <select value={roleType} onChange={(e) => setRoleType(e.target.value)} style={inputStyle}>
              {CONTACT_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 16 }}>
            <label style={checkLabelStyle}>
              <input type="checkbox" checked={isPrimaryContact} onChange={(e) => setIsPrimaryContact(e.target.checked)} />
              Primary contact
            </label>
            <label style={checkLabelStyle}>
              <input type="checkbox" checked={isAuthorizedRequester} onChange={(e) => setIsAuthorizedRequester(e.target.checked)} />
              Authorized requester
            </label>
            <label style={checkLabelStyle}>
              <input type="checkbox" checked={receivesBillingNotices} onChange={(e) => setReceivesBillingNotices(e.target.checked)} />
              Billing notices
            </label>
            <label style={checkLabelStyle}>
              <input type="checkbox" checked={receivesSecurityNotices} onChange={(e) => setReceivesSecurityNotices(e.target.checked)} />
              Security notices
            </label>
            <label style={checkLabelStyle}>
              <input type="checkbox" checked={receivesEmergencyNotices} onChange={(e) => setReceivesEmergencyNotices(e.target.checked)} />
              Emergency notices
            </label>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={primaryButtonStyle}
          >
            {saving ? 'Saving...' : 'Add Contact'}
          </button>
        </form>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Current contact matrix</h2>
        </div>

        {contacts.length === 0 ? (
          <div className="dashboard-empty" style={{ textAlign: 'left' }}>
            <p>No contacts added yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {contacts.map((contact) => (
              <div
                key={contact.id}
                style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontWeight: 600 }}>{contact.full_name}</div>
                <div style={{ color: 'var(--ink-muted)', fontSize: '0.84rem', marginTop: 4 }}>
                  {CONTACT_ROLE_LABELS[contact.role_type] || contact.role_type}
                  {contact.email ? ` · ${contact.email}` : ''}
                  {contact.phone ? ` · ${contact.phone}` : ''}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {contact.is_primary_contact && <span className="ticket-platform">Primary</span>}
                  {contact.is_authorized_requester && <span className="ticket-platform">Authorized requester</span>}
                  {contact.receives_billing_notices && <span className="ticket-platform">Billing notices</span>}
                  {contact.receives_security_notices && <span className="ticket-platform">Security notices</span>}
                  {contact.receives_emergency_notices && <span className="ticket-platform">Emergency notices</span>}
                </div>

                {contact.notes ? (
                  <div style={{ marginTop: 8, color: 'var(--ink-muted)', fontSize: '0.84rem' }}>
                    {contact.notes}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const cardStyle = {
  background: 'white',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 24,
  marginBottom: 20,
}

const sectionTitleStyle = {
  fontSize: '1rem',
  fontWeight: 600,
  marginBottom: 16,
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

const checkLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: '0.88rem',
  cursor: 'pointer',
}

const primaryButtonStyle = {
  marginTop: 18,
  background: 'var(--teal)',
  color: 'white',
  border: 'none',
  padding: '12px 22px',
  borderRadius: 8,
  fontWeight: 600,
  cursor: 'pointer',
}

const successStyle = {
  background: '#ecfdf5',
  border: '1px solid #a7f3d0',
  color: '#059669',
  padding: '12px 16px',
  borderRadius: 8,
  marginBottom: 16,
  fontSize: '0.88rem',
}

const errorStyle = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#b91c1c',
  padding: '12px 16px',
  borderRadius: 8,
  marginBottom: 16,
  fontSize: '0.88rem',
}
