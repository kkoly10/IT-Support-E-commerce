'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
import BrandMark from '../components/BrandMark'

export default function ForgotPasswordPage() {
  const [supabase] = useState(createClient)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [linkError, setLinkError] = useState(false)

  useEffect(() => {
    setLinkError(new URLSearchParams(window.location.search).get('auth_error') === 'recovery')
  }, [])

  async function submit(event) {
    event.preventDefault()
    if (sending || !email.trim()) return
    setSending(true)
    setError(null)
    try {
      const redirectTo = new URL('/auth/confirm?flow=recovery', window.location.origin).toString()
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
      if (authError) throw authError
      setSent(true)
    } catch (err) {
      setError(err?.message || 'Could not send a reset email. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return <div className="auth-page"><div className="auth-card" style={{ maxWidth: 500 }}>
    <div className="auth-header">
      <Link href="/" className="auth-logo"><div className="logo-mark" style={{ width: 34, height: 34, borderRadius: 9 }}><BrandMark /></div><span>Kocre IT Services</span></Link>
      <h1>{sent ? 'Check your email' : 'Reset your password'}</h1>
      <p>{sent
        ? 'If that address is associated with a Kocre account, a secure password reset link will arrive. Check your inbox and spam folder.'
        : 'Enter the email you use for Kocre IT. We will send a secure link to reset your password.'}</p>
    </div>
    {linkError && !sent && <p role="status" style={{ fontSize: '.9rem', color: '#b45309', lineHeight: 1.6 }}>Your previous reset link was invalid or expired. Enter your address to request a fresh link.</p>}
    {!sent && <form onSubmit={submit} className="auth-form" aria-busy={sending}>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <div className="form-group"><label htmlFor="email">Account email</label><input id="email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" disabled={sending} /></div>
      <button type="submit" className="auth-submit" disabled={sending}>{sending ? 'Sending link…' : 'Email me a reset link'}</button>
    </form>}
    <div className="auth-footer"><Link href="/login">Back to sign in →</Link><Link href="/" className="auth-back">← Back to website</Link></div>
  </div></div>
}
