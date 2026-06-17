'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import BrandMark from '../components/BrandMark'

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [industry, setIndustry] = useState('')
  const [leadInterest, setLeadInterest] = useState('')
  const [painPoints, setPainPoints] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [assessmentId, setAssessmentId] = useState('')
  // Set when the visitor is already signed in but has no profile yet
  // (auth account exists, workspace setup never completed).
  const [sessionUser, setSessionUser] = useState(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const seedName = params.get('name')
    const seedEmail = params.get('email')
    const seedCompany = params.get('company')
    const seedAssessment = params.get('assessment')

    if (seedName) setFullName(seedName)
    if (seedEmail) setEmail(seedEmail)
    if (seedCompany) setCompanyName(seedCompany)
    if (seedAssessment) setAssessmentId(seedAssessment)

    // Middleware only lets signed-in users reach /signup when they have no
    // profile — pick up that session so submit completes the existing
    // account instead of trying to register the email again.
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setSessionUser(data.user)
        setEmail(data.user.email || '')
        const metaName = data.user.user_metadata?.full_name
        if (metaName) setFullName((prev) => prev || metaName)
      }
    })
  }, [])

  const introTitle = useMemo(() => {
    if (sessionUser) return 'Finish setting up your account'
    return assessmentId ? 'Continue from your assessment' : 'Create your account'
  }, [assessmentId, sessionUser])

  const introDesc = useMemo(() => {
    return assessmentId
      ? 'Reserve your onboarding workspace so Kocre IT can connect your assessment, signup, and onboarding flow.'
      : 'Get started with Kocre IT remote support intake.'
  }, [assessmentId])

  async function handleSignup(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const trimmedFullName = fullName.trim()
    const trimmedCompanyName = companyName.trim()
    const trimmedIndustry = industry.trim()
    const trimmedPainPoints = painPoints.trim()

    let userId
    let hasSession = false

    if (sessionUser) {
      // Already signed in (account exists, workspace setup never finished) —
      // skip registration and go straight to workspace creation.
      userId = sessionUser.id
      hasSession = true
    } else {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: trimmedFullName,
            company_name: trimmedCompanyName,
          },
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      userId = authData?.user?.id
      hasSession = Boolean(authData?.session)

      if (!userId) {
        setError('Account created but user ID was not returned. Please try signing in.')
        setLoading(false)
        return
      }
    }

    // Org + profile creation runs server-side so `role` is hardcoded by the
    // service-role client and the browser can't elevate to 'admin'.
    const completeRes = await fetch('/api/signup/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        email: sessionUser?.email || email,
        fullName: trimmedFullName,
        companyName: trimmedCompanyName,
        teamSize,
        industry: trimmedIndustry,
        leadInterest,
        painPoints: trimmedPainPoints,
        assessmentId: assessmentId || null,
      }),
    })

    const completeData = await completeRes.json().catch(() => ({}))
    if (!completeRes.ok) {
      setError(completeData?.error || 'Account created but workspace setup failed.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    if (hasSession) {
      router.push('/portal/dashboard')
      router.refresh()
    }
  }

  if (success && !sessionUser) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: 560 }}>
          <div className="auth-header">
            <div className="auth-success-icon">✓</div>
            <h1>Check your email</h1>
            <p>
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
            </p>

            <div
              style={{
                marginTop: 16,
                padding: '14px 16px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: '#fafaf8',
                textAlign: 'left',
                fontSize: '0.9rem',
                color: 'var(--ink-muted)',
                lineHeight: 1.7,
              }}
            >
              <div>
                <strong style={{ color: 'var(--ink)' }}>What happens next</strong>
              </div>
              <div style={{ marginTop: 8 }}>
                Your workspace has been created in lead status so Kocre IT can connect your assessment,
                onboarding checklist, and support-readiness review before activation.
              </div>
              {assessmentId ? (
                <div style={{ marginTop: 8 }}>
                  Assessment reference linked: <strong style={{ color: 'var(--ink)' }}>{assessmentId}</strong>
                </div>
              ) : null}
            </div>
          </div>

          <div className="auth-footer">
            <Link href="/login">Go to login →</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: step === 2 ? 560 : 460 }}>
        <div className="auth-header">
          <a href="/" className="auth-logo">
            <div className="logo-mark" style={{ width: 34, height: 34, borderRadius: 9 }}>
              <BrandMark />
            </div>
            <span>Kocre IT Services</span>
          </a>

          <h1>{step === 1 ? introTitle : 'Tell us about your support needs'}</h1>
          <p>
            {step === 1
              ? introDesc
              : 'This helps us qualify the right onboarding and support path for your business.'}
          </p>

          {assessmentId ? (
            <div
              style={{
                marginTop: 14,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 999,
                background: '#eef4ff',
                color: '#1d4ed8',
                fontSize: '0.82rem',
                fontWeight: 700,
              }}
            >
              Assessment linked: {assessmentId}
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
            {[1, 2].map((s) => (
              <div
                key={s}
                style={{
                  width: s === step ? 32 : 12,
                  height: 6,
                  borderRadius: 100,
                  background: s <= step ? 'var(--teal)' : 'var(--border)',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
        </div>

        <form
          onSubmit={
            step === 1
              ? (e) => {
                  e.preventDefault()
                  setStep(2)
                }
              : handleSignup
          }
          className="auth-form"
        >
          {error && <div className="auth-error">{error}</div>}

          {step === 1 && (
            <>
              <div className="form-group">
                <label htmlFor="fullName">Full name</label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="companyName">Company name</label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Your company name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Work email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  disabled={Boolean(sessionUser)}
                  required
                />
              </div>

              {!sessionUser && (
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    minLength={6}
                    required
                  />
                </div>
              )}

              <button type="submit" className="auth-submit">
                Continue →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="form-group">
                <label htmlFor="leadInterest">What best describes your need?</label>
                <select
                  id="leadInterest"
                  value={leadInterest}
                  onChange={(e) => setLeadInterest(e.target.value)}
                  required
                >
                  <option value="">Select one</option>
                  <option value="it_helpdesk">Remote IT helpdesk & support</option>
                  <option value="it_cloud_admin">Cloud & SaaS administration</option>
                  <option value="it_managed_devices">Managed Windows device support</option>
                  <option value="it_general">General technical support</option>
                  <option value="not_sure">Not sure — I need guidance</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label htmlFor="teamSize">Team size</label>
                  <select
                    id="teamSize"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="1">Just me</option>
                    <option value="3">2-5 people</option>
                    <option value="10">6-15 people</option>
                    <option value="25">16-50 people</option>
                    <option value="75">50+ people</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="industry">Industry (optional)</label>
                  <input
                    id="industry"
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Legal, Retail"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="painPoints">Biggest support challenge right now (optional)</label>
                <textarea
                  id="painPoints"
                  value={painPoints}
                  onChange={(e) => setPainPoints(e.target.value)}
                  placeholder="What is causing the most recurring support friction today?"
                  rows={3}
                />
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: '#fafaf8',
                  border: '1px solid var(--border)',
                  fontSize: '0.84rem',
                  color: 'var(--ink-muted)',
                  lineHeight: 1.7,
                  marginBottom: 6,
                }}
              >
                This signup reserves your Kocre IT workspace. Final support scope, onboarding sequence,
                and activation are confirmed through review — not by signup alone.
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1,
                    padding: 14,
                    border: '1.5px solid var(--border)',
                    borderRadius: 10,
                    background: 'white',
                    fontSize: '0.92rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'Inter Tight, sans-serif',
                    color: 'var(--ink-muted)',
                  }}
                >
                  ← Back
                </button>

                <button type="submit" className="auth-submit" disabled={loading} style={{ flex: 2 }}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
            </>
          )}
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
          <a href="/" className="auth-back">
            ← Back to website
          </a>
        </div>
      </div>
    </div>
  )
}