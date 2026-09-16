import { getApps, initializeApp, applicationDefault, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { existsSync, readFileSync } from 'node:fs'

const positional = []
const options = {}
for (const argument of process.argv.slice(2)) {
  const match = argument.match(/^--([^=]+)=(.*)$/)
  if (match) options[match[1]] = match[2]
  else positional.push(argument)
}

const email = options.email ?? positional[0]
const password = options.password ?? positional[1]
const displayName = options['display-name'] ?? positional[2] ?? 'Administrateur'
const credentialsPath = options.credentials ?? positional[3]

if (!email || !password) {
  console.error('Usage: npm run create-admin -- --email=admin@example.com --password="mot-de-passe" [--display-name="Administrateur"] [--credentials="C:\\path\\service-account.json"]')
  process.exit(1)
}

const credentialFile = credentialsPath ?? process.env.GOOGLE_APPLICATION_CREDENTIALS
const credential = credentialFile && existsSync(credentialFile)
  ? cert(JSON.parse(readFileSync(credentialFile, 'utf8')))
  : applicationDefault()

let app
try {
  app = getApps()[0] ?? initializeApp({ credential })
} catch (error) {
  console.error('Impossible d’initialiser Firebase Admin. Fournissez GOOGLE_APPLICATION_CREDENTIALS ou passez le chemin du JSON en 4e argument.')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
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

console.log(`Compte admin prêt: ${email} (${user.uid})`)