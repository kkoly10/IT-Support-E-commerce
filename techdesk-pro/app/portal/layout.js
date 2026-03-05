// File: app/portal/layout.js (replace existing)

'use client'
import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/portal/dashboard', icon: '📊' },
  { label: 'Tickets', href: '/portal/tickets', icon: '🎫' },
  { label: 'Atlas AI', href: '/portal/atlas', icon: '🧠' },
  { label: 'Training', href: '/portal/training', icon: '🎓' },
  { label: 'Documents', href: '/portal/documents', icon: '📄' },
  { label: 'System Health', href: '/portal/health', icon: '🛡️' },
  { label: 'Billing', href: '/portal/billing', icon: '💳' },
  { label: 'Settings', href: '/portal/settings', icon: '⚙️' },
]

export default function PortalLayout({ children }) {
  const [profile, setProfile] = useState(null)
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
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