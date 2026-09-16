import { getApps, initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile, type User } from 'firebase/auth'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { getFirebaseConfig, getFirebaseServices, getMissingFirebaseConfigKeys } from './firebase'

async function saveUserProfile(user: User): Promise<void> {
  const services = getFirebaseServices()
  if (services) {
    const profileDocument = doc(services.db, 'Users', user.uid)
    const existingProfile = await getDoc(profileDocument)
    await setDoc(profileDocument, { displayName: user.displayName ?? '', email: user.email ?? '', status: 'Active', ...(existingProfile.exists() ? {} : { role: 'user' }) }, { merge: true })
  }
}

export async function createMissingUserProfile(user: User): Promise<void> {
  await saveUserProfile(user)
}

export type UserProfile = { displayName: string; email: string; username?: string; status: 'Active' | 'Inactive' | 'Banned'; role: 'admin' | 'user' | 'player' }

export function firebaseErrorMessage(error: unknown, fallback = 'Une erreur Firebase est survenue.') {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
    'auth/invalid-credential': 'Mot de passe incorrect.',
    'auth/invalid-email': 'Cette adresse email est invalide.',
    'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
    'auth/user-not-found': 'Aucun compte n’existe avec cet email. Crée d’abord un compte via Sign Up.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/too-many-requests': 'Trop de tentatives, réessaie dans quelques minutes.',
    'auth/popup-closed-by-user': 'La fenêtre Google a été fermée.',
    'auth/operation-not-allowed': 'Cette méthode de connexion est désactivée dans Firebase.',
    'permission-denied': 'Firestore a refusé la lecture. Vérifiez les règles et le rôle admin.',
    'failed-precondition': 'Firestore n’est pas prêt ou sa configuration est incomplète.',
  }
  if (messages[code]) return messages[code]
  if (code) return `${fallback} (${code})`
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  return fallback
}

export function subscribeToUserProfile(user: User, onChange: (profile: UserProfile | null, exists: boolean) => void, onError: (error: unknown) => void): () => void {
  const services = getFirebaseServices()
  if (!services) { onChange(null, false); return () => undefined }
  return onSnapshot(doc(services.db, 'Users', user.uid), (snapshot) => {
    const data = snapshot.data() as Partial<UserProfile> | undefined
    onChange(data ? { displayName: data.displayName ?? user.displayName ?? '', email: data.email ?? user.email ?? '', username: data.username, status: data.status ?? 'Active', role: data.role ?? 'user' } : null, snapshot.exists())
  }, onError)
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  const services = getFirebaseServices()
  if (!services) { callback(null); return () => undefined }
  return onAuthStateChanged(services.auth, callback)
}

export async function login(): Promise<User> {
  const services = getFirebaseServices()
  if (!services) throw new Error(`Firebase is not configured. Missing: ${getMissingFirebaseConfigKeys().join(', ')}`)
  const result = await signInWithPopup(services.auth, new GoogleAuthProvider())
  await saveUserProfile(result.user)
  return result.user
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const services = getFirebaseServices()
  if (!services) throw new Error(`Firebase is not configured. Missing: ${getMissingFirebaseConfigKeys().join(', ')}`)
  try {
    const result = await signInWithEmailAndPassword(services.auth, email, password)
    await saveUserProfile(result.user)
    return result.user
  } catch (error) {
    console.error('[auth] login email échoué', { code: (error as { code?: string }).code, error })
    throw error
  }
}

export async function signupWithEmail(displayName: string, email: string, username: string, password: string): Promise<User> {
  const services = getFirebaseServices()
  if (!services) throw new Error(`Firebase is not configured. Missing: ${getMissingFirebaseConfigKeys().join(', ')}`)
  console.info('[auth] signup: création du compte', { email, username })
  let result
  try {
    result = await createUserWithEmailAndPassword(services.auth, email, password)
  } catch (error) {
    console.error('[auth] signup: échec création Auth', { code: (error as { code?: string }).code, error })
    throw error
  }
  console.info('[auth] signup: compte créé', { uid: result.user.uid })
  try {
    await updateProfile(result.user, { displayName })
  } catch (error) {
    console.error('[auth] signup: échec mise à jour du profil Auth', { code: (error as { code?: string }).code, error })
    throw error
  }
  console.info('[auth] signup: profil Auth mis à jour', { displayName })
  const profileDocument = doc(services.db, 'Users', result.user.uid)
  try {
    await setDoc(profileDocument, { displayName, username, email, status: 'Active', role: 'user' }, { merge: true })
  } catch (error) {
    console.error('[auth] signup: échec création Firestore', { code: (error as { code?: string }).code, error })
    throw error
  }
  console.info('[auth] signup: profil Firestore enregistré', { uid: result.user.uid })
  return result.user
}

export const signUpWithEmail = signupWithEmail

export async function createUserForAdmin(displayName: string, email: string, password: string): Promise<User> {
  const config = getFirebaseConfig()
  if (!config.apiKey || !config.projectId) throw new Error('Firebase is not configured.')
  const app = getApps().find((item) => item.name === 'admin-user-creation') ?? initializeApp(config, 'admin-user-creation')
  const auth = getAuth(app)
  const result = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(result.user, { displayName })
  await signOut(auth)
  return result.user
}

export async function logout(): Promise<void> {
  const services = getFirebaseServices()
  if (services) await signOut(services.auth)
}
