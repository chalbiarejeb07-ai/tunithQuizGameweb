import { doc, setDoc } from 'firebase/firestore'
import { getFirebaseServices } from './firebase'

/**
 * Audio du jeu — entièrement synthétisé via la Web Audio API : aucun fichier
 * son à charger, donc aucune dépendance réseau pendant une partie.
 */

export type VictorySoundId = 'fanfare' | 'mezoued' | 'stadium'
export type SoundPreferences = { enabled: boolean; volume: number; soundId: VictorySoundId; effects: boolean }

const storageKey = 'tunifith-victory-sound-preferences'

export const defaultSoundPreferences: SoundPreferences = { enabled: true, volume: 0.7, soundId: 'fanfare', effects: true }

export function loadSoundPreferences(): SoundPreferences {
  try {
    const saved = localStorage.getItem(storageKey)
    return saved ? { ...defaultSoundPreferences, ...(JSON.parse(saved) as Partial<SoundPreferences>) } : defaultSoundPreferences
  } catch {
    return defaultSoundPreferences
  }
}

export function saveSoundPreferences(preferences: SoundPreferences): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(preferences))
  } catch {
    // Stockage indisponible : les réglages restent valables pour la session.
  }
}

export async function syncSoundPreferences(preferences: SoundPreferences): Promise<void> {
  const services = getFirebaseServices()
  const uid = services?.auth.currentUser?.uid
  if (!services || !uid) return
  try {
    await setDoc(doc(services.db, 'Users', uid), { soundPreferences: preferences }, { merge: true })
  } catch (error) {
    console.warn('[sound] synchronisation des préférences impossible', error)
  }
}

// Un seul AudioContext pour toute l'application : les navigateurs en limitent
// le nombre, et en ouvrir un par son finit par échouer silencieusement.
let sharedContext: AudioContext | null = null

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return null
  if (!sharedContext) sharedContext = new AudioContextClass()
  // Les navigateurs suspendent le contexte tant qu'aucun geste utilisateur n'a eu lieu.
  if (sharedContext.state === 'suspended') void sharedContext.resume()
  return sharedContext
}

type Note = { frequency: number; start: number; duration: number; type?: OscillatorType }

function playNotes(notes: Note[], volume: number): void {
  const context = audioContext()
  if (!context) return
  const gain = context.createGain()
  gain.gain.value = Math.max(0, Math.min(1, volume))
  gain.connect(context.destination)
  for (const note of notes) {
    const oscillator = context.createOscillator()
    oscillator.type = note.type ?? 'sine'
    oscillator.frequency.value = note.frequency
    // Enveloppe courte par note : évite le « clic » de coupure brutale.
    const noteGain = context.createGain()
    const start = context.currentTime + note.start
    noteGain.gain.setValueAtTime(0.0001, start)
    noteGain.gain.exponentialRampToValueAtTime(1, start + 0.01)
    noteGain.gain.exponentialRampToValueAtTime(0.0001, start + note.duration)
    oscillator.connect(noteGain)
    noteGain.connect(gain)
    oscillator.start(start)
    oscillator.stop(start + note.duration + 0.02)
  }
}

const victoryPatterns: Record<VictorySoundId, number[]> = {
  fanfare: [523.25, 659.25, 783.99, 1046.5],
  mezoued: [293.66, 349.23, 440, 523.25],
  stadium: [392, 392, 523.25, 659.25],
}

export function playVictorySound(preferences: SoundPreferences): void {
  if (!preferences.enabled) return
  const type: OscillatorType = preferences.soundId === 'mezoued' ? 'triangle' : 'sine'
  playNotes(victoryPatterns[preferences.soundId].map((frequency, index) => ({ frequency, start: index * 0.13, duration: 0.18, type })), preferences.volume)
}

/** Petit accord ascendant : bonne réponse. */
export function playCorrectSound(preferences: SoundPreferences): void {
  if (!preferences.effects) return
  playNotes([{ frequency: 659.25, start: 0, duration: 0.09 }, { frequency: 987.77, start: 0.08, duration: 0.14 }], preferences.volume * 0.8)
}

/** Buzz descendant : mauvaise réponse. */
export function playWrongSound(preferences: SoundPreferences): void {
  if (!preferences.effects) return
  playNotes([{ frequency: 196, start: 0, duration: 0.16, type: 'sawtooth' }, { frequency: 146.83, start: 0.1, duration: 0.22, type: 'sawtooth' }], preferences.volume * 0.5)
}

/** Trois notes graves : le tour s'arrête. */
export function playTurnOverSound(preferences: SoundPreferences): void {
  if (!preferences.effects) return
  playNotes([
    { frequency: 392, start: 0, duration: 0.14, type: 'triangle' },
    { frequency: 329.63, start: 0.13, duration: 0.14, type: 'triangle' },
    { frequency: 261.63, start: 0.26, duration: 0.26, type: 'triangle' },
  ], preferences.volume * 0.6)
}
