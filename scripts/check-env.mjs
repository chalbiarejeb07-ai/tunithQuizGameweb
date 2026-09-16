import { existsSync, readFileSync } from 'node:fs'

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]
const envPath = '.env.local'
const values = existsSync(envPath)
  ? Object.fromEntries(readFileSync(envPath, 'utf8').split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    return match ? [[match[1], match[2].replace(/^['"]|['"]$/g, '')]] : []
  }))
  : {}
const isConfiguredValue = (value) => Boolean(value?.trim()) && !/^your[-_]|^YOUR[-_]|^your-project|^your-web|^your-messaging/i.test(value.trim())

let valid = true
console.log(`Vérification de ${envPath}`)
for (const key of requiredKeys) {
  const present = isConfiguredValue(values[key])
  console.log(`${present ? '✅' : '❌'} ${key}`)
  if (!present) valid = false
}

if (!valid) {
  console.error(`\nConfiguration incomplète. Créez ${envPath} avec :`)
  console.error('  Copy-Item .env.example .env.local  (Windows PowerShell)')
  console.error('  cp .env.example .env.local       (macOS/Linux)')
  process.exit(1)
}

console.log('\nConfiguration Firebase complète.')
