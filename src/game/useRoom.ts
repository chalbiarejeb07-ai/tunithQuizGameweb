import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ONLINE_MAX_STRIKES, advanceRoom, createRoom, joinRoom, leaveRoom, rankPlayers, startRoom, submitPick,
  subscribeToRoom, type JoinResult, type Room, type RoomTurn,
} from '../services/roomService'
import { loadQuestions } from '../services/quizService'
import { buildDeck, shuffleAnswers } from './deck'
import { themeIds } from '../data/questionBank'
import { playCorrectSound, playTurnOverSound, playWrongSound, type SoundPreferences } from '../services/soundService'

const emptyTurn: RoomTurn = { picks: [], gained: 0, done: false }

/**
 * Pilote un salon multijoueur côté client.
 *
 * L'état de vérité est le document Firestore : ce hook ne conserve rien en
 * local, il s'abonne et renvoie ce que le serveur annonce. Les actions écrivent
 * dans le document, et le changement revient par l'abonnement — y compris pour
 * le joueur qui l'a déclenché. Aucun état à réconcilier.
 */
export function useRoom(user: { uid: string; name: string } | null, sound: SoundPreferences) {
  const [code, setCode] = useState<string | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // Horloge locale : le chrono est déduit de `turnEndsAt`, donc tous les
  // clients affichent le même décompte sans qu'on ait à le diffuser.
  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 400)
    return () => window.clearInterval(tick)
  }, [])

  useEffect(() => {
    if (!code) { setRoom(null); return }
    return subscribeToRoom(code, setRoom, (reason) => {
      console.error('[room] abonnement interrompu', reason)
      setError('room-subscription-failed')
    })
  }, [code])

  const uid = user?.uid ?? ''
  const question = room && room.status !== 'lobby' ? room.deck[room.currentTurn] ?? null : null
  const myTurn = room?.turnAnswers?.[uid] ?? emptyTurn
  const isHost = Boolean(room && user && room.hostUid === user.uid)
  const players = useMemo(() => rankPlayers(room), [room])
  const timeLeft = room?.turnEndsAt ? Math.max(0, Math.ceil((room.turnEndsAt - now) / 1000)) : 0
  const expired = room?.status === 'playing' && room.turnEndsAt !== null && timeLeft <= 0

  const strikes = question ? myTurn.picks.filter((index) => !question.answers[index]?.correct).length : 0
  const everyoneDone = players.length > 0 && players.every((player) => room?.turnAnswers?.[player.uid]?.done)

  const create = useCallback(async () => {
    if (!user) return
    setBusy(true); setError('')
    try {
      const { questions } = await loadQuestions()
      // 8 questions : assez pour une vraie partie, assez court pour une démo.
      const deck = buildDeck(questions, themeIds, 8).map(shuffleAnswers)
      setCode(await createRoom(user, deck))
    } catch (reason) {
      console.error('[room] création impossible', reason)
      setError('room-create-failed')
    } finally {
      setBusy(false)
    }
  }, [user])

  const join = useCallback(async (rawCode: string): Promise<JoinResult | 'error'> => {
    if (!user) return 'error'
    setBusy(true); setError('')
    try {
      const target = rawCode.trim().toUpperCase()
      const result = await joinRoom(target, user)
      if (result === 'ok') setCode(target)
      else setError(result)
      return result
    } catch (reason) {
      console.error('[room] connexion au salon impossible', reason)
      setError('room-join-failed')
      return 'error'
    } finally {
      setBusy(false)
    }
  }, [user])

  const leave = useCallback(async () => {
    if (code && uid) await leaveRoom(code, uid)
    setCode(null); setRoom(null); setError('')
  }, [code, uid])

  const start = useCallback(async () => { if (code) await startRoom(code) }, [code])
  const next = useCallback(async () => { if (code && room) await advanceRoom(code, room) }, [code, room])

  /** Valide une suggestion et, si le tour du joueur s'achève, crédite son score. */
  const pick = useCallback(async (index: number) => {
    if (!code || !question || myTurn.done || expired || myTurn.picks.includes(index)) return
    const answer = question.answers[index]
    if (!answer) return

    const picks = [...myTurn.picks, index]
    const nextStrikes = picks.filter((item) => !question.answers[item]?.correct).length
    const gained = picks.reduce((total, item) => total + (question.answers[item]?.correct ? question.answers[item].points : 0), 0)
    const allFound = question.answers.every((item, itemIndex) => !item.correct || picks.includes(itemIndex))
    const done = nextStrikes >= ONLINE_MAX_STRIKES || allFound

    if (answer.correct) playCorrectSound(sound)
    else playWrongSound(sound)
    if (done && !allFound) playTurnOverSound(sound)

    try {
      // Seuls les points de la réponse qui vient d'être validée sont ajoutés.
      await submitPick(code, uid, { picks, gained, done }, answer.correct ? answer.points : 0)
    } catch (reason) {
      console.error('[room] envoi de la réponse impossible', reason)
    }
  }, [code, question, myTurn, expired, uid, sound])

  // Chrono écoulé : on clôt le tour du joueur. Les points ont déjà été crédités
  // au fil des réponses, il n'y a donc rien à ajouter ici.
  const committed = useRef<string>('')
  useEffect(() => {
    if (!code || !room || !expired || myTurn.done || !uid) return
    const key = `${code}-${room.currentTurn}`
    if (committed.current === key) return
    committed.current = key
    void submitPick(code, uid, { ...myTurn, done: true }, 0).catch((reason) => console.error('[room] clôture du tour impossible', reason))
  }, [code, room, expired, myTurn, uid])

  return {
    code, room, error, busy, players, question, myTurn, isHost, timeLeft, expired, strikes, everyoneDone,
    inRoom: Boolean(code && room),
    create, join, leave, start, next, pick,
    clearError: () => setError(''),
  }
}

export type RoomController = ReturnType<typeof useRoom>
