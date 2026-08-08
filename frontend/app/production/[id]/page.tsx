'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge'
import {
  apiFetch, STATUS_OPTIONS, formatDate, formatDateTime, categoryIcon,
  getStoredUser, isManager, isKarigar, CurrentUser,
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

  // Manager Status
  const [newStatus, setNewStatus] = useState('')
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Comments
  const [newComment, setNewComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  // Assignment
  const [assigneeId, setAssigneeId] = useState('')
  const [assigning, setAssigning] = useState(false)

  // Attachments
  const [attachUrl, setAttachUrl] = useState('')
  const [attachName, setAttachName] = useState('')
  const [addingAttach, setAddingAttach] = useState(false)

  // Karigar Action
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

  function userName(userId?: string): string {
    if (!userId) return '—'
    const u = allUsers.find((user) => user.id === userId)
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

  const myAssignment = isKarigar(currentUser)
    ? assignments.find((a) => a.assignee_id === currentUser?.id)
    : null

  const canAccept = isKarigar(currentUser) && pt?.status === 'Assigned' && myAssignment && !myAssignment.accepted
  const canReject = isKarigar(currentUser) && pt?.status === 'Assigned' && myAssignment && !myAssignment.accepted
  const canStart = isKarigar(currentUser) && pt?.status === 'Accepted' && myAssignment
  const canComplete = isKarigar(currentUser) && pt?.status === 'Production' && myAssignment

  const primaryImage = attachments.length > 0 ? attachments[0] : null

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div className="skeleton" style={{ height: 48, width: 320, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 260, borderRadius: 12 }} />
      </div>
    )
  }

  if (!pt) {
    return (
      <div className="empty-state" style={{ padding: 40, textAlign: 'center' }}>
        <div className="empty-icon" style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{error || 'Production ticket not found.'}</div>
        <Link href="/production" className="btn btn-primary mt-3">← Back to Production List</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {/* Top Header Card */}
      <div className="panel mb-2" style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-gold)',
        boxShadow: 'var(--shadow-pop)',
        borderRadius: 12,
        padding: '12px 18px',
      }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="font-mono fw-bold" style={{ color: 'var(--brand-gold)', fontSize: 13, letterSpacing: '0.05em' }}>
                {pt.ticket_number}
              </span>
              <span style={{ fontSize: 20 }}>
                {categoryIcon(pt.category)}
              </span>
            </div>
            <h3 className="mb-1" style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--text-main)', fontSize: 22 }}>
              {pt.title || 'Untitled Production Ticket'}
            </h3>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <StatusBadge status={pt.status} />
              {pt.priority && <PriorityBadge priority={pt.priority} />}
              {pt.category && <span className="tag" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>{pt.category}</span>}
            </div>
          </div>
          <Link href="/production" className="btn btn-secondary btn-sm" style={{ padding: '5px 12px', borderRadius: 6, fontSize: 13 }}>
            ← Back to Tickets
          </Link>
        </div>
      </div>

      {/* Global message banner */}
      {statusMsg && (
        <div className="mb-2" style={{
          padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: statusMsg.type === 'ok' ? '#dcfce7' : '#fee2e2',
          color: statusMsg.type === 'ok' ? '#15803d' : '#b91c1c',
          border: `1px solid ${statusMsg.type === 'ok' ? '#86efac' : '#fca5a5'}`,
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* ── Karigar Action Banner ── */}
      {isKarigar(currentUser) && (
        <div className="panel mb-4" style={{
          background: 'linear-gradient(135deg, #1e1b18 0%, #2a241b 100%)',
          border: '1px solid var(--brand-gold)',
          borderRadius: 12,
          padding: 20,
          boxShadow: 'var(--shadow-gold)',
        }}>
          <div className="panel-title mb-3" style={{ color: 'var(--brand-gold)', fontSize: 16 }}>
            🔨 Karigar Work Action Center
          </div>

          {karigarActionMsg && (
            <div className="mb-3" style={{
              padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600,
              background: karigarActionMsg.type === 'ok' ? '#dcfce7' : '#fee2e2',
              color: karigarActionMsg.type === 'ok' ? '#15803d' : '#b91c1c',
            }}>
              {karigarActionMsg.text}
            </div>
          )}

          {!myAssignment ? (
            <div className="text-muted" style={{ fontSize: 14 }}>This production ticket is not assigned to you.</div>
          ) : (
            <div className="d-flex flex-column gap-3">
              <div>
                <label className="form-label" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Work Notes / Completion Detail (optional)
                </label>
                <input
                  className="form-control"
                  placeholder="Add note or reason (e.g., Finished gold casting and stone fitting)…"
                  value={karigarNote}
                  onChange={(e) => setKarigarNote(e.target.value)}
                  style={{ fontSize: 14, background: '#120f0c', color: '#fff', borderColor: 'var(--border-gold)' }}
                />
              </div>

              <div className="d-flex gap-3 flex-wrap">
                {canAccept && (
                  <button id="btn-accept" className="btn btn-primary px-4 py-2" onClick={() => karigarAction('accept')}>
                    ✅ Accept Work Assignment
                  </button>
                )}
                {canReject && (
                  <button id="btn-reject" className="btn btn-secondary px-3 py-2" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => karigarAction('reject')}>
                    ❌ Reject Work
                  </button>
                )}
                {canStart && (
                  <button id="btn-start" className="btn btn-primary px-4 py-2" onClick={() => karigarAction('start-work')}>
                    ▶️ Start Work in Production
                  </button>
                )}
                {canComplete && (
                  <button id="btn-complete" className="btn btn-primary px-4 py-2" style={{ background: '#15803d', borderColor: '#15803d' }} onClick={() => karigarAction('complete-work')}>
                    🏁 Mark Work Completed
                  </button>
                )}
                {myAssignment.accepted && pt.status !== 'Production' && pt.status !== 'Accepted' && (
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', alignSelf: 'center' }}>
                    Current workflow stage: <strong style={{ color: 'var(--brand-gold)' }}>{pt.status}</strong> — no action needed right now.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="tabs mb-2">
        {TABS.map((t) => (
          <button key={t} className={`tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t} {t === 'Attachments' && attachments.length > 0 && `(${attachments.length})`}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 16, maxWidth: 1000 }}>
          {/* Main Left Section: Specifications & Reference Image */}
          <div className="d-flex flex-column gap-3">

            {/* Design Reference Photo Header (if present) */}
            {primaryImage && (
              <div className="panel" style={{ borderRadius: 12, overflow: 'hidden', padding: 0, border: '1px solid var(--border-gold)' }}>
                <div style={{ background: 'var(--bg-subtle)', padding: '12px 16px', fontWeight: 600, color: 'var(--brand-gold)', borderBottom: '1px solid var(--border-subtle)' }}>
                  📷 Design Reference Photo
                </div>
                <div style={{ padding: 16, background: '#120f0c', textAlign: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primaryImage.url}
                    alt={primaryImage.filename}
                    style={{ maxWidth: '100%', maxHeight: 380, objectFit: 'contain', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                  />
                  <div className="mt-2 text-muted" style={{ fontSize: 12 }}>{primaryImage.filename}</div>
                </div>
              </div>
            )}

            {/* Clean Specifications Grid */}
            <div className="panel" style={{ borderRadius: 12 }}>
              <div className="panel-title mb-3" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                💎 Jewellery Specifications
              </div>

              {/* Description Block */}
              <div className="mb-4" style={{ background: 'var(--bg-subtle)', padding: 16, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <div className="text-secondary mb-1" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Description & Manufacturing Instructions
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                  {pt.description || 'No detailed instructions provided.'}
                </div>
              </div>

              {/* Specs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                <div style={{ background: 'var(--bg-subtle)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div className="text-secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Category</div>
                  <div className="fw-semibold mt-1" style={{ fontSize: 14 }}>{categoryIcon(pt.category)} {pt.category || '—'}</div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div className="text-secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Priority</div>
                  <div className="mt-1">{pt.priority ? <PriorityBadge priority={pt.priority} /> : '—'}</div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div className="text-secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Expected Delivery</div>
                  <div className="fw-semibold mt-1" style={{ fontSize: 13, color: 'var(--brand-gold)' }}>📅 {formatDate(pt.expected_delivery)}</div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div className="text-secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Created Date</div>
                  <div className="fw-semibold mt-1" style={{ fontSize: 13 }}>{formatDateTime(pt.created_at)}</div>
                </div>

                <div style={{ background: 'var(--bg-subtle)', padding: 10, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div className="text-secondary" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Last Updated</div>
                  <div className="fw-semibold mt-1" style={{ fontSize: 13 }}>{formatDateTime(pt.updated_at)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Status & Assignment Controls */}
          <div className="d-flex flex-column gap-3">
            <div className="panel" style={{ borderRadius: 12, border: '1px solid var(--border-gold)' }}>
              <div className="panel-title mb-3" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                📋 Workflow & Status
              </div>

              <div className="mb-4">
                <div className="text-secondary mb-1" style={{ fontSize: 12, fontWeight: 600 }}>Current Stage</div>
                <StatusBadge status={pt.status} />
              </div>

              {/* Manager: Change Status Dropdown */}
              {isManager(currentUser) && (
                <div className="mb-4 p-3" style={{ background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Override Stage Status</label>
                  <div className="d-flex gap-2">
                    <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ fontSize: 14 }}>
                      <option value="">Select new status…</option>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={changeStatus} disabled={!newStatus}>Apply</button>
                  </div>
                </div>
              )}

              {/* Assigned Karigars List */}
              <div className="mb-4">
                <div className="text-secondary mb-2" style={{ fontSize: 13, fontWeight: 600 }}>Assigned Karigars</div>
                {assignments.length === 0 ? (
                  <div className="text-muted" style={{ fontSize: 13, fontStyle: 'italic' }}>No karigars assigned yet.</div>
                ) : (
                  assignments.map((a) => (
                    <div key={a.id} className="d-flex justify-content-between align-items-center py-2 px-2 mb-2" style={{
                      background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border-subtle)',
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>👤 {userName(a.assignee_id)}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>Assigned {formatDate(a.created_at)}</div>
                      </div>
                      <span className={`tag ${a.accepted ? 'status-ready' : 'status-review'}`} style={{ fontSize: 11 }}>
                        {a.accepted ? '✅ Accepted' : '⏳ Pending'}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Manager: Assign Karigar Form */}
              {isManager(currentUser) && (
                <div className="mb-3 p-3" style={{ background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Assign New Karigar</label>
                  <div className="d-flex gap-2 mb-2">
                    <select className="form-select" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} style={{ fontSize: 14 }}>
                      <option value="">Select karigar…</option>
                      {karigars.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.full_name || k.username}
                        </option>
                      ))}
                    </select>
                    <button id="btn-assign" className="btn btn-primary btn-sm" disabled={!assigneeId || assigning} onClick={assignKarigar}>
                      {assigning ? '…' : 'Assign'}
                    </button>
                  </div>
                  {assignments.length > 0 && (
                    <button id="btn-ping" className="btn btn-secondary btn-sm w-100 mt-2" onClick={pingKarigar}>
                      🔔 Ping Karigar for Update
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Timeline Tab ── */}
      {activeTab === 'Timeline' && (
        <div className="panel" style={{ borderRadius: 12 }}>
          <div className="panel-title mb-3">Activity & Event Log</div>
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
                    <div className="text-secondary mt-1" style={{ fontSize: 12 }}>
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
        <div className="panel" style={{ borderRadius: 12 }}>
          <div className="panel-title mb-3">Discussion & Updates</div>
          <div className="d-flex gap-2 mb-4">
            <textarea
              className="form-control flex-grow-1"
              rows={3}
              placeholder="Add a comment or design update…"
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
              <div key={c.id} className="mb-3 p-3" style={{ background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--brand-gold)' }}>
                    💬 {userName(c.author_id)}
                  </div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{formatDateTime(c.created_at)}</div>
                </div>
                <div className="text-secondary" style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{c.content}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Attachments Tab ── */}
      {activeTab === 'Attachments' && (
        <div className="panel" style={{ borderRadius: 12 }}>
          <div className="panel-title mb-3">Attachments & Design Photos</div>

          {/* Link / Upload Input */}
          <div className="mb-4 p-3" style={{ background: 'var(--bg-subtle)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <div className="form-label fw-semibold">Add Image / Attachment Link</div>
            <div className="d-flex gap-2 flex-wrap">
              <input
                className="form-control"
                placeholder="Image URL (https://…)"
                value={attachUrl}
                onChange={(e) => setAttachUrl(e.target.value)}
                style={{ flex: '2 1 220px' }}
              />
              <input
                className="form-control"
                placeholder="Label / Filename"
                value={attachName}
                onChange={(e) => setAttachName(e.target.value)}
                style={{ flex: '1 1 150px' }}
              />
              <button id="btn-add-attachment" className="btn btn-primary" disabled={!attachUrl.trim() || !attachName.trim() || addingAttach} onClick={addAttachment}>
                {addingAttach ? 'Adding…' : '+ Add'}
              </button>
            </div>
          </div>

          {attachments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" style={{ fontSize: 40 }}>📎</div>
              <div>No attachments yet. Upload design photos or add reference URLs above.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {attachments.map((a) => {
                const isImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(a.url) || a.mime_type?.startsWith('image/') || a.url.startsWith('data:image/')
                return (
                  <div key={a.id} style={{
                    border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden',
                    background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-pop)',
                  }}>
                    {isImage ? (
                      <a href={a.url} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={a.url}
                          alt={a.filename}
                          style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                        />
                      </a>
                    ) : (
                      <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                        📄
                      </div>
                    )}
                    <div style={{ padding: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.filename}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{formatDate(a.created_at)}</div>
                      <a href={a.url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm mt-2 w-100" style={{ fontSize: 12, textAlign: 'center' }}>Open Link ↗</a>
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
        <div className="panel" style={{ borderRadius: 12 }}>
          <div className="panel-title mb-3">Audit History</div>
          {history.length === 0 ? (
            <div className="empty-state">No audit history recorded.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Change Type</th>
                    <th>Changed By</th>
                    <th>Old Value</th>
                    <th>New Value</th>
                    <th>Reason</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().map((h) => (
                    <tr key={h.id}>
                      <td className="fw-bold" style={{ textTransform: 'capitalize', color: 'var(--brand-gold)' }}>{h.change_type.replace(/_/g, ' ')}</td>
                      <td style={{ fontSize: 13 }}>👤 {userName(h.changed_by)}</td>
                      <td className="text-muted" style={{ fontSize: 13 }}>{h.old_value || '—'}</td>
                      <td className="fw-semibold" style={{ fontSize: 13 }}>{h.new_value || '—'}</td>
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
