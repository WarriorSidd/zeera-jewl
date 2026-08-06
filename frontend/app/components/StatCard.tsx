import React from 'react'

type Props = {
  label: string
  value: React.ReactNode
  sub?: string
  accent?: boolean
  icon?: string
}

export default function StatCard({ label, value, sub, accent, icon }: Props) {
  return (
    <div className="stat-card">
      {icon && (
        <span style={{ fontSize: 22, filter: 'drop-shadow(0 0 8px rgba(230,196,88,0.5))' }}>{icon}</span>
      )}
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${accent ? 'stat-accent' : ''}`}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
