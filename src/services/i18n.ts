import { doc, setDoc } from 'firebase/firestore'
import fr from '../locales/fr.json'
import ar from '../locales/ar.json'
import { getFirebaseServices } from './firebase'

export type Language = 'fr' | 'ar'
export type TranslationKey = keyof typeof fr
export type Translate = (key: TranslationKey) => string

const storageKey = 'tunifith-language'
// `ar` est typé d'après `fr` : une clé manquante dans la traduction arabe
// devient une erreur de compilation plutôt qu'un trou à l'écran.
const dictionaries: Record<Language, Record<TranslationKey, string>> = { fr, ar }

export function loadLanguage(): Language {
  try {
    return localStorage.getItem(storageKey) === 'ar' ? 'ar' : 'fr'
  } catch {
    return 'fr'
  }
}

export function saveLanguage(language: Language): void {
  try {
    localStorage.setItem(storageKey, language)
  } catch {
    // Stockage indisponible : la langue reste valable pour la session.
  }
}

export function translate(language: Language, key: TranslationKey): string {
  return dictionaries[language][key] || dictionaries.fr[key]
}

/** Fabrique le raccourci `t` utilisé par les composants. */
export function translator(language: Language): Translate {
  return (key) => translate(language, key)
}

/** Mémorise la langue sur le profil Firestore — sans jamais bloquer l'interface. */
export async function syncLanguage(language: Language): Promise<void> {
  const services = getFirebaseServices()
  const uid = services?.auth.currentUser?.uid
  if (!services || !uid) return
  try {
    await setDoc(doc(services.db, 'Users', uid), { language }, { merge: true })
  } catch (error) {
    console.warn('[i18n] synchronisation de la langue impossible', error)
  }
}
