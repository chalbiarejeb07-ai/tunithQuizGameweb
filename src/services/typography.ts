import type { Language } from './i18n'

/** Espace fine insécable — U+202F. */
const NARROW_NBSP = ' '

/**
 * Applique les espacements typographiques français.
 *
 * En français, les signes doubles (? ! ; :) et les guillemets prennent une
 * espace avant — mais une espace *insécable*, sinon le signe part seul à la
 * ligne. C'était visible sur l'écran de jeu : « … de la Tunisie » suivi d'un
 * « ? » orphelin sur la ligne suivante.
 */
export function frenchSpacing(text: string, language: Language): string {
  if (language !== 'fr') return text
  return text
    .replace(/\s+([?!;:»])/g, `${NARROW_NBSP}$1`)
    .replace(/(«)\s+/g, `$1${NARROW_NBSP}`)
}
