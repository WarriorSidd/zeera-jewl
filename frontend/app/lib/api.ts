export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const STATUS_ORDER = [
  'Draft', 'Review', 'Assigned', 'Accepted', 'Production', 'Stone Setting',
  'Polishing', 'Quality Check', 'Ready', 'Delivered', 'Closed', 'Archived'
]

export const STATUS_OPTIONS = [
  'Draft', 'Review', 'Assigned', 'Accepted', 'Production', 'Stone Setting',
  'Polishing', 'Quality Check', 'Ready', 'Delivered', 'Closed', 'Archived'
]

export const CATEGORIES = [
  'Ring', 'Necklace', 'Bracelet', 'Pendant', 'Temple Jewellery', 'Kundan',
  'Polki', 'Diamond', 'Gold', 'Custom'
]

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']

export function statusClass(status: string): string {
  const map: Record<string, string> = {
    'Draft': 'status-draft',
    'Review': 'status-review',
    'Assigned': 'status-assigned',
    'Accepted': 'status-accepted',
    'Production': 'status-production',
    'Stone Setting': 'status-stone-setting',
    'Polishing': 'status-polishing',
    'Quality Check': 'status-quality-check',
    'Ready': 'status-ready',
    'Delivered': 'status-delivered',
    'Closed': 'status-closed',
    'Archived': 'status-archived',
  }
  return map[status] || 'status-draft'
}

export function priorityClass(priority: string): string {
  const map: Record<string, string> = {
    'Critical': 'priority-critical',
    'High': 'priority-high',
    'Medium': 'priority-medium',
    'Low': 'priority-low',
  }
  return map[priority] || 'priority-medium'
}

export function categoryIcon(category?: string): string {
  const map: Record<string, string> = {
    'Ring': '💍',
    'Necklace': '📿',
    'Bracelet': '🧷',
    'Pendant': '🔮',
    'Temple Jewellery': '🛕',
    'Kundan': '✨',
    'Polki': '💎',
    'Diamond': '💠',
    'Gold': '🟡',
    'Custom': '🎨',
  }
  return map[category || ''] || '💍'
}

export function categoryEmoji(category?: string): string {
  return categoryIcon(category)
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    let detail = `Request failed: ${res.status}`
    try {
      const body = await res.json()
      if (body.detail) detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    } catch {
      // ignore
    }
    throw new Error(detail)
  }
  return res.json()
}

export function formatDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
