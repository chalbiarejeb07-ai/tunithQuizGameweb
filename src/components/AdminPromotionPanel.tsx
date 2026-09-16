import { useState } from 'react'
import { promoteAdminUser, type AdminUser } from '../services/adminService'
import { Badge } from './Badge'
import { PrimaryButton } from './Buttons'

type AdminPromotionPanelProps = { users: AdminUser[]; onPromoted: () => Promise<void> }

export function AdminPromotionPanel({ users, onPromoted }: AdminPromotionPanelProps) {
  const [busyId, setBusyId] = useState<string | null>(null)

  async function promote(user: AdminUser) {
    if (user.role === 'admin' || user.id.startsWith('demo-')) return
    if (!window.confirm(`Promouvoir ${user.displayName} comme administrateur ?`)) return
    setBusyId(user.id)
    try {
      await promoteAdminUser(user.id)
      await onPromoted()
    } finally {
      setBusyId(null)
    }
  }

  return <section className="admin-panel admin-promotion-panel">
    <div className="admin-panel-heading"><div><div className="eyebrow">ACCÈS</div><h3>Administrateurs</h3></div><Badge tone="warning">Promotion uniquement</Badge></div>
    <div className="admin-promotion-list">{users.map((user) => <div className="admin-promotion-row" key={user.id}><div><strong>{user.displayName}</strong><span>{user.email}</span></div>{user.role === 'admin' ? <Badge tone="success">Admin</Badge> : <PrimaryButton onClick={() => void promote(user)} disabled={busyId !== null}>{busyId === user.id ? 'Promotion...' : 'Promouvoir admin'}</PrimaryButton>}</div>)}</div>
  </section>
}
