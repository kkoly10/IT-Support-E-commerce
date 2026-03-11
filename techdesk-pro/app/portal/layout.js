'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase/client'
import BrandMark from '../components/BrandMark'

const ACTIVE_NAV = [
  { label: 'Dashboard', href: '/portal/dashboard', icon: '📊' },
  { label: 'Support Requests', href: '/portal/tickets', icon: '🎫' },
  { label: 'System Health', href: '/portal/health', icon: '🛡️' },
  { label: 'Atlas Assistant', href: '/portal/atlas', icon: '🧠' },
  { label: 'Training', href: '/portal/training', icon: '🎓' },
  { label: 'Documents', href: '/portal/documents', icon: '📄' },
  { label: 'Contacts', href: '/portal/contacts', icon: '👥' },
  { label: 'Access', href: '/portal/access', icon: '🔐' },
  { label: 'Billing', href: '/portal/billing', icon: '💳' },
  { label: 'Settings', href: '/portal/settings', icon: '⚙️' },
]

const BREADCRUMB_LABELS = {
  portal: 'Client Portal',
  tickets: 'Support Requests',
  dashboard: 'Dashboard',
  onboarding: 'Onboarding',
  health: 'System Health',
  atlas: 'Atlas Assistant',
  training: 'Training',
  documents: 'Documents',
  contacts: 'Contacts',
  access: 'Access',
  billing: 'Billing',
  settings: 'Settings',
  new: 'New Request',
}

function buildNav(org) {
  const clientStatus = org?.client_status || 'lead'

  if (clientStatus === 'lead') {
    return [
      { label: 'Dashboard', href: '/portal/dashboard', icon: '📊' },
      { label: 'Onboarding', href: '/portal/onboarding', icon: '🧭' },
      { label: 'Documents', href: '/portal/documents', icon: '📄' },
      { label: 'Contacts', href: '/portal/contacts', icon: '👥' },
      { label: 'Access', href: '/portal/access', icon: '🔐' },
      { label: 'Settings', href: '/portal/settings', icon: '⚙️' },
    ]
  }

  if (clientStatus === 'onboarding') {
    return [
      { label: 'Dashboard', href: '/portal/dashboard', icon: '📊' },
      { label: 'Onboarding', href: '/portal/onboarding', icon: '🧭' },
      { label: 'Documents', href: '/portal/documents', icon: '📄' },
      { label: 'Contacts', href: '/portal/contacts', icon: '👥' },
      { label: 'Access', href: '/portal/access', icon: '🔐' },
      { label: 'Billing', href: '/portal/billing', icon: '💳' },
      { label: 'Settings', href: '/portal/settings', icon: '⚙️' },
    ]
  }

  if (clientStatus === 'paused' || clientStatus === 'former') {
    return [
      { label: 'Dashboard', href: '/portal/dashboard', icon: '📊' },
      { label: 'Documents', href: '/portal/documents', icon: '📄' },
      { label: 'Contacts', href: '/portal/contacts', icon: '👥' },
      { label: 'Access', href: '/portal/access', icon: '🔐' },
      { label: 'Billing', href: '/portal/billing', icon: '💳' },
      { label: 'Settings', href: '/portal/settings', icon: '⚙️' },
    ]
  }

  return ACTIVE_NAV
}

function formatLabel(value) {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function breadcrumbLabel(segment) {
  if (!segment) return ''
  return BREADCRUMB_LABELS[segment] || formatLabel(segment.replace(/-/g, ' '))
}

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
      const {
        data: { user },
      } = await supabase.auth.getUser()

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
  }, [router, supabase])

  const navItems = useMemo(() => buildNav(org), [org])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="portal-loading">
        <div className="portal-loading-spinner"></div>
        <p>Loading Client Portal...</p>
      </div>
    )
  }

  return (
    <div className="portal-wrapper">
      <aside className={`portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/" className="sidebar-logo">
            <div className="logo-mark" style={{ width: 32, height: 32, borderRadius: 8 }}>
              <BrandMark />
            </div>
            <span>Kocre IT Services</span>
          </Link>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            ✕
          </button>
        </div>

        {org && (
          <div className="sidebar-org">
            <div className="sidebar-org-name">{org.name}</div>
            <div className="sidebar-org-plan">
              {(org.plan || 'starter')} plan · {formatLabel(org.client_status || 'lead')}
            </div>
            {org.needs_human_review ? (
              <div style={{ marginTop: 8 }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '3px 8px',
                    borderRadius: 100,
                    background: '#e74c3c18',
                    color: '#e74c3c',
                    fontWeight: 600,
                  }}
                >
                  Needs review
                </span>
              </div>
            ) : null}
          </div>
        )}

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{profile?.full_name?.charAt(0)?.toUpperCase() || '?'}</div>
            <div>
              <div className="sidebar-user-name">{profile?.full_name || 'Client User'}</div>
              <div className="sidebar-user-email">{profile?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-logout">
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      <div className="portal-main">
        <header className="portal-topbar">
          <button className="topbar-menu" onClick={() => setSidebarOpen(true)}>
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className="topbar-breadcrumb">
            {pathname
              .split('/')
              .filter(Boolean)
              .map((seg, i, arr) => (
                <span key={i}>
                  {i > 0 && <span className="topbar-sep">/</span>}
                  <span className={i === arr.length - 1 ? 'topbar-current' : ''}>
                    {breadcrumbLabel(seg)}
                  </span>
                </span>
              ))}
          </div>
        </header>

        <main className="portal-content">{children}</main>
      </div>
    </div>
  )
}