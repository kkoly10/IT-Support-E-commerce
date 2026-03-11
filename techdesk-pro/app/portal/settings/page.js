'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'

const supabase = createClient()

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ')
}

function toArray(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function isDiscoveryComplete(profile) {
  return Boolean(
    profile.email_platform &&
      profile.identity_provider &&
      profile.remote_work_model &&
      profile.core_business_apps &&
      profile.backup_status &&
      profile.urgent_systems
  )
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

  const [userCount, setUserCount] = useState('')
  const [deviceCount, setDeviceCount] = useState('')
  const [locationCount, setLocationCount] = useState('')
  const [emailPlatform, setEmailPlatform] = useState('')
  const [identityProvider, setIdentityProvider] = useState('')
  const [remoteWorkModel, setRemoteWorkModel] = useState('')
  const [coreBusinessApps, setCoreBusinessApps] = useState('')
  const [keyVendors, setKeyVendors] = useState('')
  const [backupStatus, setBackupStatus] = useState('')
  const [securityRequirements, setSecurityRequirements] = useState('')
  const [complianceRequirements, setComplianceRequirements] = useState('')
  const [urgentSystems, setUrgentSystems] = useState('')
  const [discoveryNotes, setDiscoveryNotes] = useState('')
  const [currentDiscoveryCompleted, setCurrentDiscoveryCompleted] = useState(false)
  const [currentDiscoveryReviewStatus, setCurrentDiscoveryReviewStatus] = useState('not_started')

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
      const discovery = org.discovery_profile || {}

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

      setUserCount(discovery.user_count || '')
      setDeviceCount(discovery.device_count || '')
      setLocationCount(discovery.location_count || '')
      setEmailPlatform(discovery.email_platform || '')
      setIdentityProvider(discovery.identity_provider || '')
      setRemoteWorkModel(discovery.remote_work_model || '')
      setCoreBusinessApps(parseList(discovery.core_business_apps))
      setKeyVendors(parseList(discovery.key_vendors))
      setBackupStatus(discovery.backup_status || '')
      setSecurityRequirements(discovery.security_requirements || '')
      setComplianceRequirements(discovery.compliance_requirements || '')
      setUrgentSystems(parseList(discovery.urgent_systems))
      setDiscoveryNotes(discovery.notes || '')
      setCurrentDiscoveryCompleted(!!org.discovery_completed)
      setCurrentDiscoveryReviewStatus(org.discovery_review_status || 'not_started')
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
      const discoveryProfile = {
        user_count: userCount.trim() || null,
        device_count: deviceCount.trim() || null,
        location_count: locationCount.trim() || null,
        email_platform: emailPlatform.trim() || null,
        identity_provider: identityProvider.trim() || null,
        remote_work_model: remoteWorkModel.trim() || null,
        core_business_apps: toArray(coreBusinessApps),
        key_vendors: toArray(keyVendors),
        backup_status: backupStatus.trim() || null,
        security_requirements: securityRequirements.trim() || null,
        compliance_requirements: complianceRequirements.trim() || null,
        urgent_systems: toArray(urgentSystems),
        notes: discoveryNotes.trim() || null,
      }

      const discoveryCompleted = isDiscoveryComplete(discoveryProfile)

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
          discovery_profile: discoveryProfile,
          discovery_completed: discoveryCompleted,
          discovery_review_status: discoveryCompleted ? 'pending_review' : 'not_started',
        })
        .eq('id', orgId)

      if (orgError) throw orgError

      setCurrentDiscoveryCompleted(discoveryCompleted)
      setCurrentDiscoveryReviewStatus(discoveryCompleted ? 'pending_review' : 'not_started')
      setMessage('Settings and discovery questionnaire updated successfully.')
    } catch (err) {
      console.error('Settings save error:', err)
      setError(err.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const discoveryCompletionLabel = useMemo(() => {
    if (currentDiscoveryReviewStatus === 'reviewed') return 'Reviewed by Kocre IT'
    if (currentDiscoveryCompleted) return 'Submitted for review'
    return 'Incomplete'
  }, [currentDiscoveryCompleted, currentDiscoveryReviewStatus])

  if (loading) {
    return <div className="portal-page-loading">Loading settings...</div>
  }

  return (
    <div>
      <div className="portal-page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Settings</h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem' }}>
          Manage your company details, primary support contact, and structured discovery profile.
        </p>
      </div>

      <div className="dashboard-stats" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-card-label">Discovery status</div>
          <div
            className="stat-card-value"
            style={{
              fontSize: '1.05rem',
              color:
                currentDiscoveryReviewStatus === 'reviewed'
                  ? '#067647'
                  : currentDiscoveryCompleted
                  ? '#1d4ed8'
                  : '#b54708',
            }}
          >
            {discoveryCompletionLabel}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Environment profile</div>
          <div className="stat-card-value" style={{ fontSize: '1.05rem' }}>
            {environmentSummary ? 'Present' : 'Missing'}
          </div>
        </div>
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
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>
            Discovery questionnaire
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Approx. users</label>
              <input value={userCount} onChange={(e) => setUserCount(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Approx. devices</label>
              <input value={deviceCount} onChange={(e) => setDeviceCount(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Locations</label>
              <input value={locationCount} onChange={(e) => setLocationCount(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email platform *</label>
              <input
                value={emailPlatform}
                onChange={(e) => setEmailPlatform(e.target.value)}
                placeholder="Microsoft 365, Google Workspace"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Identity provider *</label>
              <input
                value={identityProvider}
                onChange={(e) => setIdentityProvider(e.target.value)}
                placeholder="Microsoft Entra ID, Google, Okta"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Remote work model *</label>
              <input
                value={remoteWorkModel}
                onChange={(e) => setRemoteWorkModel(e.target.value)}
                placeholder="Office-based, hybrid, remote-first"
                style={inputStyle}
              />
            </div>
          </div>

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

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Core business apps *</label>
            <input
              value={coreBusinessApps}
              onChange={(e) => setCoreBusinessApps(e.target.value)}
              placeholder="QuickBooks, Clio, Salesforce, Slack"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Key vendors</label>
            <input
              value={keyVendors}
              onChange={(e) => setKeyVendors(e.target.value)}
              placeholder="ISP, phone provider, MSP, software vendors"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Backup status *</label>
            <input
              value={backupStatus}
              onChange={(e) => setBackupStatus(e.target.value)}
              placeholder="Managed backup, unknown, local-only, vendor-managed"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Urgent systems *</label>
            <input
              value={urgentSystems}
              onChange={(e) => setUrgentSystems(e.target.value)}
              placeholder="Email, file shares, EHR, accounting app"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Security requirements</label>
            <textarea
              rows={3}
              value={securityRequirements}
              onChange={(e) => setSecurityRequirements(e.target.value)}
              placeholder="MFA expectations, admin restrictions, security tools, incident process"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Compliance requirements</label>
            <textarea
              rows={3}
              value={complianceRequirements}
              onChange={(e) => setComplianceRequirements(e.target.value)}
              placeholder="HIPAA, SOC 2, legal hold, internal policy"
              style={{ ...inputStyle, resize: 'vertical' }}
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

          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>Discovery notes</label>
            <textarea
              rows={3}
              value={discoveryNotes}
              onChange={(e) => setDiscoveryNotes(e.target.value)}
              placeholder="Anything else Kocre IT should know during onboarding"
              style={{ ...inputStyle, resize: 'vertical' }}
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