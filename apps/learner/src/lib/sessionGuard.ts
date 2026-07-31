/**
 * Reacts to a mid-session 401 (SESSION_EXPIRED_EVENT, dispatched by
 * lib/http.ts) by clearing local auth state and sending the user back to the
 * login page — without this, a call failing after the cookie expires would
 * just surface as a raw error on whatever view triggered it, instead of
 * "user if not authenticated → login page" holding true throughout the app,
 * not just on the initial navigation.
 */
import type { Router } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { SESSION_EXPIRED_EVENT } from './http'

export function installSessionGuard(router: Router): void {
  window.addEventListener(SESSION_EXPIRED_EVENT, () => {
    const { clearSession } = useAuth()
    clearSession()

    const current = router.currentRoute.value
    if (current.meta.requiresAuth === false) {
      // Already on a public page (login, register, certificate verify…) — no redirect needed.
      return
    }

    router.push({ name: 'login', query: { from: current.fullPath, expired: '1' } })
  })
}
