import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { confirmationDestinations } from '../../../lib/auth-redirects'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const url = new URL(request.url)
  const destinations = confirmationDestinations(url)
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
    if (url.searchParams.has('error')) return response(destinations.failure)
    if (destinations.recovery && !code && !tokenHash) return response(destinations.failure)

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) return response(destinations.failure)
    } else if (tokenHash && (destinations.recovery ? type === 'recovery' : (type === 'email' || type === 'signup'))) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      if (error) return response(destinations.failure)
    } else if (tokenHash) {
      return response(destinations.failure)
    }

    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user?.email_confirmed_at) return response(destinations.failure)
    return response(destinations.success)
  } catch {
    return response(destinations.failure)
  }
}
