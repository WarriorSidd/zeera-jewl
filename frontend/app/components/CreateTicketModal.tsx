'use client'
import React, { useState } from 'react'
import { apiFetch, CATEGORIES, PRIORITIES } from '../lib/api'

type Props = {
  show: boolean
  columnId?: string
  onClose: () => void
  onCreate?: (columnId: string | undefined, title: string, description?: string) => void
}

export default function CreateTicketModal({ show, columnId, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [tags, setTags] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!show) return null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        title: title || 'Untitled Production Ticket',
        description: description || undefined,
        category: category || undefined,
        priority: priority || undefined,
        expected_delivery: expectedDelivery ? new Date(expectedDelivery).toISOString() : undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      }
      await apiFetch('/api/v1/production-tickets', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      if (onCreate) onCreate(columnId, title || 'Untitled Production Ticket', description)
      setTitle('')
      setDescription('')
      setCategory('')
      setPriority('Medium')
      setExpectedDelivery('')
      setTags('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ticket')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-dialog fade-in">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">Create Production Ticket</h4>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">Title *</label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Diamond Ring with Kundan work"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Manufacturing instructions, customer notes, specifications…"
            />
          </div>

          <div className="row gap-3 mb-3">
            <div className="d-flex gap-3">
              <div className="flex-grow-1">
                <label className="form-label">Category</label>
                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-grow-1">
                <label className="form-label">Priority</label>
                <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="row gap-3 mb-3">
            <div className="d-flex gap-3">
              <div className="flex-grow-1">
                <label className="form-label">Expected Delivery</label>
                <input
                  type="date"
                  className="form-control"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                />
              </div>
              <div className="flex-grow-1">
                <label className="form-label">Tags</label>
                <input
                  className="form-control"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="gold, kundan (comma separated)"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-3" style={{ color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
