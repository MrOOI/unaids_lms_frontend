/** Platform metadata (GET /api/meta) — fetched once at shell startup. */
import { computed, reactive } from 'vue'
import { apiFetch } from '../lib/http'
import type { PlatformMeta } from '../lib/api-types'

interface MetaState {
  meta: PlatformMeta | null
  isLoading: boolean
}

const state = reactive<MetaState>({ meta: null, isLoading: false })

export function useMeta() {
  const meta = computed(() => state.meta)

  async function fetchMeta(): Promise<PlatformMeta | null> {
    if (state.meta) return state.meta
    state.isLoading = true
    try {
      state.meta = await apiFetch<PlatformMeta>('/meta')
      return state.meta
    } catch {
      return null
    } finally {
      state.isLoading = false
    }
  }

  return { meta, fetchMeta }
}
