'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'

function getLeadConfig(teamSize, leadInterest) {
  const parsedTeamSize = teamSize ? parseInt(teamSize, 10) : null
  const needsReview = (parsedTeamSize !== null && parsedTeamSize > 15) || leadInterest === 'not_sure'

  return {
    primary_service: 'it',
    service_types: ['it'],
    needs_human_review: needsReview,
  }
}

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

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const seedName = params.get('name')
    const seedEmail = params.get('email')
    const seedCompany = params.get('company')

    if (seedName) setFullName(seedName)
    if (seedEmail) setEmail(seedEmail)
    if (seedCompany) setCompanyName(seedCompany)
  }, [])

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const trimmedFullName = fullName.trim()
    const trimmedCompanyName = companyName.trim()
    const trimmedIndustry = industry.trim()
    const trimmedPainPoints = painPoints.trim()

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

    const slug = trimmedCompanyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const leadConfig = getLeadConfig(teamSize, leadInterest)

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: trimmedCompanyName,
        slug: slug + '-' + Date.now().toString(36),
        plan: 'starter',
        monthly_ticket_limit: 10,
        client_status: 'lead',
        lead_interest: leadInterest || 'it',
        primary_service: leadConfig.primary_service,
        service_types: leadConfig.service_types,
        team_size: teamSize ? parseInt(teamSize, 10) : null,
        industry: trimmedIndustry || null,
        needs_human_review: leadConfig.needs_human_review,
        agreement_status: 'none',
        payment_status: 'none',
        onboarding_status: 'not_started',
        notes: trimmedPainPoints || null,
      })
      .select()
      .single()

    if (orgError) {
      setError('Account created but organization setup failed: ' + orgError.message)
      setLoading(false)
      return
    }

    const userId = authData?.user?.id

    if (!userId) {
      setError('Account created but user ID was not returned. Please try signing in.')
      setLoading(false)
      return
    }


    if (assessmentId) {
      await fetch('/api/assessment/link-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId, organizationId: org.id }),
      }).catch((err) => {
        console.error('Failed to link assessment to organization:', err)
      })
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: trimmedFullName,
        organization_id: org.id,
        role: 'client',
        is_primary_contact: true,
      })

    if (profileError) {
      setError('Account created but profile setup failed: ' + profileError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    if (authData.session) {
      router.push('/portal/dashboard')
      router.refresh()
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-success-icon">✓</div>
            <h1>Check your email</h1>
            <p>
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
            </p>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem', marginTop: 12 }}>
              Your account has been created in lead status for TechDesk Pro&apos;s remote support intake.
              We&apos;ll use your information to guide onboarding and next steps.
            </p>
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
      <div className="auth-card" style={{ maxWidth: step === 2 ? 520 : 440 }}>
        <div className="auth-header">
          <a href="/" className="auth-logo">
            <div className="logo-mark" style={{ width: 34, height: 34, borderRadius: 9 }}>
              T
            </div>
            <span>TechDesk Pro</span>
          </a>

          <h1>{step === 1 ? 'Create your account' : 'Tell us about your support needs'}</h1>
          <p>
            {step === 1
              ? 'Get started with remote IT support intake'
              : 'This helps us qualify your business for remote IT and cloud support'}
          </p>

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
          onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2) } : handleSignup}
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
                  required
                />
              </div>

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
                  <option value="it">Remote IT helpdesk & support</option>
                  <option value="it">Cloud & SaaS administration</option>
                  <option value="it">General technical support</option>
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
                <label htmlFor="painPoints">What&apos;s your biggest support challenge right now? (optional)</label>
                <textarea
                  id="painPoints"
                  value={painPoints}
                  onChange={(e) => setPainPoints(e.target.value)}
                  placeholder="e.g. We need help handling remote IT issues, user account problems, Microsoft 365 or Google Workspace admin tasks, and routine technical support."
                  rows={3}
                />
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
                    fontFamily: 'Outfit, sans-serif',
                    color: 'var(--ink-muted)',
                  }}
                >
                  ← Back
                </button>

                <button type="submit" className="auth-submit" disabled={loading} style={{ flex: 2 }}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', textAlign: 'center', marginTop: 8, lineHeight: 1.6 }}>
                This creates a TechDesk Pro portal account in lead status. Final support scope, onboarding,
                and service terms are determined through review and onboarding — not by this signup form alone.
              </p>
            </>
          )}
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
          <a href="/" className="auth-back">← Back to website</a>
        </div>
      </div>
    </div>
  )
}