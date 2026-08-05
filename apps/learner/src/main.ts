import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import {
  DEFAULT_LOCALE,
  FALLBACK_CHAIN,
  isSupportedLocale,
  messages,
} from '@lms/i18n'
import App from './App.vue'
import { router } from './router'
import { installSessionGuard } from './lib/sessionGuard'
import { initOfflineOutbox } from './lib/offlineOutbox'
// Side-effect imports: each registers its offline-outbox handler(s) at
// module load, before initOfflineOutbox's first flush() can run.
import './composables/useProgress'
import './composables/useQuizzes'
import '@lms/ui/tokens.css'
import './styles/tailwind.css'
import './styles/base.css'

const storedLocale = localStorage.getItem('lms-locale')
const initialLocale = isSupportedLocale(storedLocale) ? storedLocale : DEFAULT_LOCALE

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: FALLBACK_CHAIN,
  messages,
})

document.documentElement.lang = initialLocale

installSessionGuard(router)
void initOfflineOutbox()

createApp(App).use(createPinia()).use(router).use(i18n).mount('#app')
