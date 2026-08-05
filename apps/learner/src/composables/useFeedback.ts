/** Course feedback (§16) — a learner's own submission, editable via resubmit. */
import { computed, reactive } from 'vue'
import { apiFetch, ApiError } from '../lib/http'
import type { FeedbackResponseDto, SubmitFeedbackRequest } from '../lib/api-types'

interface FeedbackState {
  isLoading: boolean
  error: string | null
}

const state = reactive<FeedbackState>({ isLoading: false, error: null })

export function useFeedback() {
  const isLoading = computed(() => state.isLoading)
  const error = computed(() => state.error)

  async function getMyFeedback(courseId: string): Promise<FeedbackResponseDto | null> {
    try {
      return await apiFetch<FeedbackResponseDto>(`/courses/${courseId}/feedback`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null
      throw err
    }
  }

  async function submit(courseId: string, request: SubmitFeedbackRequest): Promise<void> {
    state.isLoading = true
    state.error = null
    try {
      await apiFetch(`/courses/${courseId}/feedback`, { method: 'POST', body: request })
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Failed to submit feedback'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  function clearError(): void {
    state.error = null
  }

  return { isLoading, error, getMyFeedback, submit, clearError }
}
