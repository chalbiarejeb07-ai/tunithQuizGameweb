import { addDoc, collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore'
import { getFirebaseServices } from './firebase'
import { questionBank, themeIds, type Localized, type QuizAnswer, type QuizQuestion, type ThemeId } from '../data/questionBank'

export type QuestionSource = 'firestore' | 'cache' | 'local'
export type LoadedQuestions = { questions: QuizQuestion[]; source: QuestionSource }

const cacheKey = 'tunifith-quiz-cache-v1'

/**
 * Schéma Firestore `Quiz` : un document par question.
 *   { themeId, prompt: { fr, ar }, answers: [{ label: { fr, ar }, points, correct }], status }
 */
type QuizDocument = {
  themeId?: string
  prompt?: Partial<Localized>
  answers?: { label?: Partial<Localized>; points?: number; correct?: boolean }[]
  status?: 'Active' | 'Inactive'
}

function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (themeIds as string[]).includes(value)
}

/** Normalise un document Firestore, en tolérant les champs manquants. */
function toQuestion(id: string, data: QuizDocument): QuizQuestion | null {
  if (!isThemeId(data.themeId) || !data.prompt?.fr || !Array.isArray(data.answers)) return null
  const answers = data.answers.flatMap<QuizAnswer>((answer) => {
    if (!answer?.label?.fr) return []
    const points = Number(answer.points ?? 0)
    return [{
      label: { fr: answer.label.fr, ar: answer.label.ar || answer.label.fr },
      points: Number.isFinite(points) ? points : 0,
      // Rétrocompatibilité : sans drapeau explicite, une réponse qui rapporte des points est correcte.
      correct: answer.correct ?? points > 0,
    }]
  })
  if (answers.filter((answer) => answer.correct).length === 0) return null
  return { id, themeId: data.themeId, prompt: { fr: data.prompt.fr, ar: data.prompt.ar || data.prompt.fr }, answers }
}

function readCache(): QuizQuestion[] | null {
  try {
    const raw = localStorage.getItem(cacheKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as QuizQuestion[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

function writeCache(questions: QuizQuestion[]): void {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(questions))
  } catch {
    // Quota dépassé ou stockage désactivé : le repli local suffit.
  }
}

/**
 * Charge les questions : Firestore d'abord, puis le cache local, puis la banque
 * embarquée. Le jeu reste donc jouable sans réseau et sans configuration.
 */
export async function loadQuestions(): Promise<LoadedQuestions> {
  const services = getFirebaseServices()
  if (services) {
    try {
      const snapshot = await getDocs(collection(services.db, 'Quiz'))
      const questions = snapshot.docs
        .filter((document) => (document.data() as QuizDocument).status !== 'Inactive')
        .flatMap((document) => toQuestion(document.id, document.data() as QuizDocument) ?? [])
      if (questions.length > 0) {
        writeCache(questions)
        return { questions, source: 'firestore' }
      }
    } catch (error) {
      console.warn('[quiz] lecture Firestore impossible, repli hors ligne', error)
    }
  }
  const cached = readCache()
  if (cached) return { questions: cached, source: 'cache' }
  return { questions: questionBank, source: 'local' }
}

// La logique de pioche est pure et vit dans `game/deck.ts` ; on la réexporte
// ici pour que les composants n'aient qu'un seul point d'entrée « quiz ».
export { buildDeck, maxQuestionScore, shuffleAnswers } from '../game/deck'

// ─── Écritures administrateur ────────────────────────────────────────────────

export async function createQuestion(question: Omit<QuizQuestion, 'id'>, status: 'Active' | 'Inactive' = 'Active'): Promise<void> {
  const services = getFirebaseServices()
  if (!services) throw new Error('Firestore non configuré.')
  await addDoc(collection(services.db, 'Quiz'), { ...question, status })
}

export async function updateQuestion(question: QuizQuestion, status: 'Active' | 'Inactive' = 'Active'): Promise<void> {
  const services = getFirebaseServices()
  if (!services) throw new Error('Firestore non configuré.')
  const { id, ...payload } = question
  await setDoc(doc(services.db, 'Quiz', id), { ...payload, status }, { merge: true })
}

export async function deleteQuestion(id: string): Promise<void> {
  const services = getFirebaseServices()
  if (!services) throw new Error('Firestore non configuré.')
  await deleteDoc(doc(services.db, 'Quiz', id))
}
