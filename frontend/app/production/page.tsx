'use client'
import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import TicketCard, { Ticket } from '../components/TicketCard'
import { StatusBadge, PriorityBadge } from '../components/StatusBadge'
import { apiFetch, STATUS_OPTIONS, CATEGORIES, PRIORITIES, formatDate, categoryIcon } from '../lib/api'

export default function ProductionList() {
  const [items, setItems] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [view, setView] = useState<'list' | 'grid'>('list')

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const qs = new URLSearchParams({ limit: '100', offset: '0' })
      if (search) qs.set('search', search)
      if (statusFilter) qs.set('status', statusFilter)
      if (categoryFilter) qs.set('category', categoryFilter)
      if (priorityFilter) qs.set('priority', priorityFilter)
      const data = await apiFetch<{ items: Ticket[]; total: number }>(
        `/api/v1/production-tickets?${qs.toString()}`
      )
      setItems(data.items)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, categoryFilter, priorityFilter])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Production Tickets</h2>
          <div className="text-muted" style={{ fontSize: 14 }}>
            {total} total · {items.length} shown
          </div>
        </div>
        <div className="d-flex gap-2">
          <button
            className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('list')}
          >List</button>
          <button
            className={`btn btn-sm ${view === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('grid')}
          >Grid</button>
        </div>
      </div>

      {/* Filters */}
      <div className="panel mb-4">
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <div className="search-input flex-grow-1" style={{ maxWidth: 280 }}>
            <span className="search-icon">🔍</span>
            <input
              className="form-control"
              placeholder="Search PT number or title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="form-select w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-select w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="form-select w-auto" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); setPriorityFilter(''); }}>
            Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3" style={{ color: '#dc2626', fontSize: 14, fontWeight: 600 }}>{error}</div>
      )}

      {loading ? (
        <div className={`d-flex ${view === 'grid' ? 'flex-wrap gap-3' : 'flex-column gap-2'}`}>
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton" style={{ height: 90 }} />)}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🗄️</div>
          <div>No production tickets match your filters.</div>
        </div>
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {items.map((t) => <TicketCard key={t.id} ticket={t} />)}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link href={`/production/${t.id}`} className="font-mono fw-semibold" style={{ color: 'var(--brand-primary)' }}>
                      {t.ticket_number}
                    </Link>
                  </td>
<td style={{ maxWidth: 260 }}>{t.title || '—'}</td>
                  <td>
                    <span className="me-2">{categoryIcon(t.category)}</span>
                    {t.category || '—'}
                  </td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="text-muted" style={{ fontSize: 13 }}>{formatDate(t.expected_delivery)}</td>
                  <td className="text-end">
                    <Link href={`/production/${t.id}`} className="btn btn-ghost btn-sm">Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
