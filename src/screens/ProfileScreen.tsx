import type { User } from 'firebase/auth'
import { Avatar } from '../components/Avatar'
import { Badge } from '../components/Badge'
import { PrimaryButton, SecondaryButton } from '../components/Buttons'
import { firebaseErrorMessage, type UserProfile } from '../services/authService'
import type { PlayerStats } from '../services/gameHistoryService'
import type { Language, Translate } from '../services/i18n'

type ProfileScreenProps = {
  t: Translate
  language: Language
  user: User | null
  profile: UserProfile | null
  profileLoading: boolean
  profileExists: boolean
  profileError: unknown
  authLoading: boolean
  stats: PlayerStats | null
  onCreateProfile: () => void
  onLogout: () => void
  onSignIn: () => void
}

export function ProfileScreen({
  t, language, user, profile, profileLoading, profileExists, profileError, authLoading, stats,
  onCreateProfile, onLogout, onSignIn,
}: ProfileScreenProps) {
  if (authLoading) {
    return (
      <div className="page">
        <div className="panel skeleton-panel" role="status" aria-label={t('sessionLoading')}>
          <span className="skeleton skeleton-avatar" />
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-line short" />
        </div>
      </div>
    )
  }

  const displayName = profile?.displayName || user?.displayName || t('guestBadge')
  const dateFormat = new Intl.DateTimeFormat(language === 'ar' ? 'ar-TN' : 'fr-TN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="page profile-page">
      <header className="page-head">
        <div className="eyebrow">{t('identitySection')}</div>
        <h1>{t('profile')}</h1>
      </header>

      <section className="panel profile-identity">
        <Avatar name={displayName} size="large" />
        <div className="profile-identity-body">
          <h2>{displayName}</h2>
          <Badge tone={user ? 'success' : 'warning'}>{user ? t('connected') : t('guestBadge')}</Badge>
          <p>{profile?.email ?? user?.email ?? t('loginToSave')}</p>
        </div>
        <div className="profile-identity-action">
          {user
            ? <SecondaryButton onClick={onLogout}>{t('signOut')}</SecondaryButton>
            : <PrimaryButton onClick={onSignIn}>{t('signIn')} <span aria-hidden="true">→</span></PrimaryButton>}
        </div>
      </section>

      {user && profileLoading && <p className="muted-note" role="status">{t('loading')}</p>}
      {user && !!profileError && <p className="auth-error" role="alert">{firebaseErrorMessage(profileError, t('profileLoadError'))}</p>}
      {user && !profileLoading && !profileError && !profileExists && (
        <div className="panel notice-panel" role="status">
          <p>{t('profileCreating')}</p>
          <SecondaryButton onClick={onCreateProfile}>{t('createProfile')}</SecondaryButton>
        </div>
      )}

      <section className="stat-row" aria-label={t('quickStats')}>
        <article className="stat-tile">
          <span className="stat-tile-icon stat-rose" aria-hidden="true">🎮</span>
          <strong>{stats ? stats.games : '—'}</strong>
          <span>{t('gamesPlayed')}</span>
        </article>
        <article className="stat-tile">
          <span className="stat-tile-icon stat-gold" aria-hidden="true">🏆</span>
          <strong>{stats ? stats.bestScore : '—'}</strong>
          <span>{t('bestScore')}</span>
        </article>
        <article className="stat-tile">
          <span className="stat-tile-icon stat-green" aria-hidden="true">★</span>
          <strong>{stats ? stats.totalPoints : '—'}</strong>
          <span>{t('totalPoints')}</span>
        </article>
      </section>

      <section className="panel">
        <h2 className="panel-title">{t('recentGames')}</h2>
        {!stats || stats.recent.length === 0
          ? (
            <div className="empty-state">
              <span aria-hidden="true">◈</span>
              <p>{t('emptyHistory')}</p>
            </div>
          )
          : (
            <ul className="history-list">
              {stats.recent.map((record) => {
                const winner = record.teamNames[record.winnerIndex] || `${t('team')} ${record.winnerIndex + 1}`
                return (
                  <li key={record.id}>
                    <span className="history-date">{dateFormat.format(new Date(record.playedAt))}</span>
                    <strong>{winner}</strong>
                    <span className="history-meta">{record.scores.length} {t('summaryTeams')} · {record.rounds} {t('summaryRounds')}</span>
                    <b>{record.topScore} {t('points')}</b>
                  </li>
                )
              })}
            </ul>
          )}
      </section>
    </div>
  )
}
