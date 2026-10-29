import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { safeAuthNext, selectionFromParams, signupResumeHref } from './lib/signup-context'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )
  // Preserve a refreshed session on redirects as well as ordinary responses.
  const redirect = (path) => {
    const response = NextResponse.redirect(new URL(path, request.url))
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
    return response
  }
  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const protectedPage = pathname.startsWith('/portal') || pathname.startsWith('/admin')
  if (!user && protectedPage) {
    const login = new URL('/login', request.url)
    // Admin destinations are decided from the verified role after sign-in.
    if (pathname.startsWith('/portal')) login.searchParams.set('next', pathname + request.nextUrl.search)
    return redirect(login)
  }
  if (!user) return supabaseResponse

  const { data: profile, error } = await supabase.from('profiles')
    .select('role, organization_id').eq('id', user.id).maybeSingle()
  // Let the page report a temporary database failure instead of treating it
  // as an absent profile and starting an incorrect signup redirect loop.
  if (error) {
    if (pathname.startsWith('/admin')) return redirect('/portal/dashboard?account_error=load')
    return supabaseResponse
  }
  if (pathname.startsWith('/admin')) {
    if (profile?.role !== 'admin') return redirect(profile?.organization_id ? '/portal/dashboard' : signupResumeHref())
    return supabaseResponse
  }
  if (pathname.startsWith('/portal') && !profile?.organization_id && profile?.role !== 'admin') {
    return redirect(signupResumeHref())
  }
  if (pathname === '/signup' || pathname === '/login') {
    if (profile?.role === 'admin') return redirect('/admin/dashboard')
    const requestedSelection = selectionFromParams(request.nextUrl.searchParams)
    if (pathname === '/signup') {
      // Selection review is an explicit form submit for an existing client.
      // A confirmed, incomplete account may resume its earlier submission.
      if (!profile?.organization_id || requestedSelection || request.nextUrl.searchParams.get('resume') === '1') return supabaseResponse
      return redirect('/portal/services')
    }
    if (!profile?.organization_id) {
      const next = safeAuthNext(request.nextUrl.searchParams.get('next'), signupResumeHref(requestedSelection))
      return redirect(next.startsWith('/signup') ? next : signupResumeHref(requestedSelection))
    }
    return redirect(safeAuthNext(request.nextUrl.searchParams.get('next'), '/portal/dashboard'))
  }
  return supabaseResponse
}

// API authorization belongs in each handler; signup completion verifies the
// current user before obtaining a service-role client.
export const config = {
  matcher: ['/portal/:path*', '/admin/:path*', '/login', '/signup'],
}
