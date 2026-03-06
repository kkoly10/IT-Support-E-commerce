// File: app/portal/layout.js (replace existing)

'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'

// Service-aware nav configuration per README section 11
const SERVICE_NAV = {
  // Shared foundation — always visible
  shared_top: [
    { label: 'Dashboard', href: '/portal/dashboard', icon: '📊' },
  ],
  shared_bottom: [
    { label: 'Documents', href: '/portal/documents', icon: '📄' },
    { label: 'Billing', href: '/portal/billing', icon: '💳' },
    { label: 'Settings', href: '/portal/settings', icon: '⚙️' },
  ],

  // IT clients
  it: [
    { label: 'Support Requests', href: '/portal/tickets', icon: '🎫' },
    { label: 'System Health', href: '/portal/health', icon: '🛡️' },
    { label: 'Atlas Assistant', href: '/portal/atlas', icon: '🧠' },
    { label: 'Training', href: '/portal/training', icon: '🎓' },
  ],

  // E-commerce clients
  ecommerce: [
    { label: 'Store Requests', href: '/portal/tickets', icon: '🛍️' },
    { label: 'Integrations', href: '/portal/settings', icon: '🔗' },
  ],

  // Automation clients
  automation: [
    { label: 'Workflow Requests', href: '/portal/tickets', icon: '⚡' },
    { label: 'Workflow Status', href: '/portal/documents', icon: '📋' },
  ],
}

function buildNavItems(serviceTypes) {
  const types = serviceTypes || ['it']
  const items = [...SERVICE_NAV.shared_top]

  // Track hrefs to avoid duplicates
  const addedHrefs = new Set(items.map(i => i.href))

  // Add service-specific nav items
  // If multi-service, group them — IT items first, then ecommerce, then automation
  const order = ['it', 'ecommerce', 'automation']
  for (const serviceType of order) {
    if (types.includes(serviceType) && SERVICE_NAV[serviceType]) {
      for (const item of SERVICE_NAV[serviceType]) {
        if (!addedHrefs.has(item.href)) {
          items.push(item)
          addedHrefs.add(item.href)
        } else {
          // If href already exists but this service has a different label,
          // only add if it's the primary service
          // (prevents duplicate ticket links with different labels)
        }
      }
    }
  }

  // Add shared bottom items
  for (const item of SERVICE_NAV.shared_bottom) {
    if (!addedHrefs.has(item.href)) {
      items.push(item)
      addedHrefs.add(item.href)
    }
  }

  return items
}

export default function PortalLayout({ children }) {
  const [profile, setProfile] = useState(null)
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [navItems, setNavItems] = useState([])
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setOrg(profileData.organizations)

        // Build service-aware nav
        const serviceTypes = profileData.organizations?.service_types || ['it']
        setNavItems(buildNavItems(serviceTypes))
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="portal-loading">
        <div className="portal-loading-spinner"></div>
        <p>Loading portal...</p>
      </div>
    )
  }

  return (
    <div className="portal-wrapper">
      <aside className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <a href="/" className="sidebar-logo">
            <div className="logo-mark" style={{ width: 32, height: 32, borderRadius: 8, fontSize: '0.8rem' }}>T</div>
            <span>TechDesk Pro</span>
          </a>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        {org && (
          <div className="sidebar-org">
            <div className="sidebar-org-name">{org.name}</div>
            <div className="sidebar-org-plan">{org.plan} plan</div>
          </div>
        )}

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <a
              key={item.href + item.label}
              href={item.href}
              className={`sidebar-link ${pathname === item.href || pathname.startsWith(item.href + '/') ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{profile?.full_name}</div>
              <div className="sidebar-user-email">{profile?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-logout">Sign Out</button>
        </div>
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      <div className="portal-main">
        <header className="portal-topbar">
          <button className="topbar-menu" onClick={() => setSidebarOpen(true)}>
            <span></span><span></span><span></span>
          </button>
          <div className="topbar-breadcrumb">
            {pathname.split('/').filter(Boolean).map((seg, i) => (
              <span key={i}>
                {i > 0 && <span className="topbar-sep">/</span>}
                <span className={i === pathname.split('/').filter(Boolean).length - 1 ? 'topbar-current' : ''}>
                  {seg.charAt(0).toUpperCase() + seg.slice(1)}
                </span>
              </span>
            ))}
          </div>
        </header>

        <main className="portal-content">
          {children}
        </main>
      </div>
    </div>
  )
}