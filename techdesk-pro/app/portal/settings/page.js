// File: app/portal/settings/page.js (replace existing placeholder)

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'

const PLATFORMS = [
  {
    id: 'shopify',
    name: 'Shopify',
    icon: '🛍️',
    color: '#96BF48',
    description: 'Monitor orders, products, inventory, and store analytics.',
    needsShopDomain: true,
  },
  {
    id: 'wix',
    name: 'Wix',
    icon: '🌐',
    color: '#0C6EFC',
    description: 'Monitor site performance and manage content.',
    needsShopDomain: false,
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    icon: '🟣',
    color: '#96588A',
    description: 'Monitor orders, products, and store health.',
    needsShopDomain: true,
  },
  {
    id: 'google_workspace',
    name: 'Google Workspace',
    icon: '📧',
    color: '#4285F4',
    description: 'Monitor email, calendar, and admin health.',
    needsShopDomain: false,
  },
  {
    id: 'squarespace',
    name: 'Squarespace',
    icon: '◼️',
    color: '#000000',
    description: 'Monitor site performance, orders, and inventory.',
    needsShopDomain: false,
  },
]

function SettingsContent() {
  const searchParams = useSearchParams()
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [orgId, setOrgId] = useState(null)
  const [shopDomains, setShopDomains] = useState({})
  const [disconnecting, setDisconnecting] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    // Check URL params for OAuth results
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    if (connected) {
      setSuccessMsg(`Successfully connected ${connected}!`)
      setTimeout(() => setSuccessMsg(null), 5000)
    }
    if (error) {
      setErrorMsg(`Connection failed: ${error.replace(/_/g, ' ')}`)
      setTimeout(() => setErrorMsg(null), 5000)
    }

    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profile) {
      setOrgId(profile.organization_id)

      const { data: ints } = await supabase
        .from('connected_integrations')
        .select('*')
        .eq('organization_id', profile.organization_id)

      setIntegrations(ints || [])
    }
    setLoading(false)
  }

  function isConnected(platformId) {
    return integrations.some(i => i.platform === platformId && i.status === 'connected')
  }

  function getIntegration(platformId) {
    return integrations.find(i => i.platform === platformId)
  }

  async function handleConnect(platform) {
    if (platform.needsShopDomain) {
      const domain = shopDomains[platform.id]
      if (!domain) {
        alert(`Please enter your ${platform.name} store domain first.`)
        return
      }
      window.location.href = `/api/oauth/${platform.id}?shop=${encodeURIComponent(domain)}`
    } else {
      window.location.href = `/api/oauth/${platform.id}`
    }
  }

  async function handleDisconnect(platformId) {
    if (!confirm('Are you sure you want to disconnect this integration?')) return

    setDisconnecting(platformId)
    try {
      const res = await fetch('/api/oauth/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: platformId, orgId, userId }),
      })

      if (res.ok) {
        setIntegrations(prev => prev.filter(i => i.platform !== platformId))
        setSuccessMsg(`Disconnected ${platformId}`)
        setTimeout(() => setSuccessMsg(null), 3000)
      }
    } catch (err) {
      console.error('Disconnect error:', err)
    } finally {
      setDisconnecting(null)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    })
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Settings</h1>
      <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem', marginBottom: 32 }}>
        Manage your integrations and company profile.
      </p>

      {/* Success/Error banners */}
      {successMsg && (
        <div style={{
          background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669',
          padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.88rem'
        }}>
          ✅ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{
          background: '#fee', border: '1px solid #fcc', color: '#c00',
          padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.88rem'
        }}>
          ❌ {errorMsg}
        </div>
      )}

      {/* Connected Integrations */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Connected Platforms</h2>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: 20 }}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PLATFORMS.map((platform) => {
              const connected = isConnected(platform.id)
              const integration = getIntegration(platform.id)

              return (
                <div
                  key={platform.id}
                  style={{
                    background: 'white', border: '1px solid var(--border)', borderRadius: 12,
                    padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Platform icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: platform.color + '15',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.3rem', flexShrink: 0,
                  }}>
                    {platform.icon}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)' }}>
                      {platform.name}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: 2 }}>
                      {connected
                        ? `Connected ${integration?.connected_at ? formatDate(integration.connected_at) : ''}`
                        : platform.description
                      }
                    </div>
                    {connected && integration?.shop_domain && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--teal)', marginTop: 2 }}>
                        {integration.shop_domain}
                      </div>
                    )}
                  </div>

                  {/* Shop domain input for platforms that need it */}
                  {!connected && platform.needsShopDomain && (
                    <input
                      type="text"
                      placeholder={`your-store.${platform.id === 'shopify' ? 'myshopify.com' : 'com'}`}
                      value={shopDomains[platform.id] || ''}
                      onChange={(e) => setShopDomains(prev => ({ ...prev, [platform.id]: e.target.value }))}
                      style={{
                        padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6,
                        fontSize: '0.82rem', fontFamily: 'Outfit, sans-serif', width: 200,
                      }}
                    />
                  )}

                  {/* Connect/Disconnect button */}
                  {connected ? (
                    <button
                      onClick={() => handleDisconnect(platform.id)}
                      disabled={disconnecting === platform.id}
                      style={{
                        padding: '8px 16px', borderRadius: 6,
                        border: '1px solid #e74c3c30', background: '#e74c3c08',
                        color: '#e74c3c', fontSize: '0.82rem', fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                        opacity: disconnecting === platform.id ? 0.5 : 1,
                      }}
                    >
                      {disconnecting === platform.id ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(platform)}
                      style={{
                        padding: '8px 16px', borderRadius: 6,
                        border: 'none', background: platform.color,
                        color: 'white', fontSize: '0.82rem', fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                      }}
                    >
                      Connect {platform.name}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Company info section */}
      <div>
        <h2 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Company Profile</h2>
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 12,
          padding: 24, color: 'var(--ink-muted)', fontSize: '0.9rem'
        }}>
          Company profile management is coming soon. You'll be able to update your company details, invite team members, and configure notifications here.
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: 60 }}>Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  )
}