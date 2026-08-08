'use client'
import React, { useState } from 'react'
import { apiFetch, CATEGORIES, PRIORITIES } from '../lib/api'

type Props = {
  show: boolean
  columnId?: string
  onClose: () => void
  onCreate?: (columnId: string | undefined, title: string, description?: string) => void
}

type CreatedTicket = {
  id: string
  ticket_number: string
}

export default function CreateTicketModal({ show, columnId, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [tags, setTags] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!show) return null

  // Handle local image file preview -> base64 or URL
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      let formattedDate: string | undefined = undefined
      if (expectedDelivery) {
        const d = new Date(expectedDelivery)
        if (!isNaN(d.getTime())) {
          formattedDate = d.toISOString()
        }
      }

      const payload: Record<string, unknown> = {
        title: title || 'Untitled Production Ticket',
        description: description || undefined,
        category: category || undefined,
        priority: priority || undefined,
        expected_delivery: formattedDate,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      }

      // Always call with trailing slash to prevent HTTP 307 redirects
      const created = await apiFetch<CreatedTicket>('/api/v1/production-tickets/', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      // Attach design reference image if provided
      if (imageUrl && created?.id) {
        try {
          await apiFetch(`/api/v1/production-tickets/${created.id}/attachments`, {
            method: 'POST',
            body: JSON.stringify({
              filename: 'Design Reference Photo',
              url: imageUrl,
            }),
          })
        } catch {
          // ignore attachment error if ticket created
        }
      }

      if (onCreate) onCreate(columnId, title || 'Untitled Production Ticket', description)
      setTitle('')
      setDescription('')
      setCategory('')
      setPriority('Medium')
      setExpectedDelivery('')
      setImageUrl('')
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
      <div className="modal-dialog fade-in" style={{ maxWidth: 540 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">Create Production Ticket</h4>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={submit}>
          <div className="mb-3">
            <label className="form-label">Ticket Title *</label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 22K Kundan Gold Necklace with Rubies"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Manufacturing Description / Notes</label>
            <textarea
              className="form-control"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Design specifications, customer weight requirements, stone fitting details…"
            />
          </div>

          {/* Design Photo Attachment Section */}
          <div className="mb-3 p-3" style={{ background: 'var(--bg-subtle)', borderRadius: 8, border: '1px dashed var(--border-gold)' }}>
            <label className="form-label fw-semibold" style={{ color: 'var(--brand-gold)' }}>
              📷 Upload Design Reference Photo / Image URL
            </label>
            <div className="d-flex gap-2 mb-2 flex-wrap">
              <input
                className="form-control"
                placeholder="Paste Image URL (https://…)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                style={{ flex: '1 1 200px' }}
              />
              <label className="btn btn-secondary btn-sm d-flex align-items-center gap-1" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                📁 Choose File
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            {imageUrl && (
              <div className="mt-2 d-flex align-items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Design Preview"
                  style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-subtle)' }}
                />
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Image ready for attachment</div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setImageUrl('')} style={{ color: '#ef4444' }}>Remove</button>
              </div>
            )}
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
                  placeholder="kundan, 22k, ruby"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-3 p-2" style={{ color: '#b91c1c', background: '#fee2e2', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
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
