import { UI } from './lang/ui.js'
import { CONTENT } from './lang/content.js'
import { PROGRAM } from './lang/program.js'
import { MISC } from './lang/misc.js'

const DICT = { ...UI, ...CONTENT, ...PROGRAM, ...MISC }

export const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'pt', label: 'Português', dir: 'ltr' },
  { code: 'es', label: 'Español', dir: 'ltr' },
  { code: 'de', label: 'Deutsch', dir: 'ltr' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'it', label: 'Italiano', dir: 'ltr' }
]

export const locale = $state({ code: 'en', dir: 'ltr' })

export function detectLang() {
  const n = (typeof navigator !== 'undefined' && navigator.language) || 'en'
  const low = n.toLowerCase()
  if (low.startsWith('ar')) return 'ar'
  if (low.startsWith('pt')) return 'pt'
  if (low.startsWith('es')) return 'es'
  if (low.startsWith('de')) return 'de'
  if (low.startsWith('fr')) return 'fr'
  if (low.startsWith('it')) return 'it'
  return 'en'
}

export function applyDir(code) {
  const lang = LANGUAGES.find((l) => l.code === code) || LANGUAGES[0]
  locale.code = lang.code
  locale.dir = lang.dir
  if (typeof document !== 'undefined') {
    document.documentElement.dir = lang.dir
    document.documentElement.lang = lang.code
  }
}

export function setLocale(code) {
  applyDir(code)
}

// Translate a source string. Keys are the English strings themselves, so any
// missing translation falls back to English gracefully.
export function t(text) {
  if (!text) return text
  const entry = DICT[text]
  if (!entry) return text
  return entry[locale.code] || text
}

// Translate a template with {placeholders}, e.g. tf('Last {range} days', { range: 30 })
export function tf(text, vars) {
  const s = t(text)
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`))
}
