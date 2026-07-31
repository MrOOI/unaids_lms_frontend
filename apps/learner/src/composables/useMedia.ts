/** Media upload (admin-only) and URL resolution for uploaded assets. */
import { computed, reactive } from 'vue'
import { apiFetch, ApiError, mediaUrl } from '../lib/http'

interface MediaState {
  isLoading: boolean
  error: string | null
}

const state = reactive<MediaState>({ isLoading: false, error: null })

export function useMedia() {
  const isLoading = computed(() => state.isLoading)
  const error = computed(() => state.error)

  async function upload(file: File): Promise<{ id: string; url: string }> {
    state.isLoading = true
    state.error = null
    try {
      const formData = new FormData()
      formData.append('file', file)
      return await apiFetch<{ id: string; url: string }>('/media', { method: 'POST', body: formData, raw: true })
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Upload failed'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  function clearError(): void {
    state.error = null
  }

  return { isLoading, error, upload, clearError, mediaUrl }
}
