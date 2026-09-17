import type { ReactNode } from 'react'
import { AppLogo } from './AppLogo'

type PageHeaderProps = {
  title: string
  backLabel: string
  onBack?: () => void
  rightAction?: ReactNode
}

export function PageHeader({ title, backLabel, onBack, rightAction }: PageHeaderProps) {
  return (
    <header className="page-header">
      <button className="header-icon-button" onClick={onBack} aria-label={backLabel} disabled={!onBack}>←</button>
      <div className="header-title"><AppLogo compact /><strong>{title}</strong></div>
      <div className="header-action">{rightAction}</div>
    </header>
  )
}
