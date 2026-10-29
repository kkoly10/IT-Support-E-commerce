'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import { SERVICE_CATALOG, calculateEstimate, formatUsd } from '../../lib/service-catalog'
import { normalizeSignupContext, selectionFromParams, signupResumeHref } from '../../lib/signup-context'
import BrandMark from '../components/BrandMark'

export default function SignupPage() {
  const [supabase] = useState(createClient)
  const router = useRouter()
  const resumed = useRef(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [forBusiness, setForBusiness] = useState(false)
  const [selection, setSelection] = useState(null)
  const [assessmentId, setAssessmentId] = useState(null)
  const [sessionUser, setSessionUser] = useState(null)
  const [existingWorkspace, setExistingWorkspace] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [emailSent, setEmailSent] = useState(false)
  const [completionWarning, setCompletionWarning] = useState(null)
  const [destination, setDestination] = useState('/portal/services?welcome=1')

  async function finishAccount(context) {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/signup/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not finish setting up your account. Please retry.')
      if (result.warning) {
        setCompletionWarning(result.warning)
        setDestination(result.next || '/portal/services?welcome=1')
      } else {
        router.replace(result.next || '/portal/services?welcome=1')
        router.refresh()
      }
    } catch (err) {
      setError(err.message || 'Connection interrupted. Please retry to finish your existing account.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function restore() {
      const params = new URLSearchParams(window.location.search)
      const querySelection = selectionFromParams(params)
      const seeded = {}
      if (params.get('name')) seeded.fullName = params.get('name')
      if (params.get('company')) seeded.companyName = params.get('company')
      if (params.get('assessment')) seeded.assessmentId = params.get('assessment')
      if (querySelection) seeded.serviceSelection = querySelection
      try {
        const { data } = await supabase.auth.getUser()
        const user = data?.user
        const previous = user?.user_metadata?.signup_context || {}
        const context = normalizeSignupContext(seeded, {
          ...previous, fullName: previous.fullName || user?.user_metadata?.full_name || '',
          companyName: previous.companyName || user?.user_metadata?.company_name || '',
        })
        if (cancelled) return
        setFullName(context.fullName)
        setEmail(user?.email || params.get('email') || '')
        setCompanyName(context.companyName)
        setForBusiness(context.accountType === 'business' || Boolean(context.companyName) || ['remote', 'managed', 'custom'].includes(context.serviceSelection?.service))
        setSelection(context.serviceSelection)
        setAssessmentId(context.assessmentId)
        setSessionUser(user || null)
        let profile = null
        if (user) {
          const result = await supabase.from('profiles').select('organization_id, role, full_name').eq('id', user.id).maybeSingle()
          if (result.error) throw new Error('Could not load your account. Please refresh and try again.')
          profile = result.data
          if (cancelled) return
          setExistingWorkspace(Boolean(profile?.organization_id))
          if (profile?.organization_id && profile.full_name) setFullName(profile.full_name)
        }
        setInitializing(false)
        // Confirmation and incomplete-account login resume the original
        // request. An existing client's new selection always needs a submit.
        if (user && params.get('resume') === '1' && !resumed.current &&
            (!profile?.organization_id || !querySelection) && (context.fullName || profile?.organization_id)) {
          resumed.current = true
          await finishAccount(profile?.organization_id ? {} : context)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load your account. Please retry.')
          setInitializing(false)
        }
      }
    }
    restore()
    return () => { cancelled = true }
  }, [supabase])

  const estimate = useMemo(() => calculateEstimate(selection || {}), [selection])
  const chosen = SERVICE_CATALOG[selection?.service]
  const loginHref = `/login?${new URLSearchParams({ next: signupResumeHref(selection) }).toString()}`

  async function handleSignup(event) {
    event.preventDefault()
    if (!existingWorkspace && !fullName.trim()) { setError('Enter your name.'); return }
    setLoading(true)
    setError(null)
    const context = normalizeSignupContext({
      fullName, companyName: forBusiness ? companyName : '',
      accountType: forBusiness ? 'business' : 'personal', serviceSelection: selection, assessmentId,
    })
    try {
      if (!sessionUser) {
        const confirmUrl = new URL('/auth/confirm', window.location.origin)
        if (selection?.service) {
          confirmUrl.searchParams.set('service', selection.service)
          confirmUrl.searchParams.set('users', String(selection.users))
        }
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: {
            emailRedirectTo: confirmUrl.toString(),
            data: { full_name: context.fullName, signup_context: context },
          },
        })
        if (authError) throw authError
        setPassword('')
        if (!data?.session) {
          // Email confirmation is still pending: no privileged workspace API.
          setEmailSent(true)
          return
        }
        setSessionUser(data.user)
      }
      await finishAccount(context)
    } catch (err) {
      setError(err.message || 'Could not create your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) return (
    <div className="auth-page"><div className="auth-card" style={{ maxWidth: 520 }}>
      <div className="auth-header">
        <div className="auth-success-icon" aria-hidden="true">✓</div>
        <h1>Check your email</h1>
        <p>If this address needs confirmation, you will receive a link at <strong>{email.trim()}</strong>.</p>
        <p style={{ marginTop: 16 }}>Confirm your email to finish your free account and review your services. Your selection is saved with your signup request.</p>
        <p style={{ marginTop: 12 }}>Already registered, or opened the link on another device? Sign in to continue.</p>
      </div>
      <div className="auth-footer"><Link href={loginHref}>Continue to sign in →</Link></div>
    </div></div>
  )

  if (completionWarning) return (
    <div className="auth-page"><div className="auth-card" style={{ maxWidth: 520 }}>
      <div className="auth-header"><h1>Your account is ready</h1><p role="status">{completionWarning}</p></div>
      <div className="auth-footer"><Link href={destination}>Continue to services →</Link></div>
    </div></div>
  )

  return (
    <div className="auth-page"><div className="auth-card" style={{ maxWidth: 500 }}>
      <div className="auth-header">
        <Link href="/" className="auth-logo">
          <div className="logo-mark" style={{ width: 34, height: 34, borderRadius: 9 }}><BrandMark /></div>
          <span>Kocre IT Services</span>
        </Link>
        <h1>{existingWorkspace ? 'Review your service request' : sessionUser ? 'Finish your account' : 'Create your free account'}</h1>
        <p>{existingWorkspace ? 'Save your interest for review in your existing workspace.' : 'Explore the portal, choose a service, and complete its setup when you are ready.'}</p>
      </div>

      {chosen && <section aria-label="Selected service" style={{ padding: 16, marginBottom: 20, border: '1px solid var(--border)', borderRadius: 12, background: '#f3faf8', lineHeight: 1.6 }}>
        <strong>{chosen.name}</strong>
        <div>{selection.service === 'one_time' ? `${formatUsd(estimate.oneTime)} · up to 60 minutes` : estimate.monthly !== null ? `${estimate.requiresQuote ? 'Illustrative estimate' : 'Pilot pricing'}: ${selection.users} ${selection.users === 1 ? 'user' : 'users'} · ${formatUsd(estimate.monthly)}/month + ${formatUsd(estimate.setup)} setup` : 'Written scope and custom quote'}</div>
        {estimate.monthly !== null && !estimate.requiresQuote && <div style={{ fontSize: '0.87rem' }}>For 1–2 users. Scope, availability, and staffed support windows are agreed before activation.</div>}
        {estimate.requiresQuote && <div style={{ fontSize: '0.87rem' }}>Subject to a written quote and capacity review.</div>}
        <div style={{ fontSize: '0.87rem', color: 'var(--ink-muted)', marginTop: 6 }}>You can review or change this in Services after sign-in. No payment is collected here.</div>
      </section>}

      <form onSubmit={handleSignup} className="auth-form" aria-busy={loading || initializing}>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <div className="form-group">
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" type="text" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} maxLength={120} required={!existingWorkspace} readOnly={existingWorkspace} disabled={initializing} />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required disabled={Boolean(sessionUser) || initializing} />
        </div>
        {!sessionUser && <div className="form-group">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} placeholder="At least 8 characters" required disabled={initializing} />
        </div>}
        {!existingWorkspace && <>
          <label htmlFor="forBusiness" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', cursor: 'pointer' }}>
            <input id="forBusiness" type="checkbox" checked={forBusiness} onChange={(event) => setForBusiness(event.target.checked)} style={{ width: 'auto' }} disabled={initializing} />
            I am requesting support for a business
          </label>
          {forBusiness && <div className="form-group">
            <label htmlFor="companyName">Company name (optional)</label>
            <input id="companyName" type="text" autoComplete="organization" value={companyName} onChange={(event) => setCompanyName(event.target.value)} maxLength={160} />
          </div>}
        </>}
        <p style={{ fontSize: '0.84rem', lineHeight: 1.6, color: 'var(--ink-muted)', margin: 0 }}>Creating an account is free. Team members can suggest service needs; accepted scope and charges require Kocre review and an authorized agreement.</p>
        <button type="submit" className="auth-submit" disabled={loading || initializing}>
          {initializing ? 'Loading...' : loading ? 'Finishing setup...' : existingWorkspace ? 'Save service request' : sessionUser ? 'Continue to services' : 'Create account'}
        </button>
      </form>
      <div className="auth-footer">
        {!sessionUser && <p>Already have an account? <Link href={loginHref}>Sign in</Link></p>}
        {sessionUser && existingWorkspace && <p><Link href="/portal/services">Go to my services</Link></p>}
        <Link href="/" className="auth-back">← Back to website</Link>
      </div>
    </div></div>
  )
}
