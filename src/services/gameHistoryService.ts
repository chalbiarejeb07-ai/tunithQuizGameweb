import { addDoc, collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { getFirebaseServices } from './firebase'

export type GameRecord = {
  id: string
  uid: string | null
  hostName: string
  teamNames: string[]
  scores: number[]
  rounds: number
  themes: string[]
  winnerIndex: number
  topScore: number
  totalPoints: number
  playedAt: number
}

export type PlayerStats = { games: number; bestScore: number; totalPoints: number; recent: GameRecord[] }

const historyKey = 'tunifith-game-history-v1'
const maxLocalRecords = 50

function readLocal(): GameRecord[] {
  try {
    const raw = localStorage.getItem(historyKey)
    const parsed = raw ? (JSON.parse(raw) as GameRecord[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocal(records: GameRecord[]): void {
  try {
    localStorage.setItem(historyKey, JSON.stringify(records.slice(0, maxLocalRecords)))
  } catch {
    // Stockage indisponible : la partie reste jouable, seul l'historique est perdu.
  }
}

/**
 * Enregistre une partie terminée. L'historique local est toujours écrit (le mode
 * invité a donc de vraies statistiques) ; Firestore n'est utilisé qu'en plus,
 * et son échec ne doit jamais interrompre la partie.
 */
export async function saveGameResult(result: Omit<GameRecord, 'id' | 'playedAt'>): Promise<void> {
  const record: GameRecord = { ...result, id: `local-${Date.now()}`, playedAt: Date.now() }
  writeLocal([record, ...readLocal()])

  const services = getFirebaseServices()
  if (!services || !result.uid) return
  try {
    await addDoc(collection(services.db, 'Games'), { ...result, playedAt: record.playedAt })
  } catch (error) {
    console.warn('[games] enregistrement Firestore impossible, historique local conservé', error)
  }
}

function toStats(records: GameRecord[]): PlayerStats {
  return {
    games: records.length,
    bestScore: records.reduce((best, record) => Math.max(best, record.topScore), 0),
    totalPoints: records.reduce((total, record) => total + record.totalPoints, 0),
    recent: records.slice(0, 5),
  }
}

/** Statistiques du joueur : Firestore si connecté, sinon l'historique local. */
export async function loadPlayerStats(uid: string | null): Promise<PlayerStats> {
  const services = getFirebaseServices()
  if (services && uid) {
    try {
      const snapshot = await getDocs(query(collection(services.db, 'Games'), where('uid', '==', uid), orderBy('playedAt', 'desc'), limit(50)))
      const records = snapshot.docs.map((document) => ({ id: document.id, ...document.data() } as GameRecord))
      if (records.length > 0) return toStats(records)
    } catch (error) {
      // Un index composite manquant ne doit pas casser l'écran profil.
      console.warn('[games] lecture Firestore impossible, repli sur l’historique local', error)
    }
  }
  return toStats(readLocal().sort((left, right) => right.playedAt - left.playedAt))
}

/** Toutes les parties, pour les graphiques du tableau de bord administrateur. */
export async function loadAllGames(): Promise<GameRecord[]> {
  const services = getFirebaseServices()
  if (services) {
    try {
      const snapshot = await getDocs(query(collection(services.db, 'Games'), orderBy('playedAt', 'desc'), limit(200)))
      const records = snapshot.docs.map((document) => ({ id: document.id, ...document.data() } as GameRecord))
      if (records.length > 0) return records
    } catch (error) {
      console.warn('[games] lecture Firestore impossible pour le tableau de bord', error)
    }
  }
  return readLocal().sort((left, right) => right.playedAt - left.playedAt)
}

/** Nombre de parties par jour sur les `days` derniers jours, pour la courbe d'activité. */
export function gamesPerDay(records: GameRecord[], days: number): { label: string; value: number }[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: days }, (_, index) => {
    const day = new Date(today)
    day.setDate(today.getDate() - (days - 1 - index))
    const next = new Date(day)
    next.setDate(day.getDate() + 1)
    const value = records.filter((record) => record.playedAt >= day.getTime() && record.playedAt < next.getTime()).length
    return { label: `${String(day.getDate()).padStart(2, '0')}/${String(day.getMonth() + 1).padStart(2, '0')}`, value }
  })
}
