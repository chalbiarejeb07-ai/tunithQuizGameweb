import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { getFirebaseServices } from './firebase'
import { createUserForAdmin } from './authService'

export type AdminUser = { id: string; displayName: string; email: string; status: 'Active' | 'Inactive' | 'Banned'; role?: 'admin' | 'player' }
export type QuizSuggestion = { suggestion: string; value: number }
export type AdminQuestion = { id: string; main_theme: string; question: string; documents: QuizSuggestion[]; status: 'Active' | 'Inactive'; sourceId?: string; themeIndex?: number; questionIndex?: number }
export type AdminStats = { users: number; questions: number; categories: number; games: number }

export const demoUsers: AdminUser[] = [
  { id: 'demo-1', displayName: 'Ahmed Ben Ali', email: 'ahmed@example.com', status: 'Active' },
  { id: 'demo-2', displayName: 'Fatma Zahra', email: 'fatma@example.com', status: 'Active' },
  { id: 'demo-3', displayName: 'Youssef Mhiri', email: 'youssef@example.com', status: 'Inactive' },
]

export const demoQuestions: AdminQuestion[] = [
  { id: 'demo-q1', main_theme: 'Patrimoine', question: 'Quel monument emblématique se trouve au centre de Tunis ?', documents: [{ suggestion: 'La médina de Tunis', value: 40 }, { suggestion: 'Le Colisée d’El Jem', value: 25 }], status: 'Active' },
  { id: 'demo-q2', main_theme: 'Cuisine', question: 'Quels ingrédients retrouve-t-on dans une salade méchouia ?', documents: [{ suggestion: 'Poivrons grillés', value: 40 }, { suggestion: 'Tomates', value: 30 }], status: 'Active' },
]

export async function isCurrentUserAdmin(): Promise<boolean> {
  const services = getFirebaseServices()
  const uid = services?.auth.currentUser?.uid
  if (!services || !uid) return false
  const snapshot = await getDoc(doc(services.db, 'Users', uid))
  return snapshot.data()?.role === 'admin'
}

export async function loadAdminData(): Promise<{ users: AdminUser[]; questions: AdminQuestion[]; stats: AdminStats; connected: boolean }> {
  const services = getFirebaseServices()
  if (!services) return { users: demoUsers, questions: demoQuestions, stats: { users: 128, questions: 246, categories: 12, games: 584 }, connected: false }
  const [userSnapshot, quizSnapshot, gameSnapshot] = await Promise.all([
    getDocs(collection(services.db, 'Users')),
    getDocs(collection(services.db, 'Quiz')),
    getDocs(collection(services.db, 'Games')),
  ])
  const users = userSnapshot.docs.map((item) => ({ id: item.id, displayName: item.data().displayName ?? 'Sans nom', email: item.data().email ?? '', status: item.data().status ?? 'Active', role: item.data().role })) as AdminUser[]
  const questions = quizSnapshot.docs.flatMap((item) => {
    const data = item.data()
    return ((data.themes ?? []) as { main_theme: string; questions: { question: string; documents: QuizSuggestion[]; status?: AdminQuestion['status'] }[] }[]).flatMap((theme, themeIndex) => theme.questions.map((question, questionIndex) => ({ id: `${item.id}-${theme.main_theme}-${question.question}`, main_theme: theme.main_theme, question: question.question, documents: question.documents ?? [], status: question.status ?? 'Active', sourceId: item.id, themeIndex, questionIndex })))
  })
  return { users, questions, stats: { users: users.length, questions: questions.length, categories: new Set(questions.map((item) => item.main_theme)).size, games: gameSnapshot.size }, connected: true }
}

export async function createAdminUser(user: Omit<AdminUser, 'id'>, password: string): Promise<void> {
  const services = getFirebaseServices()
  if (services) {
    const authUser = await createUserForAdmin(user.displayName, user.email, password)
    await setDoc(doc(services.db, 'Users', authUser.uid), { displayName: user.displayName, email: user.email, status: user.status, role: 'player' })
  }
}

export async function updateAdminUser(user: AdminUser): Promise<void> {
  const services = getFirebaseServices()
  if (services && !user.id.startsWith('demo-')) await updateDoc(doc(services.db, 'Users', user.id), { displayName: user.displayName, email: user.email, status: user.status })
}

export async function promoteAdminUser(id: string): Promise<void> {
  const services = getFirebaseServices()
  if (services && !id.startsWith('demo-')) await updateDoc(doc(services.db, 'Users', id), { role: 'admin' })
}

export async function deleteAdminUser(id: string): Promise<void> {
  const services = getFirebaseServices()
  if (services && !id.startsWith('demo-')) await deleteDoc(doc(services.db, 'Users', id))
}

export async function createAdminQuestion(question: Omit<AdminQuestion, 'id'>): Promise<void> {
  const services = getFirebaseServices()
  if (services) await addDoc(collection(services.db, 'Quiz'), { themes: [{ main_theme: question.main_theme, questions: [{ question: question.question, documents: question.documents, status: question.status }] }] })
}

export async function deleteAdminQuestion(question: AdminQuestion): Promise<void> {
  const services = getFirebaseServices()
  if (!services || !question.sourceId || question.themeIndex === undefined || question.questionIndex === undefined) return
  const questionDocument = doc(services.db, 'Quiz', question.sourceId)
  const snapshot = await getDoc(questionDocument)
  const themes = [...((snapshot.data()?.themes ?? []) as { main_theme: string; questions: { question: string; documents: QuizSuggestion[]; status?: AdminQuestion['status'] }[] }[])]
  const theme = themes[question.themeIndex]
  if (!theme) return
  theme.questions.splice(question.questionIndex, 1)
  await updateDoc(questionDocument, { themes: themes.filter((item) => item.questions.length > 0) })
}

export async function updateAdminQuestion(question: AdminQuestion): Promise<void> {
  const services = getFirebaseServices()
  if (!services || !question.sourceId || question.themeIndex === undefined || question.questionIndex === undefined) return
  const questionDocument = doc(services.db, 'Quiz', question.sourceId)
  const snapshot = await getDoc(questionDocument)
  const themes = [...((snapshot.data()?.themes ?? []) as { main_theme: string; questions: { question: string; documents: QuizSuggestion[]; status?: AdminQuestion['status'] }[] }[])]
  const theme = themes[question.themeIndex]
  if (!theme?.questions[question.questionIndex]) return
  theme.main_theme = question.main_theme
  theme.questions[question.questionIndex] = { question: question.question, documents: question.documents, status: question.status }
  await updateDoc(questionDocument, { themes })
}
