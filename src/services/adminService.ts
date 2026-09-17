import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { getFirebaseServices } from './firebase'
import { createUserForAdmin } from './authService'
import { loadQuestions, type QuestionSource } from './quizService'
import { loadAllGames, type GameRecord } from './gameHistoryService'
import type { QuizQuestion } from '../data/questionBank'

export type AdminUser = { id: string; displayName: string; email: string; status: 'Active' | 'Inactive' | 'Banned'; role?: 'admin' | 'user' | 'player' }
export type AdminStats = { users: number; questions: number; categories: number; games: number }
export type AdminData = {
  users: AdminUser[]
  questions: QuizQuestion[]
  games: GameRecord[]
  stats: AdminStats
  connected: boolean
  questionSource: QuestionSource
}

export const demoUsers: AdminUser[] = [
  { id: 'demo-1', displayName: 'Ahmed Ben Ali', email: 'ahmed@example.com', status: 'Active', role: 'player' },
  { id: 'demo-2', displayName: 'Fatma Zahra', email: 'fatma@example.com', status: 'Active', role: 'player' },
  { id: 'demo-3', displayName: 'Youssef Mhiri', email: 'youssef@example.com', status: 'Inactive', role: 'player' },
]

export function isDemoId(id: string): boolean {
  return id.startsWith('demo-')
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const services = getFirebaseServices()
  const uid = services?.auth.currentUser?.uid
  if (!services || !uid) return false
  try {
    const snapshot = await getDoc(doc(services.db, 'Users', uid))
    return snapshot.data()?.role === 'admin'
  } catch (error) {
    console.warn('[admin] vérification du rôle impossible', error)
    return false
  }
}

/**
 * Agrège tout ce qu'affiche le tableau de bord. Chaque source est chargée
 * indépendamment : Firestore indisponible ne vide pas l'écran, il le fait
 * basculer sur les données de démonstration et l'historique local.
 */
export async function loadAdminData(): Promise<AdminData> {
  const services = getFirebaseServices()
  const [{ questions, source }, games] = await Promise.all([loadQuestions(), loadAllGames()])

  let users = demoUsers
  let connected = false
  if (services) {
    try {
      const snapshot = await getDocs(collection(services.db, 'Users'))
      users = snapshot.docs.map((item) => ({
        id: item.id,
        displayName: item.data().displayName ?? 'Sans nom',
        email: item.data().email ?? '',
        status: item.data().status ?? 'Active',
        role: item.data().role,
      })) as AdminUser[]
      connected = true
    } catch (error) {
      console.warn('[admin] lecture des utilisateurs impossible, mode démo', error)
    }
  }

  return {
    users,
    questions,
    games,
    connected,
    questionSource: source,
    stats: {
      users: users.length,
      questions: questions.length,
      categories: new Set(questions.map((question) => question.themeId)).size,
      games: games.length,
    },
  }
}

export async function createAdminUser(user: Omit<AdminUser, 'id'>, password: string): Promise<void> {
  const services = getFirebaseServices()
  if (!services) throw new Error('Firestore non configuré.')
  const authUser = await createUserForAdmin(user.displayName, user.email, password)
  await setDoc(doc(services.db, 'Users', authUser.uid), {
    displayName: user.displayName,
    email: user.email,
    status: user.status,
    role: 'player',
  })
}

export async function updateAdminUser(user: AdminUser): Promise<void> {
  const services = getFirebaseServices()
  if (!services || isDemoId(user.id)) return
  // `role` n'est jamais renvoyé ici : les règles Firestore interdisent qu'une
  // mise à jour ordinaire touche au rôle (voir firestore.rules).
  await updateDoc(doc(services.db, 'Users', user.id), {
    displayName: user.displayName,
    email: user.email,
    status: user.status,
  })
}

export async function promoteAdminUser(id: string): Promise<void> {
  const services = getFirebaseServices()
  if (!services || isDemoId(id)) return
  await updateDoc(doc(services.db, 'Users', id), { role: 'admin' })
}

export async function deleteAdminUser(id: string): Promise<void> {
  const services = getFirebaseServices()
  if (!services || isDemoId(id)) return
  await deleteDoc(doc(services.db, 'Users', id))
}
