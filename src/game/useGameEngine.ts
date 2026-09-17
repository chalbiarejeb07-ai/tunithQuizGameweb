import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { QuizQuestion, ThemeId } from '../data/questionBank'
import { buildDeck, shuffleAnswers } from '../services/quizService'
import { playCorrectSound, playTurnOverSound, playWrongSound, type SoundPreferences } from '../services/soundService'

export const TURN_SECONDS = 60
export const MAX_STRIKES = 3

export type TurnEndReason = 'strikes' | 'allFound' | 'time' | 'manual'
export type GamePhase = 'idle' | 'playing' | 'finished'
export type GameConfig = { teams: number; rounds: number; themes: ThemeId[]; teamNames: string[] }

/**
 * Moteur de jeu — toute la mécanique d'une partie, isolée de l'affichage.
 *
 * Règle : chaque tour présente une question et ses suggestions. Une bonne
 * réponse rapporte ses points, une mauvaise coûte une faute. Le tour s'arrête à
 * la 3ᵉ faute, quand toutes les bonnes réponses sont trouvées, à la fin du
 * chrono, ou sur décision de l'équipe.
 *
 * Une partie compte `rounds × teams` tours, une question différente par tour
 * pour qu'aucune équipe ne rejoue une question déjà entendue.
 */
export function useGameEngine(questions: QuizQuestion[], sound: SoundPreferences) {
  const [config, setConfig] = useState<GameConfig | null>(null)
  const [deck, setDeck] = useState<QuizQuestion[]>([])
  const [turn, setTurn] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [picked, setPicked] = useState<number[]>([])
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS)
  const [running, setRunning] = useState(false)
  const [endReason, setEndReason] = useState<TurnEndReason | null>(null)
  const [phase, setPhase] = useState<GamePhase>('idle')

  // Garde-fou : le score d'un tour ne doit être crédité qu'une seule fois, même
  // si le chrono et un clic terminent le tour dans le même cycle de rendu.
  const committed = useRef(false)

  const question = deck[turn] ?? null
  const teamCount = config?.teams ?? 0
  const teamIndex = teamCount > 0 ? turn % teamCount : 0
  const round = teamCount > 0 ? Math.floor(turn / teamCount) + 1 : 1
  const isLastTurn = deck.length > 0 && turn >= deck.length - 1

  const strikes = useMemo(
    () => (question ? picked.filter((index) => !question.answers[index]?.correct).length : 0),
    [picked, question],
  )
  const turnScore = useMemo(
    () => (question ? picked.reduce((total, index) => total + (question.answers[index]?.correct ? question.answers[index].points : 0), 0) : 0),
    [picked, question],
  )
  const remainingCorrect = useMemo(
    () => (question ? question.answers.filter((answer, index) => answer.correct && !picked.includes(index)).length : 0),
    [picked, question],
  )

  const resetTurn = useCallback(() => {
    committed.current = false
    setPicked([])
    setTimeLeft(TURN_SECONDS)
    setRunning(false)
    setEndReason(null)
  }, [])

  const start = useCallback((nextConfig: GameConfig) => {
    const size = nextConfig.rounds * nextConfig.teams
    setDeck(buildDeck(questions, nextConfig.themes, size).map(shuffleAnswers))
    setConfig(nextConfig)
    setScores(Array(nextConfig.teams).fill(0))
    setTurn(0)
    setPhase('playing')
    resetTurn()
  }, [questions, resetTurn])

  /** Termine le tour et crédite les points. `pickedNow` permet de tenir compte du clic en cours. */
  const endTurn = useCallback((reason: TurnEndReason, pickedNow?: number[]) => {
    if (committed.current || !question) return
    committed.current = true
    const finalPicked = pickedNow ?? picked
    const gained = finalPicked.reduce((total, index) => total + (question.answers[index]?.correct ? question.answers[index].points : 0), 0)
    setRunning(false)
    setEndReason(reason)
    setScores((current) => current.map((score, index) => (index === teamIndex ? score + gained : score)))
    if (reason !== 'allFound') playTurnOverSound(sound)
  }, [picked, question, teamIndex, sound])

  // `endTurn` change à chaque rendu ; la référence évite de relancer le chrono.
  const endTurnRef = useRef(endTurn)
  useEffect(() => { endTurnRef.current = endTurn }, [endTurn])

  const pick = useCallback((index: number) => {
    if (!question || !running || committed.current || picked.includes(index)) return
    const answer = question.answers[index]
    if (!answer) return
    const next = [...picked, index]
    setPicked(next)

    if (answer.correct) playCorrectSound(sound)
    else playWrongSound(sound)

    const nextStrikes = next.filter((item) => !question.answers[item]?.correct).length
    const allFound = question.answers.every((item, itemIndex) => !item.correct || next.includes(itemIndex))
    if (nextStrikes >= MAX_STRIKES) endTurn('strikes', next)
    else if (allFound) endTurn('allFound', next)
  }, [picked, question, running, sound, endTurn])

  const nextTurn = useCallback(() => {
    if (isLastTurn) { setPhase('finished'); return }
    setTurn((current) => current + 1)
    resetTurn()
  }, [isLastTurn, resetTurn])

  const reset = useCallback(() => {
    setPhase('idle')
    setConfig(null)
    setDeck([])
    setScores([])
    setTurn(0)
    resetTurn()
  }, [resetTurn])

  // Chrono : l'intervalle ne dépend que de `running`, il n'est donc pas recréé
  // à chaque seconde (contrairement à une dépendance sur `timeLeft`).
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setTimeLeft((time) => Math.max(0, time - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [running])

  useEffect(() => {
    if (running && timeLeft === 0) endTurnRef.current('time')
  }, [running, timeLeft])

  return {
    phase,
    config,
    deck,
    question,
    round,
    turn,
    teamIndex,
    teamName: config?.teamNames[teamIndex] ?? '',
    scores,
    picked,
    strikes,
    turnScore,
    remainingCorrect,
    timeLeft,
    running,
    endReason,
    isLastTurn,
    start,
    pick,
    nextTurn,
    reset,
    toggleTimer: () => setRunning((current) => !current),
    finishTurn: () => endTurn('manual'),
  }
}

export type GameEngine = ReturnType<typeof useGameEngine>
