'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge'
import { apiFetch, STATUS_OPTIONS, formatDate, formatDateTime, categoryIcon } from '../../lib/api'

type Ticket = {
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

type TimelineEntry = {
  id: string
  event_type: string
  actor_id?: string
  data?: string
  created_at: string
}

type Comment = {
  id: string
  content: string
  created_at: string
}

type Attachment = {
  id: string
  filename: string
  url: string
  mime_type?: string
  created_at: string
}

type HistoryEntry = {
  id: string
  change_type: string
  old_value?: string
  new_value?: string
  reason?: string
  created_at: string
}

type Assignment = {
  id: string
  assignee_id: string
  accepted: boolean
  created_at: string
}

const TABS = ['Overview', 'Timeline', 'Comments', 'Attachments', 'History'] as const
type Tab = typeof TABS[number]

function eventIcon(type: string) {
  const map: Record<string, string> = {
    created: '🟢', status_change: '🔄', comment_created: '💬', attachment_added: '📎',
    assigned: '👤', updated: '✏️',
  }
  return map[type] || '•'
}

export default function ProductionDetail() {
  const params = useParams()
  const id = params?.id as string
  const [pt, setPt] = useState<Ticket | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  const loadAll = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [ptData, tl, cm, att, hist, assign] = await Promise.all([
        apiFetch<Ticket>(`/api/v1/production-tickets/${id}`),
        apiFetch<TimelineEntry[]>(`/api/v1/production-tickets/${id}/timeline`).catch(() => []),
        apiFetch<Comment[]>(`/api/v1/production-tickets/${id}/comments`).catch(() => []),
        apiFetch<Attachment[]>(`/api/v1/production-tickets/${id}/attachments`).catch(() => []),
        apiFetch<HistoryEntry[]>(`/api/v1/production-tickets/${id}/history`).catch(() => []),
        apiFetch<Assignment[]>(`/api/v1/production-tickets/${id}/assignments`).catch(() => []),
      ])
      setPt(ptData)
      setTimeline(tl)
      setComments(cm)
      setAttachments(att)
      setHistory(hist)
      setAssignments(assign)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ticket')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  async function changeStatus() {
    if (!id || !newStatus) return
    setStatusMsg(null)
    try {
      await apiFetch(`/api/v1/production-tickets/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ new_status: newStatus }),
      })
      setStatusMsg({ type: 'ok', text: `Status changed to ${newStatus}` })
      setNewStatus('')
      loadAll()
    } catch (err) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'Status change failed' })
    }
  }

  async function addComment() {
    if (!id || !newComment.trim()) return
    setSendingComment(true)
    try {
      await apiFetch(`/api/v1/production-tickets/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment }),
      })
      setNewComment('')
      loadAll()
    } catch (err) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to add comment' })
    } finally {
      setSendingComment(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 40, width: 300 }} />
        <div className="skeleton mt-3" style={{ height: 200 }} />
      </div>
    )
  }

  if (!pt) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <div>{error || 'Production ticket not found.'}</div>
        <Link href="/production" className="btn btn-primary mt-3">Back to list</Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
<div className="font-mono fw-semibold" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {pt.ticket_number}
          </div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span style={{ fontSize: 26, filter: 'drop-shadow(0 0 8px rgba(230,196,88,0.5))' }}>
              {categoryIcon(pt.category)}
            </span>
            <h2 className="mb-0">{pt.title || 'Untitled Production Ticket'}</h2>
          </div>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <StatusBadge status={pt.status} />
            {pt.priority && <PriorityBadge priority={pt.priority} />}
            {pt.category && <span className="tag">{pt.category}</span>}
          </div>
        </div>
        <Link href="/production" className="btn btn-secondary btn-sm">← Back</Link>
      </div>

      {statusMsg && (
        <div className="mb-3" style={{
          padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600,
          background: statusMsg.type === 'ok' ? '#dcfce7' : '#fee2e2',
          color: statusMsg.type === 'ok' ? '#15803d' : '#b91c1c',
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'Overview' && (
        <div className="row gap-3" style={{ display: 'flex', gap: 20 }}>
          <div className="panel flex-grow-1">
            <div className="panel-title">Jewellery Specifications</div>
            <div className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                <span className="text-secondary">Description</span>
                <span style={{ maxWidth: '60%', textAlign: 'right' }}>{pt.description || '—'}</span>
              </div>
              <div className="d-flex justify-content-between" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                <span className="text-secondary">Category</span>
                <span>{pt.category || '—'}</span>
              </div>
              <div className="d-flex justify-content-between" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                <span className="text-secondary">Priority</span>
                <span>{pt.priority || '—'}</span>
              </div>
              <div className="d-flex justify-content-between" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                <span className="text-secondary">Expected Delivery</span>
                <span>{formatDate(pt.expected_delivery)}</span>
              </div>
              <div className="d-flex justify-content-between" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                <span className="text-secondary">Created</span>
                <span className="text-muted">{formatDateTime(pt.created_at)}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-secondary">Last Updated</span>
                <span className="text-muted">{formatDateTime(pt.updated_at)}</span>
              </div>
            </div>
          </div>

          <div className="panel" style={{ minWidth: 280 }}>
            <div className="panel-title">Status & Actions</div>
            <div className="mb-3">
              <label className="form-label">Change Status</label>
              <div className="d-flex gap-2">
                <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="">Select status</option>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="btn btn-primary" onClick={changeStatus} disabled={!newStatus}>Apply</button>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Assignments</label>
              {assignments.length === 0 ? (
                <div className="text-muted" style={{ fontSize: 13 }}>No karigars assigned yet.</div>
              ) : (
                assignments.map((a) => (
                  <div key={a.id} className="d-flex justify-content-between align-items-center py-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <span className="font-mono" style={{ fontSize: 13 }}>{a.assignee_id}</span>
                    <span className={`tag ${a.accepted ? 'status-ready' : 'status-review'}`}>
                      {a.accepted ? 'Accepted' : 'Pending'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {activeTab === 'Timeline' && (
        <div className="panel">
          <div className="panel-title">Activity Timeline</div>
          {timeline.length === 0 ? (
            <div className="empty-state">No activity recorded yet.</div>
          ) : (
            <div className="timeline">
              {timeline.map((t) => (
                <div key={t.id} className={`timeline-item event-${t.event_type}`}>
                  <div className="d-flex align-items-center gap-2">
                    <span>{eventIcon(t.event_type)}</span>
                    <span className="fw-semibold" style={{ textTransform: 'capitalize' }}>{t.event_type.replace(/_/g, ' ')}</span>
                  </div>
                  {t.data && <div className="text-secondary mt-1" style={{ fontSize: 14 }}>{t.data}</div>}
                  <div className="text-muted mt-1" style={{ fontSize: 12 }}>{formatDateTime(t.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      {activeTab === 'Comments' && (
        <div className="panel">
          <div className="panel-title">Discussion</div>
          <div className="d-flex gap-2 mb-4">
            <textarea
              className="form-control flex-grow-1"
              rows={3}
              placeholder="Add a comment…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button className="btn btn-primary align-self-end" onClick={addComment} disabled={sendingComment || !newComment.trim()}>
              {sendingComment ? 'Sending…' : 'Post'}
            </button>
          </div>
          {comments.length === 0 ? (
            <div className="empty-state">No comments yet.</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="mb-3" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                <div className="text-secondary" style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{c.content}</div>
                <div className="text-muted mt-1" style={{ fontSize: 12 }}>{formatDateTime(c.created_at)}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Attachments */}
      {activeTab === 'Attachments' && (
        <div className="panel">
          <div className="panel-title">Attachments</div>
          {attachments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📎</div>
              <div>No attachments yet.</div>
            </div>
          ) : (
            attachments.map((a) => (
              <div key={a.id} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="d-flex align-items-center gap-2">
                  <span>📄</span>
                  <div>
                    <div className="fw-semibold" style={{ fontSize: 14 }}>{a.filename}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>
                      {a.mime_type || 'file'} · {formatDateTime(a.created_at)}
                    </div>
                  </div>
                </div>
                <a href={a.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Open</a>
              </div>
            ))
          )}
        </div>
      )}

      {/* History */}
      {activeTab === 'History' && (
        <div className="panel">
          <div className="panel-title">Audit History</div>
          {history.length === 0 ? (
            <div className="empty-state">No audit history recorded.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Old Value</th>
                    <th>New Value</th>
                    <th>Reason</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="fw-semibold" style={{ textTransform: 'capitalize' }}>{h.change_type.replace(/_/g, ' ')}</td>
                      <td className="text-muted" style={{ fontSize: 13 }}>{h.old_value || '—'}</td>
                      <td className="text-muted" style={{ fontSize: 13 }}>{h.new_value || '—'}</td>
                      <td className="text-muted" style={{ fontSize: 13 }}>{h.reason || '—'}</td>
                      <td className="text-muted" style={{ fontSize: 13 }}>{formatDateTime(h.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
