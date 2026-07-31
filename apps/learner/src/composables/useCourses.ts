/**
 * Course catalog composable — published courses, course detail (modules +
 * lessons), and single-lesson detail (content blocks). Mirrors
 * ICourseCatalogService exactly; all locale resolution happens server-side.
 */

import { computed, reactive } from 'vue'
import { apiFetch, ApiError } from '../lib/http'
import type { CourseDetailDto, CourseSummaryDto, LessonDetailDto } from '../lib/api-types'

interface CoursesState {
  courses: CourseSummaryDto[]
  currentCourse: CourseDetailDto | null
  currentLesson: LessonDetailDto | null
  isLoading: boolean
  error: string | null
}

const state = reactive<CoursesState>({
  courses: [],
  currentCourse: null,
  currentLesson: null,
  isLoading: false,
  error: null,
})

export function useCourses() {
  const isLoading = computed(() => state.isLoading)
  const error = computed(() => state.error)
  const courses = computed(() => state.courses)
  const currentCourse = computed(() => state.currentCourse)
  const currentLesson = computed(() => state.currentLesson)

  async function fetchCourses(locale: string): Promise<CourseSummaryDto[]> {
    state.isLoading = true
    state.error = null
    try {
      const data = await apiFetch<CourseSummaryDto[]>('/courses', { query: { locale } })
      state.courses = data
      return data
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Failed to load courses'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  async function fetchCourseDetail(slug: string, locale: string): Promise<CourseDetailDto> {
    state.isLoading = true
    state.error = null
    try {
      const data = await apiFetch<CourseDetailDto>(`/courses/${encodeURIComponent(slug)}`, {
        query: { locale },
      })
      state.currentCourse = data
      return data
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Failed to load course'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  async function fetchLesson(lessonId: string, locale: string): Promise<LessonDetailDto> {
    state.isLoading = true
    state.error = null
    try {
      const data = await apiFetch<LessonDetailDto>(`/lessons/${encodeURIComponent(lessonId)}`, {
        query: { locale },
      })
      state.currentLesson = data
      return data
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Failed to load lesson'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  function clearError(): void {
    state.error = null
  }

  return {
    isLoading,
    error,
    courses,
    currentCourse,
    currentLesson,
    fetchCourses,
    fetchCourseDetail,
    fetchLesson,
    clearError,
  }
}
