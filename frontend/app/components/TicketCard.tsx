'use client'
import React from 'react'
import Link from 'next/link'
import { StatusBadge, PriorityBadge } from './StatusBadge'
import { formatDate, categoryIcon } from '../lib/api'

export type Ticket = {
  id: string
  ticket_number: string
  title?: string
  description?: string
  status: string
  priority?: string
  category?: string
  expected_delivery?: string
  created_at?: string
  updated_at?: string
}

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <Link href={`/production/${ticket.id}`} className="card card-hover d-block mb-2 w-100">
      <div className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="font-mono fw-semibold" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {ticket.ticket_number}
          </span>
          <PriorityBadge priority={ticket.priority} />
        </div>
        <div className="d-flex align-items-center gap-2 mb-1">
          <span style={{ fontSize: 20, filter: 'drop-shadow(0 0 6px rgba(230,196,88,0.5))' }}>
            {categoryIcon(ticket.category)}
          </span>
          <div className="fw-semibold" style={{ fontSize: 14 }}>
            {ticket.title || 'Untitled Production Ticket'}
          </div>
        </div>
        {ticket.description && (
          <div className="text-secondary mb-2" style={{ fontSize: 13 }}>
            {ticket.description.length > 90
              ? ticket.description.slice(0, 90) + '…'
              : ticket.description}
          </div>
        )}
        <div className="d-flex justify-content-between align-items-center mt-2">
          <StatusBadge status={ticket.status} />
          <span className="text-muted" style={{ fontSize: 12 }}>
            {ticket.category && <span className="me-2">{ticket.category}</span>}
            Due: {formatDate(ticket.expected_delivery)}
          </span>
        </div>
      </div>
    </Link>
  )
}
