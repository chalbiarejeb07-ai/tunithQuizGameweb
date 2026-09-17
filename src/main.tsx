import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { getMissingFirebaseConfigKeys } from './services/firebase'

// L'application démarre toujours, configurée ou non : le jeu local fonctionne
// sans réseau et sans Firebase. L'absence de configuration est signalée dans
// l'interface (bandeau « hors ligne »), elle ne bloque plus le démarrage.
const missing = getMissingFirebaseConfigKeys()
if (missing.length > 0) {
  console.warn(`[firebase] configuration incomplète (${missing.join(', ')}) — mode hors ligne : authentification et sauvegarde désactivées, le jeu reste jouable.`)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
