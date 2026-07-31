/**
 * CourseAdmin/SysAdmin quiz + question authoring. Mirrors IQuizAdminService
 * (AdminQuizController, /api/admin/*) plus the read-only additions
 * (GetModuleQuizzesForAdminAsync / GetQuizForAdminAsync) that expose drafts
 * and SolutionJson for editing.
 */
import { computed, reactive } from 'vue'
import { apiFetch, ApiError } from '../lib/http'
import type {
  AdminMutationResponse,
  AdminQuizDetailDto,
  AdminQuizListItemDto,
  QuestionRequest,
  QuestionTranslationRequest,
  QuizRequest,
  QuizTranslationRequest,
} from '../lib/api-types'

interface AdminQuizState {
  isLoading: boolean
  error: string | null
}

const state = reactive<AdminQuizState>({ isLoading: false, error: null })

export function useAdminQuiz() {
  const isLoading = computed(() => state.isLoading)
  const error = computed(() => state.error)

  async function run<T>(fn: () => Promise<T>): Promise<T> {
    state.isLoading = true
    state.error = null
    try {
      return await fn()
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Request failed'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  const listQuizzes = (moduleId: string) =>
    run(() => apiFetch<AdminQuizListItemDto[]>(`/admin/modules/${moduleId}/quizzes`))

  const getQuiz = (quizId: string) => run(() => apiFetch<AdminQuizDetailDto>(`/admin/quizzes/${quizId}`))

  const addQuiz = (moduleId: string, request: QuizRequest) =>
    run(() => apiFetch<AdminMutationResponse>(`/admin/modules/${moduleId}/quizzes`, { method: 'POST', body: request }))

  const updateQuiz = (quizId: string, request: QuizRequest) =>
    run(() => apiFetch<AdminMutationResponse>(`/admin/quizzes/${quizId}`, { method: 'PUT', body: request }))

  const upsertQuizTranslation = (quizId: string, locale: string, request: QuizTranslationRequest) =>
    run(() =>
      apiFetch<AdminMutationResponse>(`/admin/quizzes/${quizId}/translations/${locale}`, {
        method: 'PUT',
        body: request,
      }),
    )

  const addQuestion = (quizId: string, request: QuestionRequest) =>
    run(() => apiFetch<AdminMutationResponse>(`/admin/quizzes/${quizId}/questions`, { method: 'POST', body: request }))

  const updateQuestion = (questionId: string, request: QuestionRequest) =>
    run(() => apiFetch<AdminMutationResponse>(`/admin/questions/${questionId}`, { method: 'PUT', body: request }))

  const upsertQuestionTranslation = (questionId: string, locale: string, request: QuestionTranslationRequest) =>
    run(() =>
      apiFetch<AdminMutationResponse>(`/admin/questions/${questionId}/translations/${locale}`, {
        method: 'PUT',
        body: request,
      }),
    )

  const deleteQuestion = (questionId: string) =>
    run(() => apiFetch<AdminMutationResponse>(`/admin/questions/${questionId}`, { method: 'DELETE' }))

  function clearError(): void {
    state.error = null
  }

  return {
    isLoading,
    error,
    clearError,
    listQuizzes,
    getQuiz,
    addQuiz,
    updateQuiz,
    upsertQuizTranslation,
    addQuestion,
    updateQuestion,
    upsertQuestionTranslation,
    deleteQuestion,
  }
}
