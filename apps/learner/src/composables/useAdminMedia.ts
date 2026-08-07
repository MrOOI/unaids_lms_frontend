/** CourseAdmin/SysAdmin: browse and search previously uploaded media (§13 gap — uploads were write-only). */
import { computed, reactive } from 'vue'
import { apiFetch, ApiError } from '../lib/http'
import type { MediaAssetPage } from '../lib/api-types'

interface AdminMediaState {
  isLoading: boolean
  error: string | null
}

const state = reactive<AdminMediaState>({ isLoading: false, error: null })

export function useAdminMedia() {
  const isLoading = computed(() => state.isLoading)
  const error = computed(() => state.error)

  async function list(search: string, page: number, pageSize: number): Promise<MediaAssetPage> {
    state.isLoading = true
    state.error = null
    try {
      return await apiFetch<MediaAssetPage>('/admin/media', {
        query: { search: search || undefined, page, pageSize },
      })
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Failed to load media'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  function clearError(): void {
    state.error = null
  }

  return { isLoading, error, list, clearError }
}
