'use client'
import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import CreateTicketModal from './components/CreateTicketModal'
import ThemeToggle from './components/ThemeToggle'
import { getStoredUser, isManager, isOwnerOrAdmin, clearAuth, CurrentUser } from './lib/api'

const MANAGER_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '💎' },
  { href: '/board', label: 'Production Board', icon: '📿' },
  { href: '/production', label: 'Production Tickets', icon: '💍' },
]

const KARIGAR_NAV_ITEMS = [
  { href: '/production', label: 'My Assigned Work', icon: '🔨' },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [user, setUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    setUser(getStoredUser())
  }, [pathname]) // re-read on navigation (covers post-login)

  // Hide sidebar on login page
  if (pathname === '/login') return null

  function logout() {
    clearAuth()
    setUser(null)
    router.push('/login')
  }

  const navItems = isManager(user) ? MANAGER_NAV_ITEMS : KARIGAR_NAV_ITEMS
  const showCreateButton = isManager(user)
  const showAdminLink = isOwnerOrAdmin(user)

  const roleLabel = user?.role
    ? user.role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
    : ''

  return (
    <>
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="brand-badge">ZJ</div>
          <div>
            zjewl
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>Production Platform</div>
          </div>
        </div>

        {showCreateButton && (
          <button className="btn btn-primary w-100 mb-3" onClick={() => setModalOpen(true)}>
            + New Production Ticket
          </button>
        )}

        <nav className="sidebar-nav">
          <div className="sidebar-section">Workspace</div>
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </a>
          ))}

          {showAdminLink && (
            <>
              <div className="sidebar-section" style={{ marginTop: 12 }}>Admin</div>
              <a
                href="/admin/users"
                className={`sidebar-link ${pathname === '/admin/users' ? 'active' : ''}`}
              >
                <span className="nav-icon">👥</span>
                Manage Users
              </a>
            </>
          )}
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <div className="d-flex align-items-center justify-content-between p-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <ThemeToggle />
            {user ? (
              <div className="d-flex flex-column align-items-end gap-1">
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
                  {roleLabel}
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-secondary" style={{ fontSize: 13 }}>👤 {user.full_name || user.username}</span>
                  <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
                </div>
              </div>
            ) : (
              <a href="/login" className="sidebar-link" style={{ padding: '6px 10px' }}>
                <span className="nav-icon">🔐</span>
                Sign In
              </a>
            )}
          </div>
        </div>
      </aside>

      {showCreateButton && (
        <CreateTicketModal
          show={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreate={() => { setModalOpen(false); router.push('/production') }}
        />
      )}
    </>
  )
}
