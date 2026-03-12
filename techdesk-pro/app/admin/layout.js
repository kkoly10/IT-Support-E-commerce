'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import BrandMark from '../components/BrandMark'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { label: 'Ghost Operations', href: '/admin/ghost', icon: '👻' },
  { label: 'Support Requests', href: '/admin/tickets', icon: '🎫' },
  { label: 'Knowledge Drafts', href: '/admin/kb', icon: '📚' },
  { label: 'Assessments', href: '/admin/assessments', icon: '📝' },
  { label: 'Sentinel AI', href: '/admin/sentinel', icon: '🛡️' },
  { label: 'Documents', href: '/admin/document', icon: '📄' },
  { label: 'Onboarding', href: '/admin/onboarding', icon: '🧭' },
  { label: 'Contacts', href: '/admin/contacts', icon: '👥' },
  { label: 'Access', href: '/admin/access', icon: '🔐' },
  { label: 'Launch Pack', href: '/admin/launch', icon: '🚀' },
  { label: 'Clients', href: '/admin/clients', icon: '👥' },
  { label: 'Reports & CSAT', href: '/admin/reports', icon: '📈' },
  { label: 'Compliance', href: '/admin/compliance', icon: '📋' },
  { label: 'Training', href: '/admin/training', icon: '🎓' },
  { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
]

export default function AdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()

  const [profile, setProfile] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, role')
        .eq('id', user.id)
        .single()

      if (data) setProfile(data)
    }

    loadProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="admin-layout">
      <div className="admin-mobile-header">
        <button className="admin-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span />
          <span />
          <span />
        </button>
        <span className="admin-mobile-title">Kocre IT Admin</span>
      </div>

      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <a
            href="/"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div className="admin-logo-mark">
              <BrandMark stroke="#ffffff" />
            </div>
            <div>
              <div className="admin-logo-text">Kocre IT Services</div>
              <div className="admin-logo-sub">Support Console</div>
            </div>
          </a>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="admin-sidebar-divider" />

        <a
          href="/portal/dashboard"
          className="admin-nav-item"
          style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}
        >
          <span className="admin-nav-icon">↩️</span>
          Switch to Client Portal
        </a>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">{profile?.full_name?.charAt(0) || 'A'}</div>
            <div className="admin-user-details">
              <div className="admin-user-name">{profile?.full_name || 'Admin'}</div>
              <div className="admin-user-role">Administrator</div>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  )
}