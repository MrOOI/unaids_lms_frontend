/** SysAdmin/Observer reporting: course metrics + learner Excel export. */
import { computed, reactive } from 'vue'
import { apiFetch, apiFetchBlob, triggerBlobDownload, ApiError } from '../lib/http'
import type { CourseMetricsDto, FeedbackSummaryDto } from '../lib/api-types'

interface ReportingState {
  isLoading: boolean
  error: string | null
}

const state = reactive<ReportingState>({ isLoading: false, error: null })

export function useReporting() {
  const isLoading = computed(() => state.isLoading)
  const error = computed(() => state.error)

  async function getCourseMetrics(courseId: string): Promise<CourseMetricsDto[]> {
    state.isLoading = true
    state.error = null
    try {
      return await apiFetch<CourseMetricsDto[]>(`/reporting/courses/${courseId}/metrics`)
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Failed to load metrics'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  async function getFeedbackSummary(courseId: string): Promise<FeedbackSummaryDto> {
    state.isLoading = true
    state.error = null
    try {
      return await apiFetch<FeedbackSummaryDto>(`/reporting/courses/${courseId}/feedback`)
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Failed to load feedback'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  async function exportLearners(courseId: string, courseName: string): Promise<void> {
    state.isLoading = true
    state.error = null
    try {
      const blob = await apiFetchBlob(`/reporting/courses/${courseId}/learners/export`)
      triggerBlobDownload(blob, `${courseName || 'learners'}.xlsx`)
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Export failed'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  async function exportLearnersCsv(courseId: string, courseName: string): Promise<void> {
    state.isLoading = true
    state.error = null
    try {
      const blob = await apiFetchBlob(`/reporting/courses/${courseId}/learners/export.csv`)
      triggerBlobDownload(blob, `${courseName || 'learners'}.csv`)
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Export failed'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  async function exportSummaryPdf(courseId: string, courseName: string): Promise<void> {
    state.isLoading = true
    state.error = null
    try {
      const blob = await apiFetchBlob(`/reporting/courses/${courseId}/summary.pdf`)
      triggerBlobDownload(blob, `${courseName || 'course-summary'}.pdf`)
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Export failed'
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
    getCourseMetrics,
    getFeedbackSummary,
    exportLearners,
    exportLearnersCsv,
    exportSummaryPdf,
    clearError,
  }
}
