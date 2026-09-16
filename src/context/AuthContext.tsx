import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { login as signInWithGoogle, loginWithEmail as signInWithEmail, logout as signOutUser, signupWithEmail as registerWithEmail, subscribeToAuth, subscribeToUserProfile, type UserProfile } from '../services/authService'

type AuthContextValue = { user: User | null; loading: boolean; profile: UserProfile | null; profileLoading: boolean; profileExists: boolean; profileError: unknown; login: () => Promise<User>; loginWithEmail: (email: string, password: string) => Promise<User>; signupWithEmail: (displayName: string, email: string, username: string, password: string) => Promise<User>; logout: () => Promise<void> }
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileExists, setProfileExists] = useState(false)
  const [profileError, setProfileError] = useState<unknown>(null)
  useEffect(() => subscribeToAuth((nextUser) => { setUser(nextUser); setLoading(false) }), [])
  useEffect(() => {
    if (loading || !user) { setProfile(null); setProfileExists(false); setProfileError(null); setProfileLoading(false); return }
    setProfileLoading(true); setProfileError(null)
    return subscribeToUserProfile(user, (nextProfile, exists) => { setProfile(nextProfile); setProfileExists(exists); setProfileLoading(false) }, (error) => { console.error('[profile] lecture Firestore échouée', error); setProfileError(error); setProfileLoading(false) })
  }, [loading, user])
  return <AuthContext.Provider value={{ user, loading, profile, profileLoading, profileExists, profileError, login: signInWithGoogle, loginWithEmail: signInWithEmail, signupWithEmail: registerWithEmail, logout: signOutUser }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
