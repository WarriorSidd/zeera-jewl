'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import StatCard from '../components/StatCard'
import { StatusBadge } from '../components/StatusBadge'
import { apiFetch, STATUS_OPTIONS, formatDateTime } from '../lib/api'

type Ticket = {
  id: string
  ticket_number: string
  title?: string
  status: string
  priority?: string
  category?: string
  expected_delivery?: string
  created_at?: string
}

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await apiFetch<{ items: Ticket[]; total: number }>(
        '/api/v1/production-tickets?limit=200'
      )
      setTickets(data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const total = tickets.length
  const byStatus = STATUS_OPTIONS.reduce<Record<string, number>>((acc, s) => {
    acc[s] = tickets.filter((t) => t.status === s).length
    return acc
  }, {})

  const openTickets = tickets.filter((t) => !['Delivered', 'Closed', 'Archived'].includes(t.status))
  const inProduction = tickets.filter((t) =>
    ['Production', 'Stone Setting', 'Polishing', 'Quality Check', 'Accepted', 'Assigned'].includes(t.status)
  )
  const delivered = tickets.filter((t) => ['Delivered', 'Closed'].includes(t.status))
  const overdue = tickets.filter((t) => {
    if (!t.expected_delivery) return false
    const due = new Date(t.expected_delivery)
    if (isNaN(due.getTime())) return false
    return due < new Date() && !['Delivered', 'Closed', 'Archived'].includes(t.status)
  })

  const recent = [...tickets]
    .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, 8)

  const categoryCounts = tickets.reduce<Record<string, number>>((acc, t) => {
    const c = t.category || 'Uncategorized'
    acc[c] = (acc[c] || 0) + 1
    return acc
  }, {})
  const topCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const maxStatus = Math.max(1, ...STATUS_OPTIONS.map((s) => byStatus[s] || 0))

return (
    <div>
      {/* Luxury hero banner */}
      <div className="jewelry-hero">
        <div className="hero-content d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <div className="hero-kicker">✦ The Atelier of Fine Jewellery ✦</div>
            <h1>Executive Dashboard</h1>
            <p className="hero-sub">Crafting every masterpiece as a trackable Production Ticket</p>
          </div>
          <div className="hero-gem">💎</div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="text-muted" style={{ fontSize: 14 }}>Production Ticket overview & KPIs</div>
        </div>
        <Link href="/production" className="btn btn-secondary btn-sm">View all tickets</Link>
      </div>

      {error && (
        <div className="mb-3" style={{ color: '#dc2626', fontSize: 14, fontWeight: 600 }}>{error}</div>
      )}

      {/* KPI cards */}
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <StatCard label="Total Tickets" value={total} sub="All production tickets" accent icon="💎" />
        <StatCard label="Open" value={openTickets.length} sub="In active workflow" icon="📿" />
        <StatCard label="In Production" value={inProduction.length} sub="Assigned to karigars" icon="⚒️" />
        <StatCard label="Overdue" value={overdue.length} sub="Past expected delivery" icon="⏳" />
        <StatCard label="Delivered" value={delivered.length} sub="Completed & closed" icon="✅" />
      </div>

      <div className="row mt-4">
        {/* Status distribution */}
        <div className="panel" style={{ flex: 1, minWidth: 320 }}>
          <div className="panel-title">Tickets by Status</div>
          {STATUS_OPTIONS.filter((s) => (byStatus[s] || 0) > 0).map((s) => (
            <div key={s} className="mb-2">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <StatusBadge status={s} />
                <span className="fw-semibold" style={{ fontSize: 14 }}>{byStatus[s]}</span>
              </div>
              <div className="w-100" style={{ height: 8, background: 'var(--bg-surface-hover)', borderRadius: 999 }}>
                <div
                  style={{
                    width: `${((byStatus[s] || 0) / maxStatus) * 100}%`,
                    height: '100%',
                    background: 'var(--brand-gradient)',
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          ))}
          {tickets.length === 0 && !loading && <div className="empty-state">No tickets yet</div>}
        </div>

        {/* Category distribution */}
        <div className="panel" style={{ flex: 1, minWidth: 280 }}>
          <div className="panel-title">By Category</div>
          {topCategories.map(([cat, count]) => (
            <div key={cat} className="d-flex justify-content-between align-items-center py-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 14 }}>{cat}</span>
              <span className="fw-semibold" style={{ fontSize: 14 }}>{count}</span>
            </div>
          ))}
          {topCategories.length === 0 && !loading && <div className="empty-state">No data</div>}
        </div>
      </div>

      {/* Recent tickets */}
      <div className="panel mt-4">
        <div className="panel-title">
          <span>Recent Production Tickets</span>
          <Link href="/production" className="btn btn-ghost btn-sm">See all</Link>
        </div>

        {loading ? (
          <div className="d-flex flex-column gap-2">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 48 }} />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🗄️</div>
            <div>No production tickets yet. Create your first ticket to get started.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link href={`/production/${t.id}`} className="font-mono fw-semibold" style={{ color: 'var(--brand-primary)' }}>
                        {t.ticket_number}
                      </Link>
                    </td>
                    <td>{t.title || '—'}</td>
                    <td>{t.category || '—'}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td className="text-muted" style={{ fontSize: 13 }}>{formatDateTime(t.created_at)}</td>
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
