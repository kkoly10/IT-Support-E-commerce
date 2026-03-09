// File: app/api/oauth/[platform]/route.js (new — mkdir -p app/api/oauth/[platform])

import { createClient } from '@supabase/supabase-js'
import { getPlatformConfig, getEnvKeys } from '../../../../lib/oauth/platforms'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request, { params }) {
  const { platform } = await params
  const config = getPlatformConfig(platform)

  if (!config) {
    return Response.json({ error: 'Unknown platform' }, { status: 400 })
  }

  const { clientId } = getEnvKeys(platform)
  if (!clientId) {
    return Response.json({ error: `${config.name} integration not configured. Missing API credentials.` }, { status: 400 })
  }

  // Get current user
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.redirect(new URL('/login', request.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return Response.json({ error: 'Profile not found' }, { status: 400 })
  }

  // Get shop domain from query params if needed
  const { searchParams } = new URL(request.url)
  const shopDomain = searchParams.get('shop')

  if (config.needsShopDomain && !shopDomain) {
    return Response.json({ error: 'Shop domain is required for this platform' }, { status: 400 })
  }

  // Create state token with user info (for callback verification)
  const state = Buffer.from(JSON.stringify({
    userId: user.id,
    orgId: profile.organization_id,
    platform,
    shopDomain: shopDomain || null,
    timestamp: Date.now(),
  })).toString('base64url')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'https://techdesk-pro.vercel.app'
  const redirectUri = `${baseUrl}/api/oauth/callback`

  const authUrl = config.getAuthUrl(shopDomain, clientId, redirectUri, state)

  return Response.redirect(authUrl)
}