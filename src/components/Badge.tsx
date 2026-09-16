import type { ReactNode } from 'react'

type BadgeTone = 'success' | 'warning' | 'danger'

type BadgeProps = { children: ReactNode; tone?: BadgeTone }

export function Badge({ children, tone = 'success' }: BadgeProps) {
  return <span className={`status-badge status-${tone}`}>{children}</span>
}
