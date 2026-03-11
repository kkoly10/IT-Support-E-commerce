'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

const supabase = createClient()

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ')
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileId, setProfileId] = useState(null)
  const [orgId, setOrgId] = useState(null)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [industry, setIndustry] = useState('')
  const [environmentSummary, setEnvironmentSummary] = useState('')
  const [supportedPlatforms, setSupportedPlatforms] = useState('')
  const [supportHoursNote, setSupportHoursNote] = useState('')
  const [leadInterest, setLeadInterest] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
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
        .select('id, full_name, email, organization_id, organizations(*)')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      const org = profileData.organizations || {}

      setProfileId(profileData.id)
      setOrgId(profileData.organization_id)
      setFullName(profileData.full_name || '')
      setEmail(profileData.email || '')
      setCompanyName(org.name || '')
      setTeamSize(org.team_size || '')
      setIndustry(org.industry || '')
      setEnvironmentSummary(org.environment_summary || '')
      setSupportedPlatforms(parseList(org.supported_platforms))
      setSupportHoursNote(org.support_hours_note || '')
      setLeadInterest(org.lead_interest || '')
    } catch (err) {
      console.error('Settings load error:', err)
      setError(err.message || 'Failed to load settings.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!profileId || !orgId) return

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
        })
        .eq('id', profileId)

      if (profileError) throw profileError

      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          name: companyName.trim() || null,
          team_size: teamSize ? Number(teamSize) : null,
          industry: industry.trim() || null,
          environment_summary: environmentSummary.trim() || null,
          supported_platforms: supportedPlatforms
            ? supportedPlatforms.split(',').map((item) => item.trim()).filter(Boolean)
            : [],
          support_hours_note: supportHoursNote.trim() || null,
          lead_interest: leadInterest.trim() || null,
        })
        .eq('id', orgId)

      if (orgError) throw orgError

      setMessage('Settings updated successfully.')
    } catch (err) {
      console.error('Settings save error:', err)
      setError(err.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="portal-page-loading">Loading settings...</div>
  }

  return (
    <div>
      <div className="portal-page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Settings</h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem' }}>
          Manage your company details, support contact info, and environment profile.
        </p>
      </div>

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

      <form onSubmit={handleSave}>
        <div
          style={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Primary contact</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email</label>
              <input value={email} disabled style={{ ...inputStyle, background: '#f9fafb' }} />
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Company profile</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Company name</label>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Team size</label>
              <input
                type="number"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Industry</label>
              <input value={industry} onChange={(e) => setIndustry(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Primary service interest</label>
              <input
                value={leadInterest}
                onChange={(e) => setLeadInterest(e.target.value)}
                placeholder="Remote IT support, Microsoft 365 admin, onboarding support"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Environment details</h3>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Environment summary</label>
            <textarea
              rows={4}
              value={environmentSummary}
              onChange={(e) => setEnvironmentSummary(e.target.value)}
              placeholder="Describe your current business systems, users, locations, devices, and key tools."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Supported platforms</label>
            <input
              value={supportedPlatforms}
              onChange={(e) => setSupportedPlatforms(e.target.value)}
              placeholder="Microsoft 365, Google Workspace, Slack, Zoom"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>Support hours note</label>
            <input
              value={supportHoursNote}
              onChange={(e) => setSupportHoursNote(e.target.value)}
              placeholder="Example: Main staff works Monday-Friday 8 AM to 5 PM ET"
              style={inputStyle}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="portal-btn-primary"
          style={{
            background: 'var(--teal)',
            color: 'white',
            border: 'none',
            padding: '12px 22px',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
            opacity: saving ? 0.65 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
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