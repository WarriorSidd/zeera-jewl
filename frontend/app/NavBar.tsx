'use client'
import React, { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import CreateTicketModal from './components/CreateTicketModal'
import ThemeToggle from './components/ThemeToggle'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '💎' },
  { href: '/board', label: 'Production Board', icon: '📿' },
  { href: '/production', label: 'Production Tickets', icon: '💍' },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [username, setUsername] = useState('')

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setUsername(localStorage.getItem('username') || '')
    }
  }, [])

  function handleCreate(columnId: string | undefined, _title: string, _description?: string) {
    router.push('/production')
  }

  // Hide sidebar on login page
  if (pathname === '/login') return null

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setUsername('')
    router.push('/login')
  }

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

        <button className="btn btn-primary w-100 mb-3" onClick={() => setModalOpen(true)}>
          + New Production Ticket
        </button>

        <nav className="sidebar-nav">
          <div className="sidebar-section">Workspace</div>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

<div style={{ marginTop: 'auto' }}>
          <div className="d-flex align-items-center justify-content-between p-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <ThemeToggle />
            {username ? (
              <div className="d-flex align-items-center gap-2">
                <span className="text-secondary" style={{ fontSize: 13 }}>👤 {username}</span>
                <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
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

      <CreateTicketModal
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </>
  )
}
