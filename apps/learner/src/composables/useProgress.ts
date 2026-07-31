/**
 * Enrollment + lesson/course progress. Keeps a per-course cache so the
 * dashboard can render every enrolled course's progress bar without
 * re-fetching on every navigation.
 */
import { computed, reactive } from 'vue'
import { apiFetch, ApiError } from '../lib/http'
import type { CourseProgressDto, EnrollmentDto, LessonProgressDto } from '../lib/api-types'

interface ProgressState {
  byCourseId: Record<string, CourseProgressDto>
  isLoading: boolean
  error: string | null
}

const state = reactive<ProgressState>({
  byCourseId: {},
  isLoading: false,
  error: null,
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

  async function completeLesson(lessonId: string): Promise<LessonProgressDto | null> {
    state.error = null
    try {
      return await apiFetch<LessonProgressDto>(`/lessons/${lessonId}/complete`, { method: 'POST' })
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Failed to save progress'
      throw err
    }
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
    clearError,
  }
}
