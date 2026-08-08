'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { API_URL, storeUser, CurrentUser } from '../lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // 1. Login → get token
      const form = new URLSearchParams()
      form.set('username', username)
      form.set('password', password)
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || 'Invalid credentials')
      }
      const data = await res.json()
      localStorage.setItem('token', data.access_token)

      // 2. Fetch /me → get role & full profile
      const meRes = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
      if (meRes.ok) {
        const me: CurrentUser = await meRes.json()
        storeUser(me)
      } else {
        // Fallback: store minimal info
        localStorage.setItem('username', username)
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
      <div className="panel w-100" style={{ maxWidth: 400, border: '1px solid var(--border-gold)', boxShadow: 'var(--shadow-pop)' }}>
        <div className="text-center mb-4">
          <div className="brand-badge mx-auto mb-3" style={{
            width: 56, height: 56, borderRadius: '50%', background: 'var(--brand-gold-gradient)',
            color: '#241a06', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, boxShadow: 'var(--shadow-gold)', border: '1px solid var(--brand-gold-light)',
            fontFamily: 'var(--font-sans)',
          }}>ZJ</div>
          <div className="hero-kicker" style={{ marginBottom: 8 }}>✦ Atelier of Fine Jewellery ✦</div>
          <h3 className="mb-1">Welcome back</h3>
          <div className="text-muted" style={{ fontSize: 14 }}>Sign in to the zjewl Production Platform</div>
        </div>

        <form onSubmit={login}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              id="login-username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your username"
              required
              autoComplete="username"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="mb-3" style={{ color: '#dc2626', fontSize: 13, fontWeight: 600 }}>{error}</div>
          )}

          <button id="login-submit" type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center text-muted" style={{ fontSize: 12 }}>
          <div>Test accounts: <strong>owner / Owner1234</strong> · <strong>karigar1 / Karigar1234</strong></div>
        </div>
      </div>
    </div>
  )
}
