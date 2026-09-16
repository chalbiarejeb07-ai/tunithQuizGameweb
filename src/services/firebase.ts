import { getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const requiredConfig = [
  ['VITE_FIREBASE_API_KEY', config.apiKey],
  ['VITE_FIREBASE_AUTH_DOMAIN', config.authDomain],
  ['VITE_FIREBASE_PROJECT_ID', config.projectId],
  ['VITE_FIREBASE_STORAGE_BUCKET', config.storageBucket],
  ['VITE_FIREBASE_MESSAGING_SENDER_ID', config.messagingSenderId],
  ['VITE_FIREBASE_APP_ID', config.appId],
] as const

function isConfiguredValue(value: string | undefined): boolean {
  if (!value?.trim()) return false
  return !/^your[-_]|^YOUR[-_]|^your-project|^your-web|^your-messaging/i.test(value.trim())
}

export function getMissingFirebaseConfigKeys(): string[] {
  return requiredConfig.filter(([, value]) => !isConfiguredValue(value)).map(([key]) => key)
}

export function getFirebaseConfig() {
  return config
}

export function getFirebaseServices() {
  if (getMissingFirebaseConfigKeys().length > 0) return null
  const app = getApps().length ? getApps()[0] : initializeApp(config)
  return { app, auth: getAuth(app), db: getFirestore(app) }
}
