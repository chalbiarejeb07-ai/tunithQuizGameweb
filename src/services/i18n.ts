import fr from '../locales/fr.json'
import ar from '../locales/ar.json'
import { doc, getFirestore, setDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getApps, initializeApp } from 'firebase/app'

export type Language = 'fr' | 'ar'
type TranslationKey = keyof typeof fr
const storageKey = 'tunifith-language'
const dictionaries: Record<Language, Record<TranslationKey, string>> = { fr, ar }

export function loadLanguage(): Language {
  return localStorage.getItem(storageKey) === 'ar' ? 'ar' : 'fr'
}

export function saveLanguage(language: Language): void {
  localStorage.setItem(storageKey, language)
}

export function translate(language: Language, key: TranslationKey): string {
  return dictionaries[language][key] ?? dictionaries.fr[key]
}

export async function syncLanguage(language: Language): Promise<void> {
  const config = { apiKey: import.meta.env.VITE_FIREBASE_API_KEY, authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, appId: import.meta.env.VITE_FIREBASE_APP_ID }
  if (!config.apiKey || !config.projectId) return
  const app = getApps().length ? getApps()[0] : initializeApp(config)
  const uid = getAuth(app).currentUser?.uid
  if (!uid) return
  await setDoc(doc(getFirestore(app), 'Users', uid), { language }, { merge: true })
}
