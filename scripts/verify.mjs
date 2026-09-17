/**
 * Contrôles d'intégrité du contenu — `npm run verify`.
 *
 * Vérifie la banque de questions, la parité des traductions et la construction
 * de la pioche. À lancer avant une démonstration : une question mal formée ou
 * une clé de traduction manquante est détectée ici, pas à l'écran.
 */
import { questionBank, themeIds } from '../src/data/questionBank.ts'
import { buildDeck } from '../src/game/deck.ts'
import fr from '../src/locales/fr.json' with { type: 'json' }
import ar from '../src/locales/ar.json' with { type: 'json' }

const problems = []
const fail = (message) => problems.push(message)

// ── Banque de questions ──────────────────────────────────────────────────────
const seen = new Set()
for (const question of questionBank) {
  const where = `question « ${question.id} »`
  if (seen.has(question.id)) fail(`${where} : identifiant en double`)
  seen.add(question.id)

  if (!themeIds.includes(question.themeId)) fail(`${where} : thème inconnu « ${question.themeId} »`)
  if (!question.prompt?.fr?.trim()) fail(`${where} : énoncé français vide`)
  if (!question.prompt?.ar?.trim()) fail(`${where} : énoncé arabe vide`)

  const correct = question.answers.filter((answer) => answer.correct)
  const decoys = question.answers.filter((answer) => !answer.correct)
  if (correct.length < 2) fail(`${where} : ${correct.length} bonne(s) réponse(s), au moins 2 attendues`)
  if (decoys.length < 1) fail(`${where} : aucun leurre, la question serait sans risque`)

  for (const [index, answer] of question.answers.entries()) {
    const label = `${where}, réponse ${index + 1}`
    if (!answer.label?.fr?.trim()) fail(`${label} : libellé français vide`)
    if (!answer.label?.ar?.trim()) fail(`${label} : libellé arabe vide`)
    if (answer.correct && !(answer.points > 0)) fail(`${label} : bonne réponse sans points`)
    if (!answer.correct && answer.points !== 0) fail(`${label} : un leurre ne doit pas rapporter de points`)
  }

  const duplicates = question.answers.map((answer) => answer.label.fr).filter((label, index, all) => all.indexOf(label) !== index)
  if (duplicates.length > 0) fail(`${where} : suggestions identiques (${duplicates.join(', ')})`)
}

// Chaque thème doit avoir de quoi alimenter une partie.
for (const themeId of themeIds) {
  const count = questionBank.filter((question) => question.themeId === themeId).length
  if (count < 3) fail(`thème « ${themeId} » : seulement ${count} question(s)`)
}

// ── Traductions ──────────────────────────────────────────────────────────────
const frKeys = Object.keys(fr)
const arKeys = Object.keys(ar)
for (const key of frKeys) {
  if (!arKeys.includes(key)) fail(`traduction arabe manquante : « ${key} »`)
  else if (!String(ar[key]).trim()) fail(`traduction arabe vide : « ${key} »`)
}
for (const key of arKeys) {
  if (!frKeys.includes(key)) fail(`clé arabe orpheline (absente du français) : « ${key} »`)
}
for (const key of frKeys) {
  if (!String(fr[key]).trim()) fail(`traduction française vide : « ${key} »`)
}

// ── Construction de la pioche ────────────────────────────────────────────────
const deck = buildDeck(questionBank, ['cuisine'], 12)
if (deck.length !== 12) fail(`pioche : ${deck.length} question(s) au lieu de 12`)
if (deck.some((question) => question.themeId !== 'cuisine')) fail('pioche : un thème non sélectionné s’est glissé dedans')

const fullDeck = buildDeck(questionBank, themeIds, 30)
if (new Set(fullDeck.map((question) => question.id)).size !== 30) fail('pioche : doublons alors que la banque est assez grande')

// ── Rapport ──────────────────────────────────────────────────────────────────
const themeCount = new Set(questionBank.map((question) => question.themeId)).size
if (problems.length === 0) {
  console.log(`✅ ${questionBank.length} questions · ${themeCount} thèmes · ${frKeys.length} clés de traduction (fr/ar) — tout est cohérent.`)
} else {
  console.error(`❌ ${problems.length} problème(s) détecté(s) :`)
  for (const problem of problems) console.error(`   · ${problem}`)
  process.exit(1)
}
