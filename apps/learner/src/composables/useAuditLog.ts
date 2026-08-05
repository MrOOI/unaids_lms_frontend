/** SysAdmin: read-only audit log (§17) — entries are written elsewhere, this only lists them. */
import { computed, reactive } from 'vue'
import { apiFetch, ApiError } from '../lib/http'
import type { AuditLogPageDto } from '../lib/api-types'

interface AuditLogState {
  isLoading: boolean
  error: string | null
}

const state = reactive<AuditLogState>({ isLoading: false, error: null })

export function useAuditLog() {
  const isLoading = computed(() => state.isLoading)
  const error = computed(() => state.error)

  async function getRecent(page: number, pageSize: number, action?: string, entityType?: string): Promise<AuditLogPageDto> {
    state.isLoading = true
    state.error = null
    try {
      return await apiFetch<AuditLogPageDto>('/admin/audit-log', {
        query: { page, pageSize, action: action || undefined, entityType: entityType || undefined },
      })
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Failed to load audit log'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  function clearError(): void {
    state.error = null
  }

  return { isLoading, error, getRecent, clearError }
}
