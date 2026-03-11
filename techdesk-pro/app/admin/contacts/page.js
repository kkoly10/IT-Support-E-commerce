'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { CONTACT_ROLE_LABELS, deriveContactMatrixSummary } from '../../../lib/contacts'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AdminContactsPage() {
  const [loading, setLoading] = useState(true)
  const [contacts, setContacts] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    loadContacts()
  }, [])

  async function loadContacts() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('organization_contacts')
        .select(`
          *,
          organization:organizations(id, name, client_status, onboarding_status)
        `)
        .order('created_at', { ascending: false })

      setContacts(data || [])
    } catch (err) {
      console.error('Admin contacts load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return contacts.filter((contact) => {
      if (roleFilter !== 'all' && contact.role_type !== roleFilter) return false
      if (!q) return true

      const blob = [
        contact.full_name,
        contact.email,
        contact.phone,
        contact.role_type,
        contact.organization?.name,
      ]
        .join(' ')
        .toLowerCase()

      return blob.includes(q)
    })
  }, [contacts, search, roleFilter])

  const grouped = useMemo(() => {
    const map = new Map()

    for (const contact of contacts) {
      const orgId = contact.organization?.id || 'unknown'
      if (!map.has(orgId)) {
        map.set(orgId, {
          organization: contact.organization,
          contacts: [],
        })
      }
      map.get(orgId).contacts.push(contact)
    }

    return Array.from(map.values())
  }, [contacts])

  if (loading) {
    return <div className="admin-loading">Loading contacts...</div>
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Contacts</h1>
          <p className="admin-page-desc">
            Review client contact matrices, authorized requesters, and escalation coverage.
          </p>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 18 }}>
        <div className="admin-filters" style={{ marginTop: 0 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, contact, email, or phone..."
            className="admin-search-input"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="admin-filter-select"
          >
            <option value="all">All roles</option>
            <option value="primary">Primary</option>
            <option value="billing">Billing</option>
            <option value="security">Security</option>
            <option value="emergency">Emergency</option>
            <option value="authorized_requester">Authorized requester</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty-text">No contacts found.</div>
        </div>
      ) : (
        grouped.map((group) => {
          const summary = deriveContactMatrixSummary(group.contacts)
          const visibleContacts = group.contacts.filter((contact) => {
            if (roleFilter !== 'all' && contact.role_type !== roleFilter) return false
            if (!search.trim()) return true

            const blob = [
              contact.full_name,
              contact.email,
              contact.phone,
              contact.role_type,
              group.organization?.name,
            ]
              .join(' ')
              .toLowerCase()

            return blob.includes(search.trim().toLowerCase())
          })

          if (visibleContacts.length === 0) return null

          return (
            <div key={group.organization?.id || Math.random()} className="admin-card" style={{ marginBottom: 20 }}>
              <div className="admin-card-header">
                <h3>{group.organization?.name || 'Unknown organization'}</h3>
                <a href="/admin/onboarding" className="admin-btn-small">
                  Open onboarding
                </a>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                <span className="admin-status-badge" style={{ background: '#eef4ff', color: '#1d4ed8' }}>
                  {group.organization?.client_status || '—'}
                </span>
                <span className="admin-status-badge" style={{ background: '#f3f4f6', color: '#4b5563' }}>
                  onboarding {group.organization?.onboarding_status || '—'}
                </span>
                <span className="admin-status-badge" style={{ background: summary.hasPrimary ? '#ecfdf3' : '#fffaeb', color: summary.hasPrimary ? '#067647' : '#b54708' }}>
                  primary {summary.hasPrimary ? 'set' : 'missing'}
                </span>
                <span className="admin-status-badge" style={{ background: '#f3f4f6', color: '#4b5563' }}>
                  authorized {summary.authorizedCount}
                </span>
                <span className="admin-status-badge" style={{ background: '#f3f4f6', color: '#4b5563' }}>
                  emergency {summary.emergencyCount}
                </span>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {visibleContacts.map((contact) => (
                  <div
                    key={contact.id}
                    style={{
                      background: '#fafaf8',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{contact.full_name}</div>
                    <div className="admin-table-sub">
                      {CONTACT_ROLE_LABELS[contact.role_type] || contact.role_type}
                      {contact.email ? ` · ${contact.email}` : ''}
                      {contact.phone ? ` · ${contact.phone}` : ''}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {contact.is_primary_contact && (
                        <span className="admin-status-badge" style={{ background: '#ecfdf3', color: '#067647' }}>
                          Primary
                        </span>
                      )}
                      {contact.is_authorized_requester && (
                        <span className="admin-status-badge" style={{ background: '#eef4ff', color: '#1d4ed8' }}>
                          Authorized requester
                        </span>
                      )}
                      {contact.receives_billing_notices && (
                        <span className="admin-status-badge" style={{ background: '#f3f4f6', color: '#4b5563' }}>
                          Billing
                        </span>
                      )}
                      {contact.receives_security_notices && (
                        <span className="admin-status-badge" style={{ background: '#fff7ed', color: '#9a3412' }}>
                          Security
                        </span>
                      )}
                      {contact.receives_emergency_notices && (
                        <span className="admin-status-badge" style={{ background: '#fef3f2', color: '#b42318' }}>
                          Emergency
                        </span>
                      )}
                    </div>

                    {contact.notes ? (
                      <div className="admin-table-muted" style={{ marginTop: 8 }}>
                        {contact.notes}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
