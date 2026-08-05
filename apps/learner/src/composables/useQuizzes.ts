/**
 * Learner-facing quiz flow: list a module's quizzes, start/resume an
 * attempt, submit answers, view attempt history. Mirrors IQuizService.
 */
import { computed, reactive } from 'vue'
import { apiFetch, ApiError } from '../lib/http'
import { enqueue, registerOutboxHandler } from '../lib/offlineOutbox'
import type {
  AttemptDto,
  AttemptHistoryItemDto,
  AttemptResultDto,
  QuizSummaryDto,
  SubmitAttemptRequest,
} from '../lib/api-types'

interface QueuedSubmission {
  attemptId: string
  request: SubmitAttemptRequest
  locale: string
}

interface QuizzesState {
  isLoading: boolean
  error: string | null
  moduleQuizzes: Record<string, QuizSummaryDto[]>
  activeAttempt: AttemptDto | null
  lastResult: AttemptResultDto | null
  history: AttemptHistoryItemDto[]
  queuedAttemptIds: Set<string>
}

const state = reactive<QuizzesState>({
  isLoading: false,
  error: null,
  moduleQuizzes: {},
  activeAttempt: null,
  lastResult: null,
  history: [],
  queuedAttemptIds: new Set(),
})

/**
 * Registered once at module load (see main.ts). Answers submitted offline
 * can't be scored locally — grading only happens once the server sees them
 * — so this just replays the submission; the learner checks their result
 * later (attempt history) rather than the view holding a fake result open.
 */
registerOutboxHandler('submitAttempt', async (payload: QueuedSubmission) => {
  await apiFetch<AttemptResultDto>(`/attempts/${payload.attemptId}/submit`, {
    method: 'POST',
    body: payload.request,
    query: { locale: payload.locale },
  })
  state.queuedAttemptIds.delete(payload.attemptId)
})

export function useQuizzes() {
  const isLoading = computed(() => state.isLoading)
  const error = computed(() => state.error)
  const activeAttempt = computed(() => state.activeAttempt)
  const lastResult = computed(() => state.lastResult)
  const history = computed(() => state.history)

  async function fetchModuleQuizzes(moduleId: string, locale: string): Promise<QuizSummaryDto[]> {
    state.isLoading = true
    state.error = null
    try {
      const data = await apiFetch<QuizSummaryDto[]>(`/modules/${moduleId}/quizzes`, { query: { locale } })
      state.moduleQuizzes[moduleId] = data
      return data
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Failed to load quizzes'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  function quizzesFor(moduleId: string): QuizSummaryDto[] {
    return state.moduleQuizzes[moduleId] ?? []
  }

  async function startAttempt(quizId: string, locale: string): Promise<AttemptDto> {
    state.isLoading = true
    state.error = null
    state.lastResult = null
    try {
      const attempt = await apiFetch<AttemptDto>(`/quizzes/${quizId}/attempts`, {
        method: 'POST',
        query: { locale },
      })
      state.activeAttempt = attempt
      return attempt
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Unable to start the quiz'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  /** Returns the scored result, or 'queued' if offline (answers saved locally; graded once reconnected). */
  async function submitAttempt(
    attemptId: string,
    request: SubmitAttemptRequest,
    locale: string,
  ): Promise<AttemptResultDto | 'queued'> {
    state.isLoading = true
    state.error = null
    try {
      const result = await apiFetch<AttemptResultDto>(`/attempts/${attemptId}/submit`, {
        method: 'POST',
        body: request,
        query: { locale },
      })
      state.lastResult = result
      state.activeAttempt = null
      return result
    } catch (err) {
      if (err instanceof TypeError) {
        const payload: QueuedSubmission = { attemptId, request, locale }
        await enqueue('submitAttempt', `attempt:${attemptId}`, payload)
        state.queuedAttemptIds.add(attemptId)
        state.activeAttempt = null
        return 'queued'
      }
      state.error = err instanceof ApiError ? err.message : 'Unable to submit the quiz'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  function isAttemptQueued(attemptId: string): boolean {
    return state.queuedAttemptIds.has(attemptId)
  }

  async function fetchHistory(quizId: string): Promise<AttemptHistoryItemDto[]> {
    try {
      const data = await apiFetch<AttemptHistoryItemDto[]>(`/quizzes/${quizId}/attempts`)
      state.history = data
      return data
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Failed to load attempt history'
      throw err
    }
  }

  function clearError(): void {
    state.error = null
  }

  return {
    isLoading,
    error,
    activeAttempt,
    lastResult,
    history,
    fetchModuleQuizzes,
    quizzesFor,
    startAttempt,
    submitAttempt,
    isAttemptQueued,
    fetchHistory,
    clearError,
  }
}
