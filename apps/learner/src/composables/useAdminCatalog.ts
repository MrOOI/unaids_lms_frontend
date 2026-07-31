/**
 * CourseAdmin/SysAdmin content authoring: courses → modules → lessons →
 * content blocks, plus their per-locale translations. Mirrors
 * ICourseAdminService (AdminCatalogController, /api/admin/*).
 *
 * These endpoints don't have "get one" reads beyond the public catalog
 * (which only returns published content) — so the admin views reuse
 * useCourses' fetchCourseDetail/fetchLesson against the *default* locale to
 * see structure, understanding that unpublished items won't show there
 * either. AdminCatalogController only exposes mutations; this composable
 * wraps every one of them 1:1.
 */
import { computed, reactive } from 'vue'
import { apiFetch, ApiError } from '../lib/http'
import type {
  AdminCourseDetailDto,
  AdminCourseListItemDto,
  AdminLessonDetailDto,
  AdminMutationResponse,
  BlockTranslationRequest,
  ContentBlockRequest,
  CourseTranslationRequest,
  CreateCourseRequest,
  LessonRequest,
  LessonTranslationRequest,
  ModuleRequest,
  ModuleTranslationRequest,
  UpdateCourseRequest,
} from '../lib/api-types'

interface AdminCatalogState {
  isLoading: boolean
  error: string | null
}

const state = reactive<AdminCatalogState>({ isLoading: false, error: null })

export function useAdminCatalog() {
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

  const listCourses = () => run(() => apiFetch<AdminCourseListItemDto[]>('/admin/courses'))

  const getCourse = (courseId: string) =>
    run(() => apiFetch<AdminCourseDetailDto>(`/admin/courses/${courseId}`))

  const getLesson = (lessonId: string) =>
    run(() => apiFetch<AdminLessonDetailDto>(`/admin/lessons/${lessonId}`))

  const createCourse = (request: CreateCourseRequest) =>
    run(() => apiFetch<AdminMutationResponse>('/admin/courses', { method: 'POST', body: request }))

  const updateCourse = (courseId: string, request: UpdateCourseRequest) =>
    run(() => apiFetch<AdminMutationResponse>(`/admin/courses/${courseId}`, { method: 'PUT', body: request }))

  const upsertCourseTranslation = (courseId: string, locale: string, request: CourseTranslationRequest) =>
    run(() =>
      apiFetch<AdminMutationResponse>(`/admin/courses/${courseId}/translations/${locale}`, {
        method: 'PUT',
        body: request,
      }),
    )

  const addModule = (courseId: string, request: ModuleRequest) =>
    run(() => apiFetch<AdminMutationResponse>(`/admin/courses/${courseId}/modules`, { method: 'POST', body: request }))

  const updateModule = (moduleId: string, request: ModuleRequest) =>
    run(() => apiFetch<AdminMutationResponse>(`/admin/modules/${moduleId}`, { method: 'PUT', body: request }))

  const upsertModuleTranslation = (moduleId: string, locale: string, request: ModuleTranslationRequest) =>
    run(() =>
      apiFetch<AdminMutationResponse>(`/admin/modules/${moduleId}/translations/${locale}`, {
        method: 'PUT',
        body: request,
      }),
    )

  const addLesson = (moduleId: string, request: LessonRequest) =>
    run(() => apiFetch<AdminMutationResponse>(`/admin/modules/${moduleId}/lessons`, { method: 'POST', body: request }))

  const updateLesson = (lessonId: string, request: LessonRequest) =>
    run(() => apiFetch<AdminMutationResponse>(`/admin/lessons/${lessonId}`, { method: 'PUT', body: request }))

  const upsertLessonTranslation = (lessonId: string, locale: string, request: LessonTranslationRequest) =>
    run(() =>
      apiFetch<AdminMutationResponse>(`/admin/lessons/${lessonId}/translations/${locale}`, {
        method: 'PUT',
        body: request,
      }),
    )

  const addBlock = (lessonId: string, request: ContentBlockRequest) =>
    run(() => apiFetch<AdminMutationResponse>(`/admin/lessons/${lessonId}/blocks`, { method: 'POST', body: request }))

  const upsertBlockTranslation = (blockId: string, locale: string, request: BlockTranslationRequest) =>
    run(() =>
      apiFetch<AdminMutationResponse>(`/admin/blocks/${blockId}/translations/${locale}`, {
        method: 'PUT',
        body: request,
      }),
    )

  const deleteBlock = (blockId: string) =>
    run(() => apiFetch<void>(`/admin/blocks/${blockId}`, { method: 'DELETE' }))

  function clearError(): void {
    state.error = null
  }

  return {
    isLoading,
    error,
    clearError,
    listCourses,
    getCourse,
    getLesson,
    createCourse,
    updateCourse,
    upsertCourseTranslation,
    addModule,
    updateModule,
    upsertModuleTranslation,
    addLesson,
    updateLesson,
    upsertLessonTranslation,
    addBlock,
    upsertBlockTranslation,
    deleteBlock,
  }
}
