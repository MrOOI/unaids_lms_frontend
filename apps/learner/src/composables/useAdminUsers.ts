/** SysAdmin: user search, role assignment, deactivate/reactivate (§5.3). */
import { computed, reactive } from 'vue'
import { apiFetch, ApiError } from '../lib/http'
import type { AdminUserPageDto } from '../lib/api-types'

interface AdminUsersState {
  isLoading: boolean
  error: string | null
}

const state = reactive<AdminUsersState>({ isLoading: false, error: null })

export function useAdminUsers() {
  const isLoading = computed(() => state.isLoading)
  const error = computed(() => state.error)

  async function list(search: string, page: number, pageSize: number): Promise<AdminUserPageDto> {
    state.isLoading = true
    state.error = null
    try {
      return await apiFetch<AdminUserPageDto>('/admin/users', {
        query: { search: search || undefined, page, pageSize },
      })
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Failed to load users'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  async function addRole(userId: string, role: string): Promise<void> {
    await apiFetch(`/admin/users/${userId}/roles/${role}`, { method: 'PUT' })
  }

  async function removeRole(userId: string, role: string): Promise<void> {
    await apiFetch(`/admin/users/${userId}/roles/${role}`, { method: 'DELETE' })
  }

  async function deactivate(userId: string): Promise<void> {
    await apiFetch(`/admin/users/${userId}/deactivate`, { method: 'PUT' })
  }

  async function reactivate(userId: string): Promise<void> {
    await apiFetch(`/admin/users/${userId}/reactivate`, { method: 'PUT' })
  }

  function clearError(): void {
    state.error = null
  }

  return { isLoading, error, list, addRole, removeRole, deactivate, reactivate, clearError }
}
