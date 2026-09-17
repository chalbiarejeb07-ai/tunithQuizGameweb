import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { Badge } from '../components/Badge'
import { PrimaryButton, SecondaryButton } from '../components/Buttons'
import { themeLabel } from '../data/questionBank'
import { ONLINE_MAX_STRIKES } from '../services/roomService'
import { frenchSpacing } from '../services/typography'
import type { RoomController } from '../game/useRoom'
import type { Language, Translate, TranslationKey } from '../services/i18n'

type OnlineScreenProps = {
  t: Translate
  language: Language
  room: RoomController
  signedIn: boolean
  firebaseReady: boolean
  onSignIn: () => void
}

const errorKeys: Record<string, TranslationKey> = {
  'not-found': 'roomNotFound',
  'already-started': 'roomAlreadyStarted',
  full: 'roomFull',
}

export function OnlineScreen({ t, language, room, signedIn, firebaseReady, onSignIn }: OnlineScreenProps) {
  if (!firebaseReady) return <Notice t={t} message={t('onlineNeedsFirebase')} />
  // Écran de conversion : plutôt qu'un simple refus, on explique ce que le mode
  // en ligne apporte avant de demander la connexion.
  if (!signedIn) {
    return (
      <div className="page compact-page">
        <section className="online-gate">
          <div className="eyebrow">{t('onlineEyebrow')}</div>
          <h1>{t('onlineTitle')}</h1>
          <p className="lead">{t('onlineLead')}</p>
          <ul className="online-features">
            <li><span aria-hidden="true">◈</span>{t('onlineFeature1')}</li>
            <li><span aria-hidden="true">◈</span>{t('onlineFeature2')}</li>
            <li><span aria-hidden="true">◈</span>{t('onlineFeature3')}</li>
          </ul>
          <p className="online-gate-note">{t('onlineNeedsLogin')}</p>
          <PrimaryButton className="online-cta" onClick={onSignIn}>{t('signIn')} <span aria-hidden="true">→</span></PrimaryButton>
        </section>
      </div>
    )
  }

  if (!room.inRoom) return <RoomEntry t={t} room={room} />
  if (room.room?.status === 'lobby') return <Lobby t={t} room={room} />
  if (room.room?.status === 'finished') return <FinalRanking t={t} room={room} />
  return <LiveMatch t={t} language={language} room={room} />
}

function Notice({ t, message }: { t: Translate; message: string }) {
  return (
    <div className="page compact-page">
      <section className="online-gate">
        <div className="eyebrow">{t('onlineEyebrow')}</div>
        <h1>{t('onlineTitle')}</h1>
        <p className="lead">{message}</p>
      </section>
    </div>
  )
}

/** Écran d'entrée : créer un salon ou en rejoindre un avec son code. */
function RoomEntry({ t, room }: { t: Translate; room: RoomController }) {
  const [code, setCode] = useState('')
  const message = room.error ? t(errorKeys[room.error] ?? 'roomError') : ''

  return (
    <section className="page compact-page">
      <div className="eyebrow">{t('onlineEyebrow')}</div>
      <h2>{t('onlineTitle')}</h2>
      <p className="lead">{t('onlineLead')}</p>

      {message && <p className="auth-error" role="alert">{message}</p>}

      <div className="online-entry">
        <article className="online-card">
          <span className="card-number">01</span>
          <strong>{t('createRoom')}</strong>
          <p>{t('createRoomHint')}</p>
          <PrimaryButton onClick={() => void room.create()} disabled={room.busy}>
            {room.busy ? t('loading') : t('createRoom')} <span>→</span>
          </PrimaryButton>
        </article>

        <article className="online-card">
          <span className="card-number">02</span>
          <strong>{t('joinRoomTitle')}</strong>
          <p>{t('joinRoomHint')}</p>
          <form
            className="join-form"
            onSubmit={(event) => { event.preventDefault(); if (code.trim()) void room.join(code) }}
          >
            <input
              className="room-code-input"
              value={code}
              maxLength={5}
              placeholder={t('roomCodePlaceholder')}
              aria-label={t('roomCodeLabel')}
              onChange={(event) => { room.clearError(); setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')) }}
            />
            <SecondaryButton type="submit" disabled={room.busy || code.trim().length < 4}>{t('join')}</SecondaryButton>
          </form>
        </article>
      </div>
    </section>
  )
}

/** Salon d'attente : le code à partager et la liste des joueurs, en direct. */
function Lobby({ t, room }: { t: Translate; room: RoomController }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(room.code ?? '')
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Presse-papiers refusé (contexte non sécurisé) : le code reste lisible à l'écran.
    }
  }

  return (
    <section className="page compact-page">
      <div className="eyebrow">{t('onlineEyebrow')}</div>
      <h2>{t('lobbyTitle')}</h2>

      <div className="room-code-panel">
        <span className="room-code-label">{t('roomCodeLabel')}</span>
        <strong className="room-code">{room.code}</strong>
        <button className="copy-button" onClick={() => void copy()}>{copied ? `✓ ${t('copied')}` : t('copyCode')}</button>
        <p>{t('shareCodeHint')}</p>
      </div>

      <div className="player-panel">
        <div className="panel-heading">
          <span>{t('playersInRoom')}</span>
          <Badge tone={room.players.length > 1 ? 'success' : 'warning'}>{room.players.length}</Badge>
        </div>
        <ul className="player-list">
          {room.players.map((player) => (
            <li key={player.uid}>
              <Avatar name={player.name} />
              <strong>{player.name}</strong>
              {player.uid === room.room?.hostUid && <Badge>{t('hostLabel')}</Badge>}
            </li>
          ))}
        </ul>
        {room.players.length === 1 && <p className="chart-empty">{t('alonePlayer')}</p>}
      </div>

      <div className="room-actions">
        {room.isHost
          ? <PrimaryButton onClick={() => void room.start()}>{t('startMatch')} <span>→</span></PrimaryButton>
          : <p className="waiting-note" role="status">{t('waitingForHost')}</p>}
        <SecondaryButton onClick={() => void room.leave()}>{t('leaveRoom')}</SecondaryButton>
      </div>
    </section>
  )
}

/** La partie elle-même : question partagée, chrono commun, scores en direct. */
function LiveMatch({ t, language, room }: { t: Translate; language: Language; room: RoomController }) {
  const { question, myTurn, expired } = room
  if (!question || !room.room) return null

  const locked = myTurn.done || expired
  const total = room.room.deck.length

  function answerState(index: number): string {
    const answer = question!.answers[index]
    if (myTurn.picks.includes(index)) return answer.correct ? 'picked-correct' : 'picked-wrong'
    if (locked) return answer.correct ? 'revealed-correct' : 'revealed-decoy'
    return ''
  }

  function answerMark(index: number): string {
    const answer = question!.answers[index]
    if (myTurn.picks.includes(index) || locked) return answer.correct ? `+${answer.points}` : '✗'
    return '?'
  }

  return (
    <section className="page online-match">
      <div className="game-head">
        <div>
          <div className="eyebrow">{t('questionProgress')} {room.room.currentTurn + 1} / {total}</div>
          <h2>{t('liveScores')}</h2>
        </div>
        <div className="game-head-right">
          <div className="strikes" aria-label={`${t('strikes')}: ${room.strikes}/${ONLINE_MAX_STRIKES}`}>
            {Array.from({ length: ONLINE_MAX_STRIKES }, (_, index) => (
              <span className={`strike ${index < room.strikes ? 'lit' : ''}`} key={index}>✗</span>
            ))}
          </div>
          <div className={`timer ${room.timeLeft <= 10 ? 'urgent' : ''}`}>
            <span>{String(Math.floor(room.timeLeft / 60)).padStart(2, '0')}:{String(room.timeLeft % 60).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      <div className="online-layout">
        <div className="question-board">
          <span className="theme-tag">{themeLabel(question.themeId, language)}</span>
          <h3>{frenchSpacing(question.prompt[language], language)}</h3>
          <div className="answer-grid">
            {question.answers.map((answer, index) => (
              <button
                className={`answer ${answerState(index)}`}
                key={`${question.id}-${index}`}
                onClick={() => void room.pick(index)}
                disabled={locked || myTurn.picks.includes(index)}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{answer.label[language]}</strong>
                <b>{answerMark(index)}</b>
              </button>
            ))}
          </div>
          {locked && <p className="board-hint board-hint-end" role="status">{t('answerRecorded')} · +{myTurn.gained} {t('points')}</p>}
        </div>

        <aside className="live-scores">
          <div className="panel-heading"><span>{t('liveScores')}</span><Badge>{room.players.length}</Badge></div>
          <ul className="score-list">
            {room.players.map((player, index) => {
              const done = room.room?.turnAnswers?.[player.uid]?.done
              return (
                <li key={player.uid} className={player.uid === room.room?.hostUid ? 'is-host' : ''}>
                  <span className="rank">{String(index + 1).padStart(2, '0')}</span>
                  <Avatar name={player.name} />
                  <strong>{player.name}</strong>
                  <span className={`ready-dot ${done ? 'done' : ''}`} title={done ? t('answerRecorded') : t('waitingOthers')} />
                  <b>{player.score}</b>
                </li>
              )
            })}
          </ul>
          {room.isHost && (
            <PrimaryButton onClick={() => void room.next()}>
              {room.room.currentTurn + 1 >= total ? t('endMatch') : t('nextQuestion')} →
            </PrimaryButton>
          )}
          {!room.isHost && locked && <p className="waiting-note" role="status">{t('waitingOthers')}</p>}
        </aside>
      </div>
    </section>
  )
}

function FinalRanking({ t, room }: { t: Translate; room: RoomController }) {
  return (
    <section className="page results-page">
      <div className="result-banner">
        <span className="trophy">🏆</span>
        <div className="eyebrow">{t('matchFinished')}</div>
        <h2>{room.players[0]?.name ?? t('finalRanking')}</h2>
        <p className="lead">{t('finalRanking')}</p>
      </div>

      <div className="ranking">
        {room.players.map((player, index) => (
          <div className={`rank-row ${index === 0 ? 'winner' : ''}`} key={player.uid}>
            <span className="rank">{String(index + 1).padStart(2, '0')}</span>
            <strong>{player.name}{index === 0 && <em className="winner-tag">{t('winner')}</em>}</strong>
            <span>{player.score} {t('points')}</span>
          </div>
        ))}
      </div>

      <div className="result-actions">
        <PrimaryButton onClick={() => void room.leave()}>{t('backToMenu')}</PrimaryButton>
      </div>
    </section>
  )
}
