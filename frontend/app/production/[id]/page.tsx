'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge'
import {
  apiFetch, STATUS_OPTIONS, formatDate, formatDateTime, categoryIcon,
  getStoredUser, isManager, isKarigar, isOwnerOrAdmin, CurrentUser,
} from '../../lib/api'

// ── Types ────────────────────────────────────────────────────────────────────

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
  author_id?: string
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
  changed_by?: string
  old_value?: string
  new_value?: string
  reason?: string
  created_at: string
}

type Assignment = {
  id: string
  assignee_id: string
  assigned_by?: string
  accepted: boolean
  accepted_at?: string
  created_at: string
}

type UserInfo = {
  id: string
  username: string
  full_name?: string
  role: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Timeline', 'Comments', 'Attachments', 'History'] as const
type Tab = typeof TABS[number]

function eventIcon(type: string) {
  const map: Record<string, string> = {
    created: '🟢', status_change: '🔄', comment_created: '💬', attachment_added: '📎',
    assigned: '👤', updated: '✏️', karigar_accepted: '✅', karigar_rejected: '❌',
    karigar_started: '▶️', karigar_completed: '🏁', owner_ping: '🔔',
  }
  return map[type] || '•'
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ProductionDetail() {
  const params = useParams()
  const id = params?.id as string

  const [pt, setPt] = useState<Ticket | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [karigars, setKarigars] = useState<UserInfo[]>([])
  const [allUsers, setAllUsers] = useState<UserInfo[]>([])

  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Status change (manager)
  const [newStatus, setNewStatus] = useState('')
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Comment
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  // Assignment (manager)
  const [assigneeId, setAssigneeId] = useState('')
  const [assigning, setAssigning] = useState(false)

  // Attachment (URL-based)
  const [attachUrl, setAttachUrl] = useState('')
  const [attachName, setAttachName] = useState('')
  const [addingAttach, setAddingAttach] = useState(false)

  // Karigar action
  const [karigarActionMsg, setKarigarActionMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [karigarNote, setKarigarNote] = useState('')

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    setCurrentUser(getStoredUser())
  }, [])

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

  // Load karigars for assignment dropdown (managers only)
  const loadKarigars = useCallback(async () => {
    try {
      const data = await apiFetch<{ items: UserInfo[]; total: number }>('/api/v1/auth/users?role=karigar')
      setKarigars(data.items)
    } catch {
      // ignore
    }
    try {
      const data = await apiFetch<{ items: UserInfo[]; total: number }>('/api/v1/auth/users')
      setAllUsers(data.items)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    loadAll()
    loadKarigars()
  }, [loadAll, loadKarigars])

  // ── Helper: resolve user display name ──────────────────────────────────────

  function userName(userId?: string): string {
    if (!userId) return '—'
    const u = allUsers.find(u => u.id === userId)
    return u ? (u.full_name || u.username) : userId.slice(0, 8) + '…'
  }

  // ── Actions ────────────────────────────────────────────────────────────────

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

  async function assignKarigar() {
    if (!id || !assigneeId) return
    setAssigning(true)
    setStatusMsg(null)
    try {
      await apiFetch(`/api/v1/production-tickets/${id}/assignments`, {
        method: 'POST',
        body: JSON.stringify({ assignee_ids: [assigneeId] }),
      })
      setAssigneeId('')
      setStatusMsg({ type: 'ok', text: 'Karigar assigned successfully. Ticket moved to Assigned.' })
      loadAll()
    } catch (err) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'Assignment failed' })
    } finally {
      setAssigning(false)
    }
  }

  async function pingKarigar() {
    if (!id) return
    try {
      await apiFetch(`/api/v1/production-tickets/${id}/ping`, { method: 'POST' })
      setStatusMsg({ type: 'ok', text: 'Karigar pinged for update.' })
      loadAll()
    } catch (err) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'Ping failed' })
    }
  }

  async function addAttachment() {
    if (!id || !attachUrl.trim() || !attachName.trim()) return
    setAddingAttach(true)
    try {
      await apiFetch(`/api/v1/production-tickets/${id}/attachments`, {
        method: 'POST',
        body: JSON.stringify({ filename: attachName, url: attachUrl }),
      })
      setAttachUrl('')
      setAttachName('')
      loadAll()
    } catch (err) {
      setStatusMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to add attachment' })
    } finally {
      setAddingAttach(false)
    }
  }

  async function karigarAction(action: 'accept' | 'reject' | 'start-work' | 'complete-work') {
    if (!id) return
    setKarigarActionMsg(null)
    try {
      const body = karigarNote ? JSON.stringify({ note: karigarNote, reason: karigarNote }) : undefined
      await apiFetch(`/api/v1/production-tickets/${id}/${action}`, {
        method: 'POST',
        body,
      })
      const messages: Record<string, string> = {
        'accept': 'Work accepted! Status → Accepted.',
        'reject': 'Work rejected.',
        'start-work': 'Work started! Status → Production.',
        'complete-work': 'Work marked complete! Status → Quality Check.',
      }
      setKarigarActionMsg({ type: 'ok', text: messages[action] })
      setKarigarNote('')
      loadAll()
    } catch (err) {
      setKarigarActionMsg({ type: 'err', text: err instanceof Error ? err.message : 'Action failed' })
    }
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const myAssignment = isKarigar(currentUser)
    ? assignments.find(a => a.assignee_id === currentUser?.id)
    : null

  const canAccept = isKarigar(currentUser) && pt?.status === 'Assigned' && myAssignment && !myAssignment.accepted
  const canReject = isKarigar(currentUser) && pt?.status === 'Assigned' && myAssignment && !myAssignment.accepted
  const canStart = isKarigar(currentUser) && pt?.status === 'Accepted' && myAssignment
  const canComplete = isKarigar(currentUser) && pt?.status === 'Production' && myAssignment

  // ── Render ─────────────────────────────────────────────────────────────────

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

      {/* Global message banner */}
      {statusMsg && (
        <div className="mb-3" style={{
          padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600,
          background: statusMsg.type === 'ok' ? '#dcfce7' : '#fee2e2',
          color: statusMsg.type === 'ok' ? '#15803d' : '#b91c1c',
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* ── Karigar Action Bar (top, prominent) ── */}
      {isKarigar(currentUser) && (
        <div className="panel mb-4" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-gold)' }}>
          <div className="panel-title" style={{ color: 'var(--brand-gold)' }}>🔨 Your Work Actions</div>

          {karigarActionMsg && (
            <div className="mb-3" style={{
              padding: '8px 12px', borderRadius: 6, fontSize: 14, fontWeight: 600,
              background: karigarActionMsg.type === 'ok' ? '#dcfce7' : '#fee2e2',
              color: karigarActionMsg.type === 'ok' ? '#15803d' : '#b91c1c',
            }}>
              {karigarActionMsg.text}
            </div>
          )}

          {!myAssignment ? (
            <div className="text-muted" style={{ fontSize: 14 }}>This ticket is not assigned to you.</div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {/* Note / reason input */}
              <div>
                <label className="form-label" style={{ fontSize: 13 }}>Note (optional — shown in rejection/completion)</label>
                <input
                  className="form-control"
                  placeholder="Add a note or reason…"
                  value={karigarNote}
                  onChange={e => setKarigarNote(e.target.value)}
                  style={{ fontSize: 14 }}
                />
              </div>

              <div className="d-flex gap-2 flex-wrap">
                {canAccept && (
                  <button
                    id="btn-accept"
                    className="btn btn-primary"
                    onClick={() => karigarAction('accept')}
                  >
                    ✅ Accept Work
                  </button>
                )}
                {canReject && (
                  <button
                    id="btn-reject"
                    className="btn btn-secondary"
                    style={{ borderColor: '#ef4444', color: '#ef4444' }}
                    onClick={() => karigarAction('reject')}
                  >
                    ❌ Reject Work
                  </button>
                )}
                {canStart && (
                  <button
                    id="btn-start"
                    className="btn btn-primary"
                    onClick={() => karigarAction('start-work')}
                  >
                    ▶️ Start Work
                  </button>
                )}
                {canComplete && (
                  <button
                    id="btn-complete"
                    className="btn btn-primary"
                    style={{ background: '#15803d', borderColor: '#15803d' }}
                    onClick={() => karigarAction('complete-work')}
                  >
                    🏁 Mark Complete
                  </button>
                )}
                {myAssignment.accepted && pt.status !== 'Production' && pt.status !== 'Accepted' && (
                  <div className="text-muted" style={{ fontSize: 13, alignSelf: 'center' }}>
                    Current status: <strong>{pt.status}</strong> — no action needed from you right now.
                  </div>
                )}
              </div>

              {/* Assignment status */}
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Assigned: {formatDateTime(myAssignment.created_at)}
                {myAssignment.accepted && ` · Accepted: ${formatDateTime(myAssignment.accepted_at)}`}
              </div>
            </div>
          )}
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

      {/* ── Overview Tab ── */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Left: ticket details */}
          <div className="panel" style={{ flex: '1 1 300px' }}>
            <div className="panel-title">Jewellery Specifications</div>
            <div className="d-flex flex-column gap-3">
              {[
                ['Description', pt.description || '—'],
                ['Category', pt.category || '—'],
                ['Priority', pt.priority || '—'],
                ['Expected Delivery', formatDate(pt.expected_delivery)],
                ['Created', formatDateTime(pt.created_at)],
                ['Last Updated', formatDateTime(pt.updated_at)],
              ].map(([label, value]) => (
                <div key={label} className="d-flex justify-content-between" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                  <span className="text-secondary">{label}</span>
                  <span style={{ maxWidth: '60%', textAlign: 'right' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Status & Assignment panel */}
          <div className="panel" style={{ minWidth: 280, flex: '0 0 300px' }}>
            <div className="panel-title">Status & Assignments</div>

            {/* Current status */}
            <div className="mb-3">
              <div className="text-secondary" style={{ fontSize: 13, marginBottom: 6 }}>Current Status</div>
              <StatusBadge status={pt.status} />
            </div>

            {/* Manager: change status */}
            {isManager(currentUser) && (
              <div className="mb-4">
                <label className="form-label">Change Status</label>
                <div className="d-flex gap-2">
                  <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    <option value="">Select status…</option>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button className="btn btn-primary" onClick={changeStatus} disabled={!newStatus}>Apply</button>
                </div>
              </div>
            )}

            {/* Assignments list */}
            <div className="mb-3">
              <div className="text-secondary" style={{ fontSize: 13, marginBottom: 6 }}>Assigned Karigars</div>
              {assignments.length === 0 ? (
                <div className="text-muted" style={{ fontSize: 13 }}>No karigars assigned yet.</div>
              ) : (
                assignments.map((a) => (
                  <div key={a.id} className="d-flex justify-content-between align-items-center py-1" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{userName(a.assignee_id)}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>Assigned {formatDate(a.created_at)}</div>
                    </div>
                    <span className={`tag ${a.accepted ? 'status-ready' : 'status-review'}`}>
                      {a.accepted ? '✅ Accepted' : '⏳ Pending'}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Manager: Assign karigar */}
            {isManager(currentUser) && (
              <div className="mb-3">
                <label className="form-label">Assign Karigar</label>
                <div className="d-flex gap-2">
                  <select
                    className="form-select"
                    value={assigneeId}
                    onChange={e => setAssigneeId(e.target.value)}
                  >
                    <option value="">Select karigar…</option>
                    {karigars.map(k => (
                      <option key={k.id} value={k.id}>
                        {k.full_name || k.username}
                      </option>
                    ))}
                  </select>
                  <button
                    id="btn-assign"
                    className="btn btn-primary"
                    disabled={!assigneeId || assigning}
                    onClick={assignKarigar}
                  >
                    {assigning ? '…' : 'Assign'}
                  </button>
                </div>
              </div>
            )}

            {/* Manager: Ping karigar */}
            {isManager(currentUser) && assignments.length > 0 && (
              <button id="btn-ping" className="btn btn-secondary btn-sm w-100 mt-1" onClick={pingKarigar}>
                🔔 Ping Karigar for Update
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Timeline Tab ── */}
      {activeTab === 'Timeline' && (
        <div className="panel">
          <div className="panel-title">Activity Timeline</div>
          {timeline.length === 0 ? (
            <div className="empty-state">No activity recorded yet.</div>
          ) : (
            <div className="timeline">
              {[...timeline].reverse().map((t) => (
                <div key={t.id} className={`timeline-item event-${t.event_type}`}>
                  <div className="d-flex align-items-center gap-2">
                    <span>{eventIcon(t.event_type)}</span>
                    <span className="fw-semibold" style={{ textTransform: 'capitalize' }}>{t.event_type.replace(/_/g, ' ')}</span>
                  </div>
                  {t.actor_id && (
                    <div className="text-secondary" style={{ fontSize: 12 }}>
                      By: {userName(t.actor_id)}
                    </div>
                  )}
                  {t.data && <div className="text-secondary mt-1" style={{ fontSize: 14 }}>{t.data}</div>}
                  <div className="text-muted mt-1" style={{ fontSize: 12 }}>{formatDateTime(t.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Comments Tab ── */}
      {activeTab === 'Comments' && (
        <div className="panel">
          <div className="panel-title">Discussion</div>
          <div className="d-flex gap-2 mb-4">
            <textarea
              className="form-control flex-grow-1"
              rows={3}
              placeholder="Add a comment or update…"
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
            [...comments].reverse().map((c) => (
              <div key={c.id} className="mb-3" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--brand-primary)' }}>
                    {userName(c.author_id)}
                  </div>
                  <div className="text-muted" style={{ fontSize: 11 }}>{formatDateTime(c.created_at)}</div>
                </div>
                <div className="text-secondary mt-1" style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{c.content}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Attachments Tab ── */}
      {activeTab === 'Attachments' && (
        <div className="panel">
          <div className="panel-title">Attachments / Evidence Images</div>

          {/* Upload form (URL-based) */}
          <div className="mb-4" style={{ background: 'var(--bg-subtle)', padding: 16, borderRadius: 8 }}>
            <div className="form-label">Add Image / Evidence Link</div>
            <div className="d-flex gap-2 flex-wrap">
              <input
                className="form-control"
                placeholder="Image or file URL (e.g. https://…)"
                value={attachUrl}
                onChange={e => setAttachUrl(e.target.value)}
                style={{ flex: '2 1 200px' }}
              />
              <input
                className="form-control"
                placeholder="Label / filename"
                value={attachName}
                onChange={e => setAttachName(e.target.value)}
                style={{ flex: '1 1 150px' }}
              />
              <button
                id="btn-add-attachment"
                className="btn btn-primary"
                disabled={!attachUrl.trim() || !attachName.trim() || addingAttach}
                onClick={addAttachment}
              >
                {addingAttach ? 'Adding…' : '+ Add'}
              </button>
            </div>
          </div>

          {attachments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📎</div>
              <div>No attachments yet. Upload images or paste evidence links above.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {attachments.map((a) => {
                const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(a.url) || a.mime_type?.startsWith('image/')
                return (
                  <div key={a.id} style={{
                    border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden',
                    background: 'var(--bg-elevated)',
                  }}>
                    {isImage ? (
                      <a href={a.url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={a.url}
                          alt={a.filename}
                          style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </a>
                    ) : (
                      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                        📄
                      </div>
                    )}
                    <div style={{ padding: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.filename}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{formatDate(a.created_at)}</div>
                      <a href={a.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm mt-1" style={{ fontSize: 12 }}>Open ↗</a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── History Tab ── */}
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
                    <th>Changed By</th>
                    <th>Old</th>
                    <th>New</th>
                    <th>Reason</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().map((h) => (
                    <tr key={h.id}>
                      <td className="fw-semibold" style={{ textTransform: 'capitalize' }}>{h.change_type.replace(/_/g, ' ')}</td>
                      <td style={{ fontSize: 13 }}>{userName(h.changed_by)}</td>
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
