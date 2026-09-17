import type { Screen } from '../types'

/**
 * Table des routes — une URL lisible par écran.
 *
 * L'application n'avait aucune navigation par URL : impossible de partager un
 * lien, d'actualiser sans repartir du menu, ou d'utiliser le bouton retour du
 * navigateur. Chaque écran a désormais son adresse.
 */
export const routes: Record<string, Screen> = {
  '/': 'menu',
  '/configuration': 'setup',
  '/partie': 'game',
  '/resultats': 'results',
  '/en-ligne': 'online',
  '/profil': 'profile',
  '/reglages': 'settings',
  '/connexion': 'login',
  '/inscription': 'signup',
  '/admin': 'admin',
}

const paths = Object.entries(routes).reduce<Record<Screen, string>>((all, [path, screen]) => {
  all[screen] = path
  return all
}, {} as Record<Screen, string>)

export function pathForScreen(screen: Screen): string {
  return paths[screen] ?? '/'
}

export function screenForPath(pathname: string): Screen | null {
  // Tolère la barre finale : « /profil/ » mène au même endroit que « /profil ».
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return routes[normalized || '/'] ?? null
}
