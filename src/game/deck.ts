import type { QuizQuestion, ThemeId } from '../data/questionBank'

/**
 * Logique de pioche — fonctions pures, sans Firebase ni navigateur, donc
 * vérifiables directement par `npm run verify`.
 */

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  // Mélange de Fisher-Yates : chaque permutation est équiprobable.
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy
}

/**
 * Construit la pioche d'une partie : questions des thèmes choisis, mélangées.
 * Si les thèmes sélectionnés n'en fournissent pas assez, la pioche reboucle
 * plutôt que de raccourcir la partie.
 */
export function buildDeck(questions: QuizQuestion[], selectedThemes: ThemeId[], size: number): QuizQuestion[] {
  const pool = selectedThemes.length > 0 ? questions.filter((question) => selectedThemes.includes(question.themeId)) : questions
  const deck = shuffle(pool.length > 0 ? pool : questions)
  if (deck.length >= size) return deck.slice(0, size)

  const filled = [...deck]
  while (filled.length < size) filled.push(...shuffle(deck))
  return filled.slice(0, size)
}

/** Mélange les suggestions pour qu'elles n'apparaissent pas dans l'ordre des points. */
export function shuffleAnswers(question: QuizQuestion): QuizQuestion {
  return { ...question, answers: shuffle(question.answers) }
}

/** Score maximum atteignable sur une question. */
export function maxQuestionScore(question: QuizQuestion): number {
  return question.answers.filter((answer) => answer.correct).reduce((total, answer) => total + answer.points, 0)
}
