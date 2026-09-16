import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { getMissingFirebaseConfigKeys } from './services/firebase'

function FirebaseConfigError({ missingKeys }: { missingKeys: string[] }) {
  return <main className="firebase-config-error">
    <section className="firebase-config-panel" role="alert">
      <p className="firebase-config-eyebrow">Configuration requise</p>
      <h1>Firebase n’est pas configuré</h1>
      <p>L’application est bloquée tant que ces variables d’environnement sont absentes ou vides :</p>
      <ul>{missingKeys.map((key) => <li key={key}><code>{key}</code></li>)}</ul>
      <p>Créez <code>.env.local</code> à partir de <code>.env.example</code>, puis remplacez les valeurs par celles de Firebase Console &gt; Paramètres du projet &gt; Vos applications.</p>
      <p>Après toute modification de <code>.env.local</code>, redémarrez <code>npm run dev</code> : Vite ne recharge pas les variables d’environnement à chaud.</p>
      <div className="firebase-config-commands"><code>cp .env.example .env.local</code><code>Copy-Item .env.example .env.local</code></div>
    </section>
  </main>
}

const missingFirebaseConfig = getMissingFirebaseConfigKeys()
const root = createRoot(document.getElementById('root')!)
root.render(missingFirebaseConfig.length > 0
  ? <FirebaseConfigError missingKeys={missingFirebaseConfig} />
  : <StrictMode><AuthProvider><App /></AuthProvider></StrictMode>)
