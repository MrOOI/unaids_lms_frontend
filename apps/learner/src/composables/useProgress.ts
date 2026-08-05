/**
 * Enrollment + lesson/course progress. Keeps a per-course cache so the
 * dashboard can render every enrolled course's progress bar without
 * re-fetching on every navigation.
 */
import { computed, reactive } from 'vue'
import { apiFetch, ApiError } from '../lib/http'
import { enqueue, registerOutboxHandler } from '../lib/offlineOutbox'
import type { CourseProgressDto, EnrollmentDto, LessonProgressDto } from '../lib/api-types'

export type SaveStatus = 'saving' | 'saved' | 'queued' | 'error'

interface ProgressState {
  byCourseId: Record<string, CourseProgressDto>
  isLoading: boolean
  error: string | null
  saveStatus: Record<string, SaveStatus>
}

const state = reactive<ProgressState>({
  byCourseId: {},
  isLoading: false,
  error: null,
  saveStatus: {},
})

/**
 * Registered once at module load (see main.ts) so a queued completion can
 * replay after a page reload, not just within the tab that queued it.
 */
registerOutboxHandler('completeLesson', async (payload: { lessonId: string }) => {
  await apiFetch<LessonProgressDto>(`/lessons/${payload.lessonId}/complete`, { method: 'POST' })
  state.saveStatus[payload.lessonId] = 'saved'
})

export function useProgress() {
  const isLoading = computed(() => state.isLoading)
  const error = computed(() => state.error)
  const byCourseId = computed(() => state.byCourseId)

  async function enroll(courseId: string): Promise<EnrollmentDto | null> {
    state.isLoading = true
    state.error = null
    try {
      const result = await apiFetch<EnrollmentDto>(`/courses/${courseId}/enroll`, { method: 'POST' })
      await getCourseProgress(courseId)
      return result
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Enrollment failed'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  /** Returns the saved progress, or 'queued' if offline (saved locally, will sync automatically). */
  async function completeLesson(lessonId: string): Promise<LessonProgressDto | 'queued'> {
    state.error = null
    state.saveStatus[lessonId] = 'saving'
    try {
      const result = await apiFetch<LessonProgressDto>(`/lessons/${lessonId}/complete`, { method: 'POST' })
      state.saveStatus[lessonId] = 'saved'
      return result
    } catch (err) {
      if (err instanceof TypeError) {
        await enqueue('completeLesson', `lesson:${lessonId}`, { lessonId })
        state.saveStatus[lessonId] = 'queued'
        return 'queued'
      }
      state.saveStatus[lessonId] = 'error'
      state.error = err instanceof ApiError ? err.message : 'Failed to save progress'
      throw err
    }
  }

  function saveStatusFor(lessonId: string): SaveStatus | undefined {
    return state.saveStatus[lessonId]
  }

  async function getCourseProgress(courseId: string): Promise<CourseProgressDto | null> {
    try {
      const data = await apiFetch<CourseProgressDto>(`/courses/${courseId}/progress`)
      state.byCourseId[courseId] = data
      return data
    } catch (err) {
      // 404 = not enrolled yet; not an error state worth surfacing.
      if (err instanceof ApiError && err.status === 404) {
        return null
      }
      state.error = err instanceof ApiError ? err.message : 'Failed to load progress'
      return null
    }
  }

  function progressFor(courseId: string): CourseProgressDto | undefined {
    return state.byCourseId[courseId]
  }

  function clearError(): void {
    state.error = null
  }

  return {
    isLoading,
    error,
    byCourseId,
    enroll,
    completeLesson,
    getCourseProgress,
    progressFor,
    saveStatusFor,
    clearError,
  }
}
