import { doc, getFirestore, setDoc } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getApps, initializeApp } from 'firebase/app'

export type VictorySoundId = 'fanfare' | 'mezoued' | 'stadium'

export type VictorySoundPreferences = {
  enabled: boolean
  volume: number
  soundId: VictorySoundId
}

const storageKey = 'tunifith-victory-sound-preferences'

export const defaultVictorySoundPreferences: VictorySoundPreferences = {
  enabled: true,
  volume: 0.7,
  soundId: 'fanfare',
}

export function loadVictorySoundPreferences(): VictorySoundPreferences {
  try {
    const saved = localStorage.getItem(storageKey)
    return saved ? { ...defaultVictorySoundPreferences, ...JSON.parse(saved) } : defaultVictorySoundPreferences
  } catch {
    return defaultVictorySoundPreferences
  }
}

export function saveVictorySoundPreferences(preferences: VictorySoundPreferences): void {
  localStorage.setItem(storageKey, JSON.stringify(preferences))
}

export async function syncVictorySoundPreferences(preferences: VictorySoundPreferences): Promise<void> {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
  if (!config.apiKey || !config.projectId) return
  const app = getApps().length ? getApps()[0] : initializeApp(config)
  const uid = getAuth(app).currentUser?.uid
  if (!uid) return
  await setDoc(doc(getFirestore(app), 'Users', uid), { victorySoundPreferences: preferences }, { merge: true })
}

export function playVictorySound(preferences: VictorySoundPreferences): void {
  if (!preferences.enabled || typeof window === 'undefined') return
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return
  const context = new AudioContextClass()
  const gain = context.createGain()
  gain.gain.value = Math.max(0, Math.min(1, preferences.volume))
  gain.connect(context.destination)
  const patterns: Record<VictorySoundId, number[]> = {
    fanfare: [523.25, 659.25, 783.99, 1046.5],
    mezoued: [293.66, 349.23, 440, 523.25],
    stadium: [392, 392, 523.25, 659.25],
  }
  patterns[preferences.soundId].forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    oscillator.type = preferences.soundId === 'mezoued' ? 'triangle' : 'sine'
    oscillator.frequency.value = frequency
    oscillator.connect(gain)
    const start = context.currentTime + index * 0.13
    oscillator.start(start)
    oscillator.stop(start + 0.18)
  })
  window.setTimeout(() => void context.close(), 900)
}
