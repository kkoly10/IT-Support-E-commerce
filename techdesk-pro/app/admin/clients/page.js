'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AdminClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      // Get all organizations
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('id, name, plan_tier, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get ticket counts per org
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, organization_id, status')

      // Get member counts per org
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, organization_id')

      const enriched = (orgs || []).map(org => {
        const orgTickets = tickets?.filter(t => t.organization_id === org.id) || []
        const orgMembers = profiles?.filter(p => p.organization_id === org.id) || []
        return {
          ...org,
          ticketCount: orgTickets.length,
          openTickets: orgTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length,
          memberCount: orgMembers.length,
        }
      })

      setClients(enriched)
    } catch (err) {
      console.error('Error loading clients:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const planColor = (plan) => {
    const colors = { starter: '#3498db', growth: '#0D7C66', scale: '#9b59b6' }
    return colors[plan] || '#8a8a8a'
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Clients</h1>
          <p className="admin-page-desc">{filtered.length} organization{filtered.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search-input"
        />
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        {loading ? (
          <div className="admin-loading" style={{ padding: 40 }}>Loading clients...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty-text" style={{ padding: 40 }}>No clients found</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Plan</th>
                  <th>Members</th>
                  <th>Total Tickets</th>
                  <th>Active Tickets</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="admin-client-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                          {client.name?.charAt(0) || '?'}
                        </div>
                        <span className="admin-table-title">{client.name}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="admin-status-badge"
                        style={{ background: planColor(client.plan_tier) + '18', color: planColor(client.plan_tier) }}
                      >
                        {client.plan_tier || 'none'}
                      </span>
                    </td>
                    <td className="admin-table-muted">{client.memberCount}</td>
                    <td className="admin-table-muted">{client.ticketCount}</td>
                    <td>
                      {client.openTickets > 0 ? (
                        <span style={{ color: '#e74c3c', fontWeight: 600 }}>{client.openTickets}</span>
                      ) : (
                        <span className="admin-table-muted">0</span>
                      )}
                    </td>
                    <td className="admin-table-muted">
                      {new Date(client.created_at).toLocaleDateString()}
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