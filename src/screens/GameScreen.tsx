import { useEffect } from 'react'
import { themeLabel } from '../data/questionBank'
import { MAX_STRIKES, type GameEngine, type TurnEndReason } from '../game/useGameEngine'
import { frenchSpacing } from '../services/typography'
import type { Language, Translate, TranslationKey } from '../services/i18n'

const endMessages: Record<TurnEndReason, TranslationKey> = {
  strikes: 'turnEndedStrikes',
  allFound: 'turnEndedAllFound',
  time: 'turnEndedTime',
  manual: 'turnEndedManual',
}

export function GameScreen({ t, language, game }: { t: Translate; language: Language; game: GameEngine }) {
  const { question, endReason, picked, running, strikes, timeLeft, turnScore } = game
  const over = endReason !== null
  const totalTurns = (game.config?.rounds ?? 0) * (game.config?.teams ?? 0)
  const progress = totalTurns > 0 ? ((game.turn + (over ? 1 : 0)) / totalTurns) * 100 : 0

  /**
   * Raccourcis clavier : 1-6 pour répondre, Espace pour le chrono, Entrée pour
   * enchaîner. Jouer au clavier est nettement plus rapide qu'à la souris quand
   * une équipe dicte ses réponses à voix haute.
   */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return

      if (event.key === ' ') {
        event.preventDefault()
        if (!over) game.toggleTimer()
        return
      }
      if (event.key === 'Enter' && over) {
        event.preventDefault()
        game.nextTurn()
        return
      }
      const index = Number(event.key) - 1
      if (Number.isInteger(index) && index >= 0 && index < (question?.answers.length ?? 0)) {
        event.preventDefault()
        game.pick(index)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [game, over, question])

  if (!question) return null

  function answerState(index: number): string {
    const answer = question!.answers[index]
    if (picked.includes(index)) return answer.correct ? 'picked-correct' : 'picked-wrong'
    if (over) return answer.correct ? 'revealed-correct' : 'revealed-decoy'
    return ''
  }

  function answerMark(index: number): string {
    const answer = question!.answers[index]
    if (picked.includes(index) || over) return answer.correct ? `+${answer.points}` : '✗'
    return '?'
  }

  return (
    <div className="page game-page">
      {/* Progression de la partie entière, pas seulement du tour : on sait
          toujours où l'on en est. */}
      <div className="game-progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="game-bar">
        <div className="game-bar-turn">
          <span className="eyebrow">{t('roundLabel')} {game.round} / {game.config?.rounds}</span>
          <h1>{game.teamName || `${t('team')} ${game.teamIndex + 1}`}</h1>
        </div>

        <div className="game-bar-meters">
          <div className="strikes" aria-label={`${t('strikes')}: ${strikes}/${MAX_STRIKES}`}>
            {Array.from({ length: MAX_STRIKES }, (_, index) => (
              <span className={`strike ${index < strikes ? 'lit' : ''}`} key={index}>✗</span>
            ))}
          </div>
          <div className={`timer ${timeLeft <= 10 && running ? 'urgent' : ''}`}>
            <span className="timer-value">{String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}</span>
            <button onClick={game.toggleTimer} disabled={over}>{running ? t('pause') : t('go')}</button>
          </div>
        </div>
      </div>

      <div className="game-layout">
        <section className="question-board">
          <div className="question-board-head">
            <span className="theme-tag">{themeLabel(question.themeId, language)}</span>
            {!over && running && (
              <span className="remaining-pill">
                <strong>{game.remainingCorrect}</strong> {t('answersLeft')}
              </span>
            )}
          </div>

          <h2>{frenchSpacing(question.prompt[language], language)}</h2>

          <div className="answer-grid">
            {question.answers.map((answer, index) => (
              <button
                className={`answer ${answerState(index)}`}
                key={`${question.id}-${index}`}
                onClick={() => game.pick(index)}
                disabled={!running || over || picked.includes(index)}
              >
                <kbd>{index + 1}</kbd>
                <strong>{frenchSpacing(answer.label[language], language)}</strong>
                <b>{answerMark(index)}</b>
              </button>
            ))}
          </div>

          {!running && !over && <p className="board-hint" role="status">{t('pressGo')}</p>}
          {over && (
            <div className="turn-end" role="status">
              <p className="turn-end-message">{t(endMessages[endReason])}</p>
              <p className="turn-end-score"><strong>+{turnScore}</strong> {t('points')}</p>
              <button className="primary-button" onClick={game.nextTurn}>
                {game.isLastTurn ? t('seeResults') : t('nextTeam')} <span aria-hidden="true">→</span>
              </button>
            </div>
          )}
        </section>

        {/* Tableau des scores : pendant la partie, on ne voyait pas où en
            étaient les autres équipes — c'est pourtant tout l'enjeu. */}
        <aside className="scoreboard">
          <h2 className="panel-title">{t('liveScores')}</h2>
          <ul>
            {game.scores.map((score, index) => (
              <li key={index} className={index === game.teamIndex ? 'is-active' : ''}>
                <span className="rank">{String(index + 1).padStart(2, '0')}</span>
                <strong>{game.config?.teamNames[index] ?? `${t('team')} ${index + 1}`}</strong>
                <b>{score}</b>
              </li>
            ))}
          </ul>
          <div className="scoreboard-turn">
            <span>{t('turnScore')}</span>
            <strong>{turnScore} {t('points')}</strong>
          </div>
          {!over && (
            <button className="finish-button" onClick={game.finishTurn} disabled={!running}>{t('finishTurn')}</button>
          )}
          <p className="keyboard-hint">{t('keyboardHint')}</p>
        </aside>
      </div>
    </div>
  )
}
