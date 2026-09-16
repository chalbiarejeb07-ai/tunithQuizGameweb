type AppLogoProps = { compact?: boolean }

export function AppLogo({ compact = false }: AppLogoProps) {
  return <div className={`app-logo ${compact ? 'app-logo-compact' : ''}`} aria-label="Tunisia Guess Game">
    <svg className="app-logo-mark" viewBox="0 0 160 150" role="img" aria-hidden="true">
      <path d="M34 54C34 27 52 12 80 12s46 15 46 42v17H34V54Z" fill="#B71C1C" />
      <path d="M27 68h106l-8 13H35L27 68Z" fill="#8F1414" />
      <path d="M49 45c8-8 18-12 31-12s23 4 31 12" fill="none" stroke="#F7B4A9" strokeWidth="4" strokeLinecap="round" />
      <path d="M56 91c7-8 15-12 24-12s17 4 24 12c-5 8-13 13-24 13S61 99 56 91Z" fill="#1A1A1A" />
      <path d="M80 80v18" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" />
      <path d="M57 92c7 5 13 7 23 7s16-2 23-7" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
    </svg>
    {!compact && <span className="app-logo-name">Tunisia Guess Game</span>}
  </div>
}
