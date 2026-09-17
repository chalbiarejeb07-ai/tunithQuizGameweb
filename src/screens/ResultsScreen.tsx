import { PrimaryButton, SecondaryButton } from '../components/Buttons'
import type { Translate } from '../services/i18n'

type ResultsScreenProps = {
  t: Translate
  scores: number[]
  teamNames: string[]
  onReplay: () => void
  onBackToMenu: () => void
}

const medals = ['🥇', '🥈', '🥉']

export function ResultsScreen({ t, scores, teamNames, onReplay, onBackToMenu }: ResultsScreenProps) {
  // On trie des objets qui portent leur identité : le classement ne peut pas
  // attribuer le nom d'une équipe au score d'une autre.
  const ranking = scores
    .map((score, index) => ({ score, name: teamNames[index] || `${t('team')} ${index + 1}` }))
    .sort((left, right) => right.score - left.score)

  const best = Math.max(...scores, 1)
  const podium = ranking.slice(0, 3)
  // Ordre visuel du podium : 2ᵉ à gauche, 1ᵉʳ au centre, 3ᵉ à droite.
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean)

  return (
    <div className="page results-page">
      <header className="results-hero">
        <span className="trophy" aria-hidden="true">🏆</span>
        <div className="eyebrow">{t('gameFinished')}</div>
        <h1>{ranking[0]?.name ?? t('wellPlayed')}</h1>
        <p className="lead">{t('resultsLead')}</p>
      </header>

      {podiumOrder.length >= 2 && (
        <section className="podium" aria-label={t('podium')}>
          {podiumOrder.map((entry) => {
            const place = ranking.indexOf(entry)
            return (
              <div className={`podium-step podium-${place + 1}`} key={entry.name + place}>
                <span className="podium-medal" aria-hidden="true">{medals[place]}</span>
                <strong className="podium-name">{entry.name}</strong>
                <span className="podium-score">{entry.score}</span>
                <div className="podium-block"><span>{place + 1}</span></div>
              </div>
            )
          })}
        </section>
      )}

      <section className="panel results-detail">
        <h2 className="panel-title">{t('scoreDetail')}</h2>
        <ul className="score-bars">
          {ranking.map((entry, index) => (
            <li key={`${entry.name}-${index}`} className={index === 0 ? 'is-winner' : ''}>
              <span className="rank">{String(index + 1).padStart(2, '0')}</span>
              <span className="score-bar-label">
                {entry.name}
                {index === 0 && <em className="winner-tag">{t('winner')}</em>}
              </span>
              <span className="score-bar-track">
                <span className="score-bar-fill" style={{ width: `${(entry.score / best) * 100}%` }} />
              </span>
              <b>{entry.score}</b>
            </li>
          ))}
        </ul>
      </section>

      <div className="results-actions">
        <PrimaryButton onClick={onReplay}>{t('replay')} <span aria-hidden="true">↻</span></PrimaryButton>
        <SecondaryButton onClick={onBackToMenu}>{t('backToMenu')}</SecondaryButton>
      </div>
    </div>
  )
}
