/**
 * Crée (ou met à jour) le premier administrateur. Le rôle admin ne peut pas être
 * attribué depuis le navigateur : les règles Firestore l'interdisent.
 *
 *   npm run create-admin -- admin@example.com "mot-de-passe" "Nom Admin"
 *   npm run create-admin -- --email=… --password=… --display-name=… --credentials=…
 */
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { initAdmin, parseArgs } from './adminApp.mjs'

const { positional, options } = parseArgs()
const email = options.email ?? positional[0]
const password = options.password ?? positional[1]
const displayName = options['display-name'] ?? positional[2] ?? 'Administrateur'
const credentialsPath = options.credentials ?? positional[3]

if (!email || !password) {
  console.error('Usage: npm run create-admin -- --email=admin@example.com --password="mot-de-passe" [--display-name="Administrateur"] [--credentials="C:\\chemin\\service-account.json"]')
  process.exit(1)
}

const app = initAdmin(credentialsPath)
const auth = getAuth(app)
const db = getFirestore(app)

let user
try {
  user = await auth.createUser({ email, password, displayName })
} catch (error) {
  if (error.code !== 'auth/email-already-exists') throw error
  user = await auth.getUserByEmail(email)
  await auth.updateUser(user.uid, { password, displayName })
}

await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin: true })
await db.collection('Users').doc(user.uid).set({
  displayName,
  email,
  status: 'Active',
  role: 'admin',
  updatedAt: FieldValue.serverTimestamp(),
}, { merge: true })

console.log(`Compte admin prêt : ${email} (${user.uid})`)
