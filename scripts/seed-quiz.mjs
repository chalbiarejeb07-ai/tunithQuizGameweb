/**
 * Pousse la banque de questions locale dans la collection Firestore `Quiz`.
 *
 *   npm run seed-quiz -- --credentials="C:\chemin\service-account.json"
 *   npm run seed-quiz -- --reset      (vide la collection avant d'écrire)
 *
 * L'identifiant du document reprend l'identifiant de la question : relancer le
 * script met à jour les questions existantes au lieu de les dupliquer.
 */
import { getFirestore } from 'firebase-admin/firestore'
import { initAdmin, parseArgs } from './adminApp.mjs'
import { questionBank } from '../src/data/questionBank.ts'

const { options } = parseArgs()
const db = getFirestore(initAdmin(options.credentials))
const collection = db.collection('Quiz')

if (options.reset !== undefined) {
  const existing = await collection.get()
  let removed = 0
  // Firestore limite un batch à 500 opérations.
  for (let index = 0; index < existing.docs.length; index += 450) {
    const batch = db.batch()
    for (const document of existing.docs.slice(index, index + 450)) batch.delete(document.ref)
    await batch.commit()
    removed += Math.min(450, existing.docs.length - index)
  }
  console.log(`${removed} question(s) supprimée(s).`)
}

let written = 0
for (let index = 0; index < questionBank.length; index += 450) {
  const batch = db.batch()
  for (const question of questionBank.slice(index, index + 450)) {
    const { id, ...payload } = question
    batch.set(collection.doc(id), { ...payload, status: 'Active' }, { merge: true })
  }
  await batch.commit()
  written += Math.min(450, questionBank.length - index)
}

const themes = new Set(questionBank.map((question) => question.themeId))
console.log(`${written} question(s) écrite(s) dans Quiz, réparties sur ${themes.size} thème(s).`)
