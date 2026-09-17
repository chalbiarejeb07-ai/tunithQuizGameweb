import type { User } from 'firebase/auth'
import type { PlayerStats } from '../services/gameHistoryService'
import type { Translate } from '../services/i18n'
import type { Screen } from '../types'

type MenuScreenProps = {
  t: Translate
  user: User | null
  stats: PlayerStats | null
  questionCount: number
  offline: boolean
  onNavigate: (screen: Screen) => void
}

export function MenuScreen({ t, user, stats, questionCount, offline, onNavigate }: MenuScreenProps) {
  const hasHistory = (stats?.games ?? 0) > 0

  return (
    <div className="page menu-page">
      {offline && (
        <p className="offline-banner" role="status">
          <span className="offline-dot" aria-hidden="true" />
          {t('offlineNotice')}
        </p>
      )}

      <header className="menu-hero">
        <div className="eyebrow">{t('quizEyebrow')}</div>
        <h1>{t('menuTitle')}</h1>
        <p className="lead">{t('menuLead')}</p>
        <p className="menu-meta">
          <strong>{questionCount}</strong> {t('questionsAvailable')}
          <span aria-hidden="true"> · </span>
          {user?.email ?? t('guestMode')}
        </p>
      </header>

      <div className="menu-grid">
        <button className="mode-card mode-card-primary" onClick={() => onNavigate('setup')}>
          <span className="card-number">01</span>
          <span className="mode-card-body">
            <strong>{t('localPlay')}</strong>
            <span>{t('localPlayDescription')}</span>
          </span>
          <span className="mode-card-go" aria-hidden="true">→</span>
        </button>

        <button className="mode-card" onClick={() => onNavigate('online')}>
          <span className="card-number">02</span>
          <span className="mode-card-body">
            <strong>{t('onlinePlay')}</strong>
            <span>{t('onlineLead')}</span>
          </span>
          <span className="mode-card-go" aria-hidden="true">↗</span>
        </button>
      </div>

      {/* Bandeau de statistiques : donne du corps à la page et récompense le
          retour du joueur. Masqué tant qu'aucune partie n'a été jouée, plutôt
          que d'afficher une rangée de zéros. */}
      {hasHistory && (
        <section className="menu-stats" aria-label={t('quickStats')}>
          <div><strong>{stats!.games}</strong><span>{t('gamesPlayed')}</span></div>
          <div><strong>{stats!.bestScore}</strong><span>{t('bestScore')}</span></div>
          <div><strong>{stats!.totalPoints}</strong><span>{t('totalPoints')}</span></div>
          <button onClick={() => onNavigate('profile')}>{t('myProfile')} →</button>
        </section>
      )}

      <section className="rules" aria-labelledby="rules-title">
        <div className="rules-head">
          <div className="eyebrow">{t('howToPlay')}</div>
          <h2 id="rules-title">{t('rulesLead')}</h2>
        </div>
        <ol className="rules-grid">
          <li>
            <span className="rule-index">01</span>
            <strong>{t('rule1Title')}</strong>
            <p>{t('rule1')}</p>
            <span className="rule-chips" aria-hidden="true">
              <i>40</i><i>30</i><i>20</i><i>10</i>
            </span>
          </li>
          <li>
            <span className="rule-index">02</span>
            <strong>{t('rule2Title')}</strong>
            <p>{t('rule2')}</p>
            <span className="rule-chips rule-chips-wrong" aria-hidden="true"><i>✗</i><i>✗</i></span>
          </li>
          <li>
            <span className="rule-index">03</span>
            <strong>{t('rule3Title')}</strong>
            <p>{t('rule3')}</p>
            <span className="rule-chips rule-chips-wrong" aria-hidden="true"><i>✗</i><i>✗</i><i>✗</i></span>
          </li>
        </ol>
      </section>
    </div>
  )
}
