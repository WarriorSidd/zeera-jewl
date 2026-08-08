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
      setMsg({ type: 'ok', text: `Account created: ${newUsername} (${newRole})` })
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
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">👥 User Management</h2>
          <div className="text-muted" style={{ fontSize: 14 }}>Create karigar accounts and manage access</div>
        </div>
      </div>

      {msg && (
        <div className="mb-3" style={{
          padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600,
          background: msg.type === 'ok' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'ok' ? '#15803d' : '#b91c1c',
        }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Create user form */}
        <div className="panel" style={{ flex: '0 0 340px' }}>
          <div className="panel-title">➕ Create New Account</div>
          <form onSubmit={createUser} className="d-flex flex-column gap-3">
            <div>
              <label className="form-label">Username *</label>
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
              <label className="form-label">Full Name</label>
              <input
                id="new-fullname"
                className="form-control"
                placeholder="e.g. Ramesh Kumar"
                value={newFullName}
                onChange={e => setNewFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Password *</label>
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
              <label className="form-label">Role *</label>
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
            <button
              id="btn-create-user"
              type="submit"
              className="btn btn-primary"
              disabled={creating || !newUsername || !newPassword}
            >
              {creating ? 'Creating…' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Users table */}
        <div className="panel" style={{ flex: '1 1 400px' }}>
          <div className="panel-title">All Users ({users.length})</div>
          {loading ? (
            <div>{[1,2,3].map(i => <div key={i} className="skeleton mb-2" style={{ height: 48 }} />)}</div>
          ) : error ? (
            <div style={{ color: '#dc2626' }}>{error}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.5 }}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.full_name || u.username}</div>
                        <div className="text-muted" style={{ fontSize: 12 }}>@{u.username}</div>
                      </td>
                      <td>
                        <span style={{
                          background: roleBadgeColor(u.role), color: '#fff',
                          padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        }}>
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          color: u.is_active ? '#15803d' : '#b91c1c',
                          fontWeight: 600, fontSize: 13,
                        }}>
                          {u.is_active ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => toggleActive(u)}
                          style={{ fontSize: 12, color: u.is_active ? '#b91c1c' : '#15803d' }}
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
    </div>
  )
}
