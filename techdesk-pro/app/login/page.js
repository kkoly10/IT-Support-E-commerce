'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { safeAuthNext, signupResumeHref } from '../../lib/signup-context'
import BrandMark from '../components/BrandMark'

export default function LoginPage() {
  const [supabase] = useState(createClient)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState(false)
  const [next, setNext] = useState('/portal/dashboard')
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setNext(safeAuthNext(params.get('next'), '/portal/dashboard'))
    if (params.get('auth_error') === 'confirmation') {
      setNotice('The confirmation link could not open a session here. If your email is confirmed, sign in to continue. Otherwise, open the latest confirmation email in the browser where you signed up.')
    }
  }, [])

  async function handleLogin(event) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (authError) throw authError
      const { data: profile, error: profileError } = await supabase.from('profiles')
        .select('role, organization_id').eq('id', data.user.id).maybeSingle()
      if (profileError) throw new Error('You are signed in, but your workspace could not be loaded. Please retry.')
      const target = profile?.role === 'admin' ? '/admin/dashboard'
        : !profile?.organization_id ? (next.startsWith('/signup') ? next : signupResumeHref())
        : next
      router.replace(target)
      router.refresh()
    } catch (err) {
      setError(err.message || 'Could not sign in. Please retry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page"><div className="auth-card">
      <div className="auth-header">
        <Link href="/" className="auth-logo">
          <div className="logo-mark" style={{ width: 34, height: 34, borderRadius: 9 }}><BrandMark /></div>
          <span>Kocre IT Services</span>
        </Link>
        <h1>Welcome back</h1><p>Sign in to your client support portal</p>
      </div>
      <form onSubmit={handleLogin} className="auth-form" aria-busy={loading}>
        {notice && <p role="status" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{notice}</p>}
        {error && <div className="auth-error" role="alert">{error}</div>}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required />
        </div>
        <button type="submit" className="auth-submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
      <div className="auth-footer">
        <p>Don&apos;t have an account? <Link href={next.startsWith('/signup') ? next.replace(/([?&])resume=1(&|$)/, '$1').replace(/[?&]$/, '') : '/signup'}>Sign up</Link></p>
        <Link href="/" className="auth-back">← Back to website</Link>
      </div>
    </div></div>
  )
}
