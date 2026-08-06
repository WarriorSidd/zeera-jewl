import React from 'react'
import { statusClass, priorityClass } from '../lib/api'

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge ${statusClass(status)}`}>{status || 'Draft'}</span>
}

export function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority) return null
  return <span className={`priority-badge ${priorityClass(priority)}`}>{priority}</span>
}
