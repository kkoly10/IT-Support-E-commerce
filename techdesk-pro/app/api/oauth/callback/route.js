// File: app/api/oauth/callback/route.js (new — mkdir -p app/api/oauth/callback)

import { createClient } from '@supabase/supabase-js'
import { getPlatformConfig, getEnvKeys } from '../../../../lib/oauth/platforms'
import { verifyState } from '../../../../lib/oauth/state'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const stateParam = searchParams.get('state')
  const error = searchParams.get('error')

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000')

  if (error) {
    return Response.redirect(`${baseUrl}/portal/settings?error=${encodeURIComponent(error)}`)
  }

  if (!stateParam) {
    return Response.redirect(`${baseUrl}/portal/settings?error=missing_state`)
  }

  // Verify the signed state. An unsigned/forged/expired state could pin tokens
  // to an org the caller doesn't control, so reject anything that doesn't
  // round-trip through verifyState.
  const state = verifyState(stateParam)
  if (!state) {
    return Response.redirect(`${baseUrl}/portal/settings?error=invalid_state`)
  }

  const { userId, orgId, platform, shopDomain } = state
  const config = getPlatformConfig(platform)
  const { clientId, clientSecret } = getEnvKeys(platform)

  if (!config || !clientId || !clientSecret) {
    return Response.redirect(`${baseUrl}/portal/settings?error=platform_not_configured`)
  }

  const redirectUri = `${baseUrl}/api/oauth/callback`

  try {
    let tokenData = {}

    // Exchange code for tokens — platform-specific
    if (platform === 'shopify') {
      const res = await fetch(config.tokenUrl(shopDomain), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      })
      tokenData = await res.json()

    } else if (platform === 'google_workspace') {
      const res = await fetch(config.tokenUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      })
      tokenData = await res.json()

    } else if (platform === 'wix') {
      const res = await fetch(config.tokenUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      })
      tokenData = await res.json()

    } else if (platform === 'squarespace') {
      const res = await fetch(config.tokenUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      })
      tokenData = await res.json()

    } else if (platform === 'woocommerce') {
      // WooCommerce returns the keys directly in the callback query string.
      // Don't fall back to `code`, which would persist a bogus access token
      // and mark a failed connection as healthy.
      const consumerKey = searchParams.get('consumer_key')
      const consumerSecret = searchParams.get('consumer_secret')
      if (!consumerKey || !consumerSecret) {
        return Response.redirect(`${baseUrl}/portal/settings?error=token_exchange_failed`)
      }
      tokenData = {
        access_token: consumerKey,
        consumer_secret: consumerSecret,
      }
    }

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData)
      return Response.redirect(`${baseUrl}/portal/settings?error=token_exchange_failed`)
    }

    // Calculate token expiry
    let tokenExpiresAt = null
    if (tokenData.expires_in) {
      tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    }

    // Upsert integration record
    const { error: dbError } = await supabase
      .from('connected_integrations')
      .upsert({
        organization_id: orgId,
        connected_by: userId,
        platform,
        status: 'connected',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        token_expires_at: tokenExpiresAt,
        shop_domain: shopDomain || null,
        scope: tokenData.scope || null,
        platform_user_id: tokenData.user_id || null,
        platform_email: tokenData.email || null,
        metadata: {
          raw_scopes: tokenData.scope,
          token_type: tokenData.token_type,
          connected_at: new Date().toISOString(),
        },
        connected_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id,platform',
      })

    if (dbError) {
      console.error('DB error saving integration:', dbError)
      return Response.redirect(`${baseUrl}/portal/settings?error=save_failed`)
    }

    // Log the connection
    await supabase.from('activity_log').insert({
      organization_id: orgId,
      actor_id: userId,
      action: 'integration_connected',
      resource_type: 'integration',
      metadata: { platform, shop_domain: shopDomain },
    })

    return Response.redirect(`${baseUrl}/portal/settings?connected=${platform}`)

  } catch (err) {
    console.error('OAuth callback error:', err)
    return Response.redirect(`${baseUrl}/portal/settings?error=callback_failed`)
  }
}