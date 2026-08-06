'use client'
import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PriorityBadge } from '../components/StatusBadge'
import { apiFetch, formatDate, categoryIcon } from '../lib/api'

type Ticket = {
  id: string
  ticket_number: string
  title?: string
  status: string
  priority?: string
  category?: string
  expected_delivery?: string
}

const WORKFLOW_COLUMNS = [
  'Draft', 'Review', 'Assigned', 'Accepted', 'Production',
  'Stone Setting', 'Polishing', 'Quality Check', 'Ready', 'Delivered', 'Closed', 'Archived'
]

function SortableCard({ ticket }: { ticket: Ticket }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ticket.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }
  return (
    <div ref={setNodeRef} style={style} className="card ticket-card mb-2">
      <div className="p-2">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ticket.ticket_number}</span>
          <div {...attributes} {...listeners} className="drag-handle">☰</div>
        </div>
<div className="d-flex align-items-center gap-1 mb-1">
          <span style={{ fontSize: 15, filter: 'drop-shadow(0 0 5px rgba(230,196,88,0.5))' }}>
            {categoryIcon(ticket.category)}
          </span>
          <Link href={`/production/${ticket.id}`} className="fw-semibold d-block" style={{ fontSize: 13 }}>
            {ticket.title || 'Untitled'}
          </Link>
        </div>
        <div className="d-flex justify-content-between align-items-center">
          <PriorityBadge priority={ticket.priority} />
          <span className="text-muted" style={{ fontSize: 11 }}>{formatDate(ticket.expected_delivery)}</span>
        </div>
      </div>
    </div>
  )
}

export default function BoardPage() {
  const [columns, setColumns] = useState<Record<string, Ticket[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ items: Ticket[] }>('/api/v1/production-tickets?limit=200')
      const grouped: Record<string, Ticket[]> = {}
      WORKFLOW_COLUMNS.forEach((c) => grouped[c] = [])
      data.items.forEach((t) => {
        if (!grouped[t.status]) grouped[t.status] = []
        grouped[t.status].push(t)
      })
      setColumns(grouped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const activeId = String(active.id)
    const overId = String(over.id)

    let sourceStatus: string | null = null
    let targetStatus: string | null = null
    let movingTicket: Ticket | null = null

    Object.entries(columns).forEach(([status, tickets]) => {
      tickets.forEach((t) => {
        if (t.id === activeId) { sourceStatus = status; movingTicket = t }
      })
    })
    if (WORKFLOW_COLUMNS.includes(overId)) targetStatus = overId
    else {
      Object.entries(columns).forEach(([status, tickets]) => {
        if (tickets.some((t) => t.id === overId)) targetStatus = status
      })
    }
if (!sourceStatus || !targetStatus || !movingTicket) return
    if (sourceStatus === targetStatus) return

    const ticketToMove: Ticket = movingTicket
    const withStatus = { ...ticketToMove, status: targetStatus }
    const newColumns: Record<string, Ticket[]> = {}
    Object.keys(columns).forEach((k) => newColumns[k] = [...columns[k]])
    newColumns[sourceStatus] = newColumns[sourceStatus].filter((t) => t.id !== activeId)
    newColumns[targetStatus] = [withStatus, ...newColumns[targetStatus]]
    setColumns(newColumns)

    apiFetch(`/api/v1/production-tickets/${activeId}/status`, {
      method: 'POST',
      body: JSON.stringify({ new_status: targetStatus }),
    }).catch(() => {
      load()
      alert('Failed to update status. The workflow may not allow this transition.')
    })
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Production Board</h2>
          <div className="text-muted" style={{ fontSize: 14 }}>Drag tickets between stages to update workflow</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>Refresh</button>
      </div>

      {error && (
        <div className="mb-3" style={{ color: '#dc2626', fontSize: 14, fontWeight: 600 }}>{error}</div>
      )}

      {loading ? (
        <div className="d-flex gap-3" style={{ overflowX: 'auto' }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ minWidth: 240, height: 300 }} />)}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <div className="d-flex gap-3" style={{ overflowX: 'auto', paddingBottom: 16 }}>
            {WORKFLOW_COLUMNS.map((status) => {
              const cards = columns[status] || []
              return (
                <div key={status} className="board-column" style={{ minWidth: 240, flexShrink: 0 }}>
                  <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                    <span className="fw-semibold" style={{ fontSize: 13 }}>{status}</span>
                    <span className="tag">{cards.length}</span>
                  </div>
                  <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                    <div style={{ minHeight: 40 }}>
                      {cards.map((ticket) => (
                        <SortableCard key={ticket.id} ticket={ticket} />
                      ))}
                      {cards.length === 0 && (
                        <div className="text-muted text-center" style={{ fontSize: 12, padding: '16px 0' }}>
                          No tickets
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              )
            })}
          </div>
        </DndContext>
      )}
    </div>
  )
}
