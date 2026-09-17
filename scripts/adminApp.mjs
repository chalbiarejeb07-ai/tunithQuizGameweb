import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { existsSync, readFileSync } from 'node:fs'

/** Découpe `--clef=valeur` et les arguments positionnels. */
export function parseArgs(argv = process.argv.slice(2)) {
  const positional = []
  const options = {}
  for (const argument of argv) {
    const match = argument.match(/^--([^=]+)=(.*)$/)
    if (match) options[match[1]] = match[2]
    else positional.push(argument)
  }
  return { positional, options }
}

/**
 * Initialise Firebase Admin depuis un fichier de service account explicite ou
 * depuis les Application Default Credentials.
 */
export function initAdmin(credentialsPath) {
  const file = credentialsPath ?? process.env.GOOGLE_APPLICATION_CREDENTIALS
  const credential = file && existsSync(file) ? cert(JSON.parse(readFileSync(file, 'utf8'))) : applicationDefault()
  try {
    return getApps()[0] ?? initializeApp({ credential })
  } catch (error) {
    console.error('Impossible d’initialiser Firebase Admin.')
    console.error('Fournissez GOOGLE_APPLICATION_CREDENTIALS ou passez --credentials="C:\\chemin\\service-account.json".')
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
