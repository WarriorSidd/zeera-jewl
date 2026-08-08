'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import CreateTicketModal from './components/CreateTicketModal'
import ThemeToggle from './components/ThemeToggle'
import { getStoredUser, isManager, isOwnerOrAdmin, clearAuth, CurrentUser, apiFetch } from './lib/api'

const MANAGER_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '💎' },
  { href: '/board', label: 'Production Board', icon: '📿' },
  { href: '/production', label: 'Production Tickets', icon: '💍' },
]

const KARIGAR_NAV_ITEMS = [
  { href: '/production', label: 'My Assigned Work', icon: '🔨' },
]

type Ticket = {
  id: string
  ticket_number: string
  title?: string
  status: string
  created_at: string
}

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [user, setUser] = useState<CurrentUser | null>(null)

  // Notification Bell State
  const [notifications, setNotifications] = useState<Ticket[]>([])
  const [showNotifMenu, setShowNotifMenu] = useState(false)

  const loadNotifications = useCallback(async () => {
    const u = getStoredUser()
    if (!u) return
    try {
      if (u.role === 'karigar') {
        const res = await apiFetch<{ items: Ticket[] }>(`/api/v1/production-tickets/?assignee_id=${u.id}&status=Assigned`)
        setNotifications(res.items || [])
      } else {
        const res = await apiFetch<{ items: Ticket[] }>(`/api/v1/production-tickets/?status=Review`)
        setNotifications(res.items || [])
      }
    } catch {
      // ignore silently
    }
  }, [])

  useEffect(() => {
    setUser(getStoredUser())
    loadNotifications()
    const timer = setInterval(loadNotifications, 15000) // auto refresh notifications every 15s
    return () => clearInterval(timer)
  }, [pathname, loadNotifications])

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

        {/* 🔔 Notification Banner for Karigars & Managers */}
        {user && (
          <div className="mb-3 position-relative">
            <button
              type="button"
              className="btn btn-secondary w-100 d-flex align-items-center justify-content-between px-3 py-2"
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              style={{ fontSize: 13, borderColor: notifications.length > 0 ? 'var(--brand-gold)' : 'var(--border-subtle)' }}
            >
              <span className="d-flex align-items-center gap-2">
                🔔 Notifications
              </span>
              {notifications.length > 0 ? (
                <span className="tag" style={{ background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 10 }}>
                  {notifications.length} New
                </span>
              ) : (
                <span className="text-muted" style={{ fontSize: 11 }}>0</span>
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {showNotifMenu && (
              <div style={{
                position: 'absolute', top: '105%', left: 0, right: 0, zIndex: 9999,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-gold)',
                borderRadius: 10, boxShadow: 'var(--shadow-pop)', padding: 12, maxHeight: 280, overflowY: 'auto',
              }}>
                <div className="fw-bold mb-2 pb-1" style={{ fontSize: 13, borderBottom: '1px solid var(--border-subtle)', color: 'var(--brand-gold)' }}>
                  {user.role === 'karigar' ? '🔨 Work Assigned to You' : '🔔 Pending Review Tickets'}
                </div>
                {notifications.length === 0 ? (
                  <div className="text-muted py-2 text-center" style={{ fontSize: 12 }}>No new notifications</div>
                ) : (
                  notifications.map((n) => (
                    <a
                      key={n.id}
                      href={`/production/${n.id}`}
                      className="d-block p-2 mb-1 text-decoration-none rounded"
                      style={{ background: 'var(--bg-subtle)', color: 'var(--text-main)', fontSize: 12, border: '1px solid var(--border-subtle)' }}
                      onClick={() => setShowNotifMenu(false)}
                    >
                      <div className="fw-bold" style={{ color: 'var(--brand-gold)' }}>{n.ticket_number}</div>
                      <div>{n.title || 'Untitled Ticket'}</div>
                      <div className="text-muted mt-1" style={{ fontSize: 10 }}>Stage: {n.status}</div>
                    </a>
                  ))
                )}
              </div>
            )}
          </div>
        )}

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
