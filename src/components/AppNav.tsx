import { useEffect, useId, useRef, useState } from 'react'
import type { User } from 'firebase/auth'
import { AppLogo } from './AppLogo'
import { Avatar } from './Avatar'
import type { Language, Translate, TranslationKey } from '../services/i18n'
import type { Screen } from '../types'

type AppNavProps = {
  t: Translate
  language: Language
  screen: Screen
  user: User | null
  displayName: string
  isAdmin: boolean
  onNavigate: (screen: Screen) => void
  onLanguageChange: (language: Language) => void
  onLogout: () => void
}

type NavLink = { screen: Screen; key: TranslationKey }

const primaryLinks: NavLink[] = [
  { screen: 'setup', key: 'navPlay' },
  { screen: 'online', key: 'navOnline' },
]

/**
 * Barre de navigation persistante.
 *
 * Remplace l'ancien bandeau de 112 px qui n'affichait qu'un titre : la même
 * hauteur sert maintenant à naviguer, changer de langue et accéder au compte.
 * La langue est accessible en un clic depuis n'importe quel écran — dans une
 * application bilingue, l'enfouir dans les réglages était une faute.
 */
export function AppNav({
  t, language, screen, user, displayName, isAdmin,
  onNavigate, onLanguageChange, onLogout,
}: AppNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  // Fermeture au clic extérieur et à Échap : sans cela, un menu ouvert piège
  // l'utilisateur qui doit deviner où cliquer.
  useEffect(() => {
    if (!menuOpen && !drawerOpen) return
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') { setMenuOpen(false); setDrawerOpen(false) }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen, drawerOpen])

  const links = isAdmin ? [...primaryLinks, { screen: 'admin' as Screen, key: 'navAdmin' as TranslationKey }] : primaryLinks

  function go(next: Screen) {
    setMenuOpen(false)
    setDrawerOpen(false)
    onNavigate(next)
  }

  return (
    <header className="app-nav">
      <div className="app-nav-inner">
        <button className="nav-brand" onClick={() => go('menu')} aria-label={t('menu')}>
          <AppLogo compact />
          <span className="nav-brand-name">Tunisia Guess Game</span>
        </button>

        <nav className="nav-links" aria-label={t('menu')}>
          {links.map((link) => (
            <button
              key={link.screen}
              className={`nav-link ${screen === link.screen ? 'is-current' : ''}`}
              aria-current={screen === link.screen ? 'page' : undefined}
              onClick={() => go(link.screen)}
            >
              {t(link.key)}
            </button>
          ))}
        </nav>

        <div className="nav-actions">
          <div className="nav-lang" role="group" aria-label={t('language')}>
            <button
              className={language === 'fr' ? 'active' : ''}
              aria-pressed={language === 'fr'}
              onClick={() => onLanguageChange('fr')}
            >FR</button>
            <button
              className={language === 'ar' ? 'active' : ''}
              aria-pressed={language === 'ar'}
              onClick={() => onLanguageChange('ar')}
            >ع</button>
          </div>

          {user ? (
            <div className="nav-user" ref={menuRef}>
              <button
                className="nav-avatar"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-controls={menuId}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <Avatar name={displayName} />
                <span className="nav-avatar-name">{displayName}</span>
                <span className="nav-caret" aria-hidden="true">▾</span>
              </button>
              {menuOpen && (
                <div className="nav-menu" id={menuId} role="menu">
                  <p className="nav-menu-head">{user.email}</p>
                  <button role="menuitem" onClick={() => go('profile')}>{t('myProfile')}</button>
                  <button role="menuitem" onClick={() => go('settings')}>{t('settings')}</button>
                  {isAdmin && <button role="menuitem" onClick={() => go('admin')}>{t('adminTitle')}</button>}
                  <hr />
                  <button role="menuitem" className="nav-menu-danger" onClick={() => { setMenuOpen(false); onLogout() }}>
                    {t('signOut')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="nav-signin" onClick={() => go('login')}>{t('signIn')}</button>
          )}

          <button
            className="nav-burger"
            aria-label={t('menu')}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((open) => !open)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {drawerOpen && (
        <div className="nav-drawer">
          {links.map((link) => (
            <button key={link.screen} className={screen === link.screen ? 'is-current' : ''} onClick={() => go(link.screen)}>
              {t(link.key)}
            </button>
          ))}
          <hr />
          <button onClick={() => go('profile')}>{t('myProfile')}</button>
          <button onClick={() => go('settings')}>{t('settings')}</button>
          {user
            ? <button className="nav-menu-danger" onClick={() => { setDrawerOpen(false); onLogout() }}>{t('signOut')}</button>
            : <button onClick={() => go('login')}>{t('signIn')}</button>}
        </div>
      )}
    </header>
  )
}
