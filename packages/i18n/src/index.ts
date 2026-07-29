import uz from './locales/uz.json'
import kaa from './locales/kaa.json'
import en from './locales/en.json'
import ru from './locales/ru.json'

/** Contractual platform locales (Texnik topshiriq §7). Order = display order. */
export const SUPPORTED_LOCALES = ['uz', 'kaa', 'en', 'ru'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = 'uz'

/** Native-language names for the language switcher. */
export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  uz: "O'zbekcha",
  kaa: 'Qaraqalpaqsha',
  en: 'English',
  ru: 'Русский',
}

/** Content fallback order — mirrors Locale.FallbackChain in the backend. */
export const FALLBACK_CHAIN: Record<SupportedLocale, SupportedLocale[]> = {
  uz: ['ru', 'en'],
  kaa: ['uz', 'ru'],
  en: ['ru', 'uz'],
  ru: ['uz', 'en'],
}

export const messages = { uz, kaa, en, ru }

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}
