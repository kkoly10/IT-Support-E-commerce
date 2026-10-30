'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
import BrandMark from '../components/BrandMark'

export default function ResetPasswordPage() {
  const [supabase] = useState(createClient)
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser().then(({ data, error: authError }) => {
      if (cancelled) return
      setAuthorized(Boolean(data?.user?.email_confirmed_at) && !authError)
      setChecking(false)
    }).catch(() => { if (!cancelled) { setAuthorized(false); setChecking(false) } })
    return () => { cancelled = true }
  }, [supabase])

  async function submit(event) {
    event.preventDefault()
    if (saving || done) return
    if (password.length < 12) { setError('Use at least 12 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setSaving(true)
    setError(null)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setPassword('')
      setConfirmPassword('')
      setDone(true)
      // Clear the recovery session so the new password is used on next sign-in.
      await supabase.auth.signOut().catch(() => {})
    } catch (err) {
      setError(err?.message || 'Could not update your password. Request a new link and retry.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="auth-page"><div className="auth-card" style={{ maxWidth: 500 }}>
    <div className="auth-header">
      <Link href="/" className="auth-logo"><div className="logo-mark" style={{ width: 34, height: 34, borderRadius: 9 }}><BrandMark /></div><span>Kocre IT Services</span></Link>
      <h1>{done ? 'Password updated' : checking ? 'Checking your reset link' : authorized ? 'Choose a new password' : 'Reset link unavailable'}</h1>
      <p>{done ? 'Your Kocre IT password has been updated. Sign in with your new password.'
        : checking ? 'Checking your secure session…'
        : authorized ? 'Use a unique password with at least 12 characters.'
        : 'This link has expired, was already used, or could not create a secure session. Request another reset email.'}</p>
    </div>
    {!checking && authorized && !done && <form onSubmit={submit} className="auth-form" aria-busy={saving}>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <div className="form-group"><label htmlFor="newPassword">New password</label><input id="newPassword" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)} disabled={saving} placeholder="At least 12 characters"/></div>
      <div className="form-group"><label htmlFor="confirmPassword">Confirm new password</label><input id="confirmPassword" type="password" autoComplete="new-password" required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} disabled={saving} /></div>
      <button type="submit" className="auth-submit" disabled={saving}>{saving ? 'Updating password…' : 'Update password'}</button>
    </form>}
    <div className="auth-footer">{done ? <Link href="/login?password_updated=1">Sign in with your new password →</Link> : !authorized && !checking ? <Link href="/forgot-password">Request a new reset link →</Link> : <Link href="/login">Back to sign in →</Link>}<Link href="/" className="auth-back">← Back to website</Link></div>
  </div></div>
}
