import { deleteField, doc, getDoc, increment, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { getFirebaseServices } from './firebase'
import type { QuizQuestion } from '../data/questionBank'

/**
 * Multijoueur en temps réel.
 *
 * Tout l'état d'une partie tient dans **un seul document** `Rooms/{code}`, sur
 * lequel chaque client est abonné via `onSnapshot`. Firestore pousse la moindre
 * modification à tous les participants : c'est ce qui rend l'affichage
 * synchrone, sans serveur de jeu à écrire.
 *
 * Deux règles de concurrence importantes :
 *  - chaque joueur n'écrit que dans SON entrée (`players.<uid>`), via la
 *    notation pointée, pour ne jamais écraser celle des autres ;
 *  - les scores sont incrémentés avec `increment()` côté serveur, donc deux
 *    écritures simultanées ne peuvent pas s'annuler.
 */

export const ONLINE_TURN_SECONDS = 45
export const ONLINE_MAX_STRIKES = 3

export type RoomStatus = 'lobby' | 'playing' | 'finished'

export type RoomPlayer = { uid: string; name: string; score: number; joinedAt: number }
export type RoomTurn = { picks: number[]; gained: number; done: boolean }

export type Room = {
  code: string
  hostUid: string
  hostName: string
  status: RoomStatus
  createdAt: number
  deck: QuizQuestion[]
  currentTurn: number
  turnEndsAt: number | null
  players: Record<string, RoomPlayer>
  turnAnswers: Record<string, RoomTurn>
}

// Alphabet sans caractères ambigus (ni O/0, ni I/1) : un code doit se dicter à
// voix haute sans erreur.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(length = 5): string {
  return Array.from({ length }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('')
}

function roomRef(code: string) {
  const services = getFirebaseServices()
  if (!services) throw new Error('offline')
  return doc(services.db, 'Rooms', code.toUpperCase())
}

export function isOnlineAvailable(): boolean {
  return getFirebaseServices() !== null
}

/** Crée un salon et y installe l'hôte comme premier joueur. */
export async function createRoom(host: { uid: string; name: string }, deck: QuizQuestion[]): Promise<string> {
  // On retente si le code tiré est déjà pris (collision très improbable, mais
  // un salon existant écrasé gâcherait la partie des autres).
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = generateCode()
    const reference = roomRef(code)
    if ((await getDoc(reference)).exists()) continue

    const room: Room = {
      code,
      hostUid: host.uid,
      hostName: host.name,
      status: 'lobby',
      createdAt: Date.now(),
      deck,
      currentTurn: 0,
      turnEndsAt: null,
      players: { [host.uid]: { uid: host.uid, name: host.name, score: 0, joinedAt: Date.now() } },
      turnAnswers: {},
    }
    await setDoc(reference, room)
    return code
  }
  throw new Error('room-code-unavailable')
}

export type JoinResult = 'ok' | 'not-found' | 'already-started' | 'full'

export async function joinRoom(code: string, player: { uid: string; name: string }): Promise<JoinResult> {
  const reference = roomRef(code)
  const snapshot = await getDoc(reference)
  if (!snapshot.exists()) return 'not-found'

  const room = snapshot.data() as Room
  const alreadyIn = Boolean(room.players?.[player.uid])
  if (room.status !== 'lobby' && !alreadyIn) return 'already-started'
  if (Object.keys(room.players ?? {}).length >= 8 && !alreadyIn) return 'full'

  await updateDoc(reference, {
    [`players.${player.uid}`]: { uid: player.uid, name: player.name, score: 0, joinedAt: Date.now() },
  })
  return 'ok'
}

export function subscribeToRoom(code: string, onChange: (room: Room | null) => void, onError: (error: unknown) => void): () => void {
  try {
    return onSnapshot(roomRef(code), (snapshot) => onChange(snapshot.exists() ? (snapshot.data() as Room) : null), onError)
  } catch (error) {
    onError(error)
    return () => undefined
  }
}

export async function leaveRoom(code: string, uid: string): Promise<void> {
  try {
    await updateDoc(roomRef(code), { [`players.${uid}`]: deleteField(), [`turnAnswers.${uid}`]: deleteField() })
  } catch (error) {
    console.warn('[room] sortie du salon impossible', error)
  }
}

/** Hôte : lance la partie et arme le chrono partagé du premier tour. */
export async function startRoom(code: string): Promise<void> {
  await updateDoc(roomRef(code), {
    status: 'playing',
    currentTurn: 0,
    turnEndsAt: Date.now() + ONLINE_TURN_SECONDS * 1000,
    turnAnswers: {},
  })
}

/** Hôte : passe à la question suivante, ou termine la partie. */
export async function advanceRoom(code: string, room: Room): Promise<void> {
  const next = room.currentTurn + 1
  if (next >= room.deck.length) {
    await updateDoc(roomRef(code), { status: 'finished', turnEndsAt: null })
    return
  }
  await updateDoc(roomRef(code), {
    currentTurn: next,
    turnEndsAt: Date.now() + ONLINE_TURN_SECONDS * 1000,
    turnAnswers: {},
  })
}

/**
 * Joueur : enregistre une sélection et crédite immédiatement les points de
 * CETTE réponse.
 *
 * Le score est incrémenté à chaque bonne réponse, et non à la fin du tour :
 * sinon un joueur qui n'a ni fait trois fautes ni tout trouvé perdrait ses
 * points quand l'hôte passe à la question suivante. `increment()` est calculé
 * côté serveur, donc deux joueurs qui valident en même temps ne s'écrasent pas.
 */
export async function submitPick(code: string, uid: string, turn: RoomTurn, scoreDelta: number): Promise<void> {
  const payload: Record<string, unknown> = { [`turnAnswers.${uid}`]: turn }
  if (scoreDelta > 0) payload[`players.${uid}.score`] = increment(scoreDelta)
  await updateDoc(roomRef(code), payload)
}

/** Classement courant, du meilleur au moins bon. */
export function rankPlayers(room: Room | null): RoomPlayer[] {
  return Object.values(room?.players ?? {}).sort((left, right) => right.score - left.score || left.joinedAt - right.joinedAt)
}
