/**
 * Authentication composable — login, registration, OTP verification, profile
 * photo. Session state is a module-level singleton so every component shares
 * the same reactive `user`.
 */

import { computed, reactive } from 'vue'
import { apiFetch, ApiError } from '../lib/http'
import type { RegisterRequest, UserResponse } from '../lib/api-types'
import { isAdminRole, isSysAdminRole, canViewReporting } from '../lib/api-types'

interface AuthState {
  user: UserResponse | null
  isLoading: boolean
  error: string | null
  /** Undetermined until the first /auth/me (or login) call resolves. */
  isReady: boolean
}

const state = reactive<AuthState>({
  user: null,
  isLoading: false,
  error: null,
  isReady: false,
})

/** Dedupes concurrent fetchMe() calls (e.g. two guarded navigations racing on app boot). */
let inFlightFetchMe: Promise<UserResponse | null> | null = null

export function useAuth() {
  const isLoading = computed(() => state.isLoading)
  const error = computed(() => state.error)
  const user = computed(() => state.user)
  const isAuthenticated = computed(() => !!state.user)
  const isReady = computed(() => state.isReady)
  const isAdmin = computed(() => isAdminRole(state.user?.roles))
  const isSysAdmin = computed(() => isSysAdminRole(state.user?.roles))
  const isObserver = computed(() => canViewReporting(state.user?.roles))

  async function register(payload: RegisterRequest): Promise<{ email: string; message: string }> {
    state.isLoading = true
    state.error = null
    try {
      return await apiFetch('/auth/register', { method: 'POST', body: payload })
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Registration failed'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  async function verifyOtp(email: string, otpCode: string): Promise<UserResponse> {
    state.isLoading = true
    state.error = null
    try {
      const user = await apiFetch<UserResponse>('/auth/verify-otp', {
        method: 'POST',
        body: { email, otpCode },
      })
      state.user = user
      state.isReady = true
      return user
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Verification failed'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  async function resendOtp(email: string): Promise<{ message: string }> {
    state.isLoading = true
    state.error = null
    try {
      return await apiFetch('/auth/resend-otp', { method: 'POST', body: { email } })
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Failed to resend code'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  async function login(email: string, password: string): Promise<UserResponse> {
    state.isLoading = true
    state.error = null
    try {
      const user = await apiFetch<UserResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      state.user = user
      state.isReady = true
      return user
    } catch (err) {
      if (err instanceof ApiError) {
        // 401 carries no body from the backend; use a stable code the view
        // translates itself rather than a raw (untranslatable) message.
        state.error = err.status === 401 ? 'invalid_credentials' : err.message
      } else {
        state.error = 'Login failed'
      }
      throw err
    } finally {
      state.isLoading = false
    }
  }

  /**
   * Resolves the current session; never throws. Used by the router guard.
   * Concurrent calls (e.g. two navigations racing before the first resolves)
   * share a single in-flight request instead of firing duplicate /auth/me calls.
   */
  async function fetchMe(): Promise<UserResponse | null> {
    if (inFlightFetchMe) {
      return inFlightFetchMe
    }

    state.isLoading = true
    inFlightFetchMe = (async () => {
      try {
        const user = await apiFetch<UserResponse>('/auth/me')
        state.user = user
        return user
      } catch {
        state.user = null
        return null
      } finally {
        state.isLoading = false
        state.isReady = true
      }
    })()

    try {
      return await inFlightFetchMe
    } finally {
      inFlightFetchMe = null
    }
  }

  async function logout(): Promise<void> {
    state.isLoading = true
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } catch {
      // Best-effort — clear local state regardless.
    } finally {
      state.user = null
      state.isLoading = false
    }
  }

  /**
   * Clears local session state without calling the backend — used when we
   * already know the session is gone (e.g. a 401 arrived on some other
   * authenticated call), so there's no point round-tripping /auth/logout.
   */
  function clearSession(): void {
    state.user = null
  }

  async function uploadProfilePhoto(file: File): Promise<{ id: string; message: string }> {
    state.isLoading = true
    state.error = null
    try {
      const formData = new FormData()
      formData.append('file', file)
      return await apiFetch('/auth/profile/photo', { method: 'PUT', body: formData, raw: true })
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Failed to upload photo'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  function clearError(): void {
    state.error = null
  }

  return {
    isLoading,
    error,
    user,
    isAuthenticated,
    isReady,
    isAdmin,
    isSysAdmin,
    isObserver,

    register,
    verifyOtp,
    resendOtp,
    login,
    fetchMe,
    logout,
    clearSession,
    uploadProfilePhoto,
    clearError,
  }
}
