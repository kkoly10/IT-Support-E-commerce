// File: app/signup/page.js (replace existing)

'use client'
import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // 2. Create organization with lead fields
    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: companyName,
        slug: slug + '-' + Date.now().toString(36),
        plan: 'starter',
        monthly_ticket_limit: 10,
        client_status: 'lead',
        lead_interest: leadInterest || null,
        primary_service: leadInterest === 'ecommerce' ? 'ecommerce' : leadInterest === 'automation' ? 'automation' : 'it',
        service_types: leadInterest === 'ecommerce' ? ['ecommerce'] : leadInterest === 'automation' ? ['automation'] : ['it'],
        team_size: teamSize ? parseInt(teamSize) : null,
        industry: industry || null,
        needs_human_review: (parseInt(teamSize) > 15 || leadInterest === 'multiple' || leadInterest === 'not_sure'),
        agreement_status: 'none',
        payment_status: 'none',
        onboarding_status: 'not_started',
        notes: painPoints || null,
      })
      .select()
      .single()

    if (orgError) {
      setError('Account created but setup failed: ' + orgError.message)
      setLoading(false)
      return
    }

    // 3. Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
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
            <p>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem', marginTop: 12 }}>
              Our team will review your information and reach out about next steps.
            </p>
          </div>
          <div className="auth-footer">
            <a href="/login">Go to login →</a>
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
            <div className="logo-mark" style={{ width: 34, height: 34, borderRadius: 9 }}>T</div>
            <span>TechDesk Pro</span>
          </a>
          <h1>{step === 1 ? 'Create your account' : 'Tell us about your business'}</h1>
          <p>{step === 1 ? 'Get started with a free assessment' : 'This helps us recommend the right support path'}</p>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                width: s === step ? 32 : 12, height: 6, borderRadius: 100,
                background: s <= step ? 'var(--teal)' : 'var(--border)',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
        </div>

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2) } : handleSignup} className="auth-form">
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
                <label htmlFor="leadInterest">What are you most interested in?</label>
                <select
                  id="leadInterest"
                  value={leadInterest}
                  onChange={(e) => setLeadInterest(e.target.value)}
                  required
                >
                  <option value="">Select one</option>
                  <option value="it_support">IT helpdesk & support</option>
                  <option value="cloud_saas">Cloud & SaaS management</option>
                  <option value="ecommerce">E-commerce support & integrations</option>
                  <option value="automation">Workflow automation</option>
                  <option value="multiple">Multiple services</option>
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
                    placeholder="e.g. Retail, Legal"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="painPoints">What&apos;s your biggest tech challenge right now? (optional)</label>
                <textarea
                  id="painPoints"
                  value={painPoints}
                  onChange={(e) => setPainPoints(e.target.value)}
                  placeholder="e.g. We don't have anyone to handle IT issues, our cloud setup is a mess, we need help with our Shopify store..."
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1, padding: 14, border: '1.5px solid var(--border)',
                    borderRadius: 10, background: 'white', fontSize: '0.92rem',
                    fontWeight: 500, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
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
                This creates a portal account. Final service scope, pricing, and terms are determined
                through an assessment conversation, not by this signup form.
              </p>
            </>
          )}
        </form>

        <div className="auth-footer">
          <p>Already have an account? <a href="/login">Sign in</a></p>
          <a href="/" className="auth-back">← Back to website</a>
        </div>
      </div>
    </div>
  )
}