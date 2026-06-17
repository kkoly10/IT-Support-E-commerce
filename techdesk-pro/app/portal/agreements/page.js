'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { AGREEMENT_DOCUMENTS, REQUIRED_AGREEMENT_KEYS, isDraftVersion } from '../../../lib/agreements'
import { canSignAgreements } from '../../../lib/contacts'

const supabase = createClient()

function formatWhen(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function PortalAgreementsPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [primaryContacts, setPrimaryContacts] = useState([])
  const [signatures, setSignatures] = useState([])
  const [activeKey, setActiveKey] = useState(null)
  const [typedName, setTypedName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('id', user.id)
        .maybeSingle()

      if (!profileData) {
        setLoading(false)
        return
      }

      setProfile(profileData)
      setTypedName(profileData?.full_name || '')

      if (profileData?.organization_id) {
        const [{ data: sigs }, { data: primaries }] = await Promise.all([
          supabase
            .from('agreement_signatures')
            .select('*')
            .eq('organization_id', profileData.organization_id)
            .order('signed_at', { ascending: false }),
          supabase
            .from('organization_contacts')
            .select('email, is_primary_contact')
            .eq('organization_id', profileData.organization_id)
            .eq('is_primary_contact', true),
        ])
        setSignatures(sigs || [])
        setPrimaryContacts(primaries || [])
      }
    } catch (err) {
      console.error('Agreements load error:', err)
    } finally {
      setLoading(false)
    }
  }

  function signatureFor(key) {
    const doc = AGREEMENT_DOCUMENTS[key]
    return signatures.find((s) => s.document_type === key && s.document_version === doc.version) || null
  }

  function openDoc(key) {
    setActiveKey(key)
    setAgreed(false)
    setError(null)
    setTypedName(profile?.full_name || typedName || '')
  }

  async function handleSign() {
    if (!activeKey) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/agreements/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentKey: activeKey, signerName: typedName }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to record signature.')
      setActiveKey(null)
      setAgreed(false)
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="portal-page-loading">Loading agreements...</div>
  }

  const activeDoc = activeKey ? AGREEMENT_DOCUMENTS[activeKey] : null
  const signedCount = REQUIRED_AGREEMENT_KEYS.filter((k) => signatureFor(k)).length
  const allSigned = signedCount === REQUIRED_AGREEMENT_KEYS.length
  const canSign = canSignAgreements(profile, primaryContacts)

  return (
    <div>
      <div className="portal-page-header" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Agreements</h1>
        <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem' }}>
          Review and sign the agreements that govern your service. Your signature is recorded with a
          timestamp for both of our records.
        </p>
      </div>

      <div
        className="dashboard-section"
        style={{
          marginBottom: 20,
          background: allSigned ? '#f0fdf4' : '#fffbeb',
          border: `1px solid ${allSigned ? '#bbf7d0' : '#fde68a'}`,
        }}
      >
        <div style={{ fontWeight: 600, color: allSigned ? '#067647' : '#92400e' }}>
          {allSigned
            ? 'All required agreements signed.'
            : `${signedCount} of ${REQUIRED_AGREEMENT_KEYS.length} required agreements signed.`}
        </div>
        <div style={{ marginTop: 6, color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
          Signing the Master Services Agreement and the Data Processing Agreement is part of
          onboarding before support goes live.
        </div>
      </div>

      {!canSign ? (
        <div
          className="dashboard-section"
          style={{ marginBottom: 20, background: '#f8fafc', border: '1px solid var(--border)' }}
        >
          <div style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
            You can review these agreements, but only your organization’s primary contact can sign
            them on the company’s behalf.
          </div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 14 }}>
        {REQUIRED_AGREEMENT_KEYS.map((key) => {
          const doc = AGREEMENT_DOCUMENTS[key]
          const sig = signatureFor(key)
          return (
            <div
              key={key}
              className="dashboard-section"
              style={{ marginBottom: 0, display: 'grid', gap: 10 }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '1.02rem' }}>
                    {doc.title}{' '}
                    <span style={{ color: 'var(--ink-muted)', fontWeight: 400, fontSize: '0.82rem' }}>
                      v{doc.version}
                    </span>
                  </div>
                  <div style={{ marginTop: 4, color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
                    {doc.summary}
                  </div>
                </div>
                <span
                  className="ticket-platform"
                  style={{
                    background: sig ? '#dcfce7' : '#fef3c7',
                    color: sig ? '#067647' : '#92400e',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sig ? 'Signed' : 'Not signed'}
                </span>
              </div>

              {sig ? (
                <div style={{ color: 'var(--ink-muted)', fontSize: '0.85rem' }}>
                  Signed by <strong>{sig.signer_name}</strong> on {formatWhen(sig.signed_at)}
                  {sig.ip_address ? ` · IP ${sig.ip_address}` : ''}
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => openDoc(key)}
                  className="action-card"
                  style={{ display: 'inline-flex', width: 'auto', padding: '8px 14px', cursor: 'pointer' }}
                >
                  {sig ? 'View agreement' : 'Review & sign'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {activeDoc ? (
        <div
          onClick={() => !submitting && setActiveKey(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 16,
              maxWidth: 760,
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--ink)' }}>
                {activeDoc.title}
              </div>
              <div style={{ color: 'var(--ink-muted)', fontSize: '0.82rem', marginTop: 2 }}>
                Version {activeDoc.version} · Effective {activeDoc.effectiveDate}
              </div>
            </div>

            {isDraftVersion(activeDoc.version) ? (
              <div
                style={{
                  background: '#fff7ed',
                  borderBottom: '1px solid #fed7aa',
                  color: '#9a3412',
                  padding: '10px 24px',
                  fontSize: '0.82rem',
                }}
              >
                Draft pending final legal review — not a binding executed agreement until finalized.
              </div>
            ) : null}

            <div
              style={{
                padding: '20px 24px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontSize: '0.86rem',
                lineHeight: 1.7,
                color: 'var(--ink-light)',
                flex: 1,
              }}
            >
              {activeDoc.body}
            </div>

            <div style={{ padding: '18px 24px', borderTop: '1px solid var(--border)', background: '#fafaf8' }}>
              {signatureFor(activeKey) ? (
                <div style={{ color: '#067647', fontSize: '0.88rem', fontWeight: 500 }}>
                  Signed by {signatureFor(activeKey).signer_name} on{' '}
                  {formatWhen(signatureFor(activeKey).signed_at)}.
                </div>
              ) : !canSign ? (
                <div style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
                  Only your organization’s primary contact can sign this agreement.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  <label style={{ display: 'grid', gap: 6 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)' }}>
                      Type your full legal name to sign
                    </span>
                    <input
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder="Full legal name"
                      style={{
                        padding: '10px 12px',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: '0.95rem',
                        fontFamily: "'Source Serif 4', serif",
                      }}
                    />
                  </label>

                  <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.85rem', color: 'var(--ink-light)' }}>
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      style={{ marginTop: 3 }}
                    />
                    <span>
                      I have read and agree, on behalf of my organization, to be bound by the{' '}
                      {activeDoc.title} (version {activeDoc.version}).
                    </span>
                  </label>

                  {error ? (
                    <div style={{ color: '#b42318', fontSize: '0.85rem' }}>{error}</div>
                  ) : null}

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setActiveKey(null)}
                      disabled={submitting}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSign}
                      disabled={submitting || !agreed || typedName.trim().length < 2}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 8,
                        border: 'none',
                        background: submitting || !agreed || typedName.trim().length < 2 ? '#9ca3af' : 'var(--teal)',
                        color: 'white',
                        fontWeight: 600,
                        cursor: submitting || !agreed || typedName.trim().length < 2 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {submitting ? 'Recording…' : 'Sign & accept'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
