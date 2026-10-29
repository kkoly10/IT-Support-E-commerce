import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { selectionFromParams, signupResumeHref } from '../../../lib/signup-context'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const url = new URL(request.url)
  const resume = signupResumeHref(selectionFromParams(url.searchParams))
  const fail = new URL('/login', url.origin)
  fail.searchParams.set('auth_error', 'confirmation')
  fail.searchParams.set('next', resume)
  const response = (destination) => {
    const result = NextResponse.redirect(new URL(destination, url.origin), 303)
    result.headers.set('Cache-Control', 'no-store')
    return result
  }
  try {
    const supabase = await createClient()
    const code = url.searchParams.get('code')
    const tokenHash = url.searchParams.get('token_hash')
    const type = url.searchParams.get('type')
    if (url.searchParams.has('error')) return response(fail)
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) return response(fail)
    } else if (tokenHash && (type === 'email' || type === 'signup')) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      if (error) return response(fail)
    }
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user?.email_confirmed_at) return response(fail)
    return response(resume)
  } catch {
    return response(fail)
  }
}
