'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, getStoredUser, isOwnerOrAdmin } from '../../lib/api'

type User = {
  id: string
  username: string
  full_name?: string
  role: string
  is_active: boolean
}

const ROLES = ['karigar', 'office', 'production_manager', 'qc', 'accounts', 'admin', 'owner']

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // New user form
  const [newUsername, setNewUsername] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('karigar')
  const [creating, setCreating] = useState(false)

  const currentUser = typeof window !== 'undefined' ? getStoredUser() : null

  useEffect(() => {
    if (!isOwnerOrAdmin(currentUser)) {
      router.push('/production')
    }
  }, [currentUser, router])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ items: User[]; total: number }>('/api/v1/auth/users')
      setUsers(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setCreating(true)
    try {
      await apiFetch('/api/v1/auth/users', {
        method: 'POST',
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          full_name: newFullName,
          role: newRole,
        }),
      })
      setMsg({ type: 'ok', text: `Account created successfully: ${newUsername} (${newRole})` })
      setNewUsername('')
      setNewPassword('')
      setNewFullName('')
      setNewRole('karigar')
      loadUsers()
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to create user' })
    } finally {
      setCreating(false)
    }
  }

  async function toggleActive(user: User) {
    try {
      await apiFetch(`/api/v1/auth/users/${user.id}?is_active=${!user.is_active}`, { method: 'PATCH' })
      setMsg({ type: 'ok', text: `${user.username} ${!user.is_active ? 'activated' : 'deactivated'}` })
      loadUsers()
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to update user' })
    }
  }

  function roleBadgeColor(role: string): string {
    const map: Record<string, string> = {
      owner: '#7c3aed',
      admin: '#2563eb',
      production_manager: '#0891b2',
      karigar: '#d97706',
      office: '#059669',
      qc: '#be185d',
      accounts: '#64748b',
    }
    return map[role] || '#64748b'
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2 className="mb-1" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-main)' }}>
            👥 User Management
          </h2>
          <div className="text-muted" style={{ fontSize: 14 }}>
            Create karigar accounts, manage roles, and control active access
          </div>
        </div>
      </div>

      {msg && (
        <div className="mb-3" style={{
          padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600,
          background: msg.type === 'ok' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'ok' ? '#15803d' : '#b91c1c',
          border: `1px solid ${msg.type === 'ok' ? '#86efac' : '#fca5a5'}`,
        }}>
          {msg.text}
        </div>
      )}

      {/* ── Top Full-Width Card: Create New Account ── */}
      <div className="panel mb-4" style={{ borderRadius: 12, border: '1px solid var(--border-gold)' }}>
        <div className="panel-title mb-3" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
          ➕ Create New User Account
        </div>
        <form onSubmit={createUser}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }} className="align-items-end">
            <div>
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Username *</label>
              <input
                id="new-username"
                className="form-control"
                placeholder="e.g. karigar3"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Full Name</label>
              <input
                id="new-fullname"
                className="form-control"
                placeholder="e.g. Ramesh Kumar"
                value={newFullName}
                onChange={e => setNewFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Password *</label>
              <input
                id="new-password"
                type="password"
                className="form-control"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Role *</label>
              <select
                id="new-role"
                className="form-select"
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>{r.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>

            <div>
              <button
                id="btn-create-user"
                type="submit"
                className="btn btn-primary w-100"
                disabled={creating || !newUsername || !newPassword}
                style={{ padding: '9px 16px', fontWeight: 600 }}
              >
                {creating ? 'Creating…' : '➕ Create Account'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Bottom Full-Width Table: All Users ── */}
      <div className="panel" style={{ borderRadius: 12 }}>
        <div className="panel-title mb-3" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
          📋 All Platform Users ({users.length})
        </div>
        {loading ? (
          <div>{[1, 2, 3].map(i => <div key={i} className="skeleton mb-2" style={{ height: 48, borderRadius: 8 }} />)}</div>
        ) : error ? (
          <div style={{ color: '#dc2626', padding: 12 }}>{error}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.5 }}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>👤 {u.full_name || u.username}</div>
                      <div className="text-muted" style={{ fontSize: 12 }}>@{u.username}</div>
                    </td>
                    <td>
                      <span style={{
                        background: roleBadgeColor(u.role), color: '#fff',
                        padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, textTransform: 'capitalize',
                      }}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        color: u.is_active ? '#15803d' : '#b91c1c',
                        background: u.is_active ? '#dcfce7' : '#fee2e2',
                        padding: '4px 10px', borderRadius: 12,
                        fontWeight: 700, fontSize: 12, display: 'inline-block',
                      }}>
                        {u.is_active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className={`btn btn-sm ${u.is_active ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => toggleActive(u)}
                        style={{ fontSize: 12, padding: '4px 12px' }}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
