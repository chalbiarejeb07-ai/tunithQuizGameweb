import { useState } from 'react'
import { isDemoId, promoteAdminUser, type AdminUser } from '../services/adminService'
import { Badge } from './Badge'
import { PrimaryButton } from './Buttons'
import type { Translate } from '../services/i18n'

type AdminPromotionPanelProps = { t: Translate; users: AdminUser[]; onPromoted: () => Promise<void> }

export function AdminPromotionPanel({ t, users, onPromoted }: AdminPromotionPanelProps) {
  const [busyId, setBusyId] = useState<string | null>(null)

  async function promote(user: AdminUser) {
    if (user.role === 'admin' || isDemoId(user.id)) return
    if (!window.confirm(`${t('promoteConfirm')}\n${user.displayName} · ${user.email}`)) return
    setBusyId(user.id)
    try {
      await promoteAdminUser(user.id)
      await onPromoted()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="admin-panel admin-promotion-panel">
      <div className="admin-panel-heading">
        <div><div className="eyebrow">{t('access')}</div><h3>{t('administrators')}</h3></div>
        <Badge tone="warning">{t('promotionOnly')}</Badge>
      </div>
      <div className="admin-promotion-list">
        {users.map((user) => (
          <div className="admin-promotion-row" key={user.id}>
            <div><strong>{user.displayName}</strong><span>{user.email}</span></div>
            {user.role === 'admin'
              ? <Badge tone="success">Admin</Badge>
              : <PrimaryButton onClick={() => void promote(user)} disabled={busyId !== null || isDemoId(user.id)}>
                  {busyId === user.id ? t('promoting') : t('promoteAdmin')}
                </PrimaryButton>}
          </div>
        ))}
      </div>
    </section>
  )
}
