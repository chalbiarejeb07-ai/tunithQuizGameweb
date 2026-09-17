import { useCallback, useEffect, useState } from 'react'
import { pathForScreen, screenForPath } from './routes'
import type { Screen } from '../types'

type NavigateOptions = { replace?: boolean }

/**
 * Routeur minimal bâti sur l'History API — sans dépendance.
 *
 * Il fait tenir ensemble trois choses que l'application ne savait pas faire :
 * le bouton retour du navigateur, l'actualisation qui conserve l'écran courant,
 * et les liens directs (`/admin` ouvre le tableau de bord).
 */
export function useRouter(fallback: Screen = 'menu') {
  const [screen, setScreen] = useState<Screen>(() => screenForPath(window.location.pathname) ?? fallback)

  // Une URL inconnue est réécrite vers l'accueil sans empiler d'entrée
  // d'historique : le bouton retour ne ramène pas sur la page morte.
  useEffect(() => {
    if (screenForPath(window.location.pathname) === null) {
      window.history.replaceState(null, '', pathForScreen(fallback))
    }
  }, [fallback])

  useEffect(() => {
    const onPopState = () => setScreen(screenForPath(window.location.pathname) ?? fallback)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [fallback])

  const navigate = useCallback((next: Screen, options: NavigateOptions = {}) => {
    const path = pathForScreen(next)
    if (window.location.pathname !== path) {
      if (options.replace) window.history.replaceState(null, '', path)
      else window.history.pushState(null, '', path)
    }
    setScreen(next)
    // Une navigation replace le focus en haut : sans cela, un lecteur d'écran
    // reste sur l'élément cliqué et l'utilisateur ne « voit » pas le changement.
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [])

  /** Recule dans l'historique, ou rejoint `fallback` si l'on vient d'ailleurs. */
  const back = useCallback(() => {
    if (window.history.length > 1) window.history.back()
    else navigate(fallback, { replace: true })
  }, [navigate, fallback])

  return { screen, navigate, back }
}
