<script setup lang="ts">
/**
 * Course detail — modules (color-coded per approved palette), their lessons
 * with completion state, and each module's quizzes.
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCourses } from '../composables/useCourses'
import { useProgress } from '../composables/useProgress'
import { useQuizzes } from '../composables/useQuizzes'
import type { QuizSummaryDto } from '../lib/api-types'
import Alert from '../components/ui/Alert.vue'
import Button from '../components/ui/Button.vue'
import Badge from '../components/ui/Badge.vue'
import Spinner from '../components/ui/Spinner.vue'
import { ChevronDownIcon, LockIcon } from '../icons'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { currentCourse, isLoading, error, fetchCourseDetail, clearError } = useCourses()
const { progressFor, getCourseProgress, enroll } = useProgress()
const { quizzesFor, fetchModuleQuizzes } = useQuizzes()

const courseSlug = computed(() => route.params.slug as string)
const expandedModules = ref<Set<string>>(new Set())
const isEnrolling = ref(false)
const quizzesLoaded = reactive<Set<string>>(new Set())

onMounted(load)

async function load(): Promise<void> {
  try {
    const course = await fetchCourseDetail(courseSlug.value, locale.value)
    await getCourseProgress(course.id)
  } catch {
    // surfaced via `error`
  }
}

const progress = computed(() => (currentCourse.value ? progressFor(currentCourse.value.id) : undefined))
const isEnrolled = computed(() => !!progress.value)

function lessonStatus(lessonId: string): 'Completed' | 'InProgress' | 'NotStarted' {
  return progress.value?.lessons.find((l) => l.lessonId === lessonId)?.status ?? 'NotStarted'
}

/** §6.3 sequential unlock — null ceiling means the course doesn't enforce it, nothing is locked. */
function isModuleLocked(moduleNumber: number): boolean {
  const ceiling = progress.value?.unlockedThroughModuleNumber
  return ceiling != null && moduleNumber > ceiling
}

async function toggleModule(moduleId: string, moduleNumber: number): Promise<void> {
  if (expandedModules.value.has(moduleId)) {
    expandedModules.value.delete(moduleId)
    return
  }
  expandedModules.value.add(moduleId)
  if (isModuleLocked(moduleNumber)) {
    return
  }
  if (!quizzesLoaded.has(moduleId)) {
    quizzesLoaded.add(moduleId)
    try {
      await fetchModuleQuizzes(moduleId, locale.value)
    } catch {
      // Non-fatal — module still shows its lessons.
    }
  }
}

function handleLessonClick(lessonId: string, moduleNumber: number): void {
  if (isModuleLocked(moduleNumber)) return
  router.push({ name: 'lesson', params: { slug: courseSlug.value, lessonId } })
}

function handleQuizClick(quiz: QuizSummaryDto): void {
  router.push({ name: 'quiz', params: { quizId: quiz.id } })
}

async function handleEnroll(): Promise<void> {
  if (!currentCourse.value) return
  isEnrolling.value = true
  try {
    await enroll(currentCourse.value.id)
  } catch {
    // surfaced via `error`
  } finally {
    isEnrolling.value = false
  }
}
</script>

<template>
  <div class="min-h-full">
    <div class="border-b border-gray-200 bg-white px-4 py-6 sm:px-8">
      <button
        type="button"
        class="mb-4 inline-block rounded-lg px-2 py-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
        @click="router.push({ name: 'home' })"
      >
        &larr; {{ t('common.back') }}
      </button>
      <h1 class="mb-2 text-xl font-bold text-gray-800 sm:text-2xl">{{ currentCourse?.title ?? '' }}</h1>
      <p v-if="currentCourse?.description" class="max-w-[60ch] text-sm text-gray-500">{{ currentCourse.description }}</p>
    </div>

    <Alert v-if="error" type="error" class="mx-4 mt-6 sm:mx-8" dismissible @dismiss="clearError">
      {{ error }}
    </Alert>

    <div v-if="isLoading && !currentCourse" class="flex min-h-[400px] items-center justify-center">
      <Spinner :label="t('common.loading')" />
    </div>

    <div v-else-if="currentCourse" class="mx-auto max-w-[900px] p-4 sm:p-8">
      <div
        v-if="!isEnrolled"
        class="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs sm:p-6"
      >
        <p class="m-0 font-semibold text-gray-800">{{ t('courseDetail.enrollPrompt') }}</p>
        <Button variant="primary" size="sm" :loading="isEnrolling" @click="handleEnroll">
          {{ t('dashboard.enroll') }}
        </Button>
      </div>
      <div v-else class="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs sm:p-6">
        <div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            class="h-full rounded-full bg-brand-500 transition-[width] duration-300"
            :style="{ width: `${progress?.percentComplete ?? 0}%` }"
          />
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="m-0 text-xs font-semibold text-gray-500">{{ t('dashboard.progress', { percent: progress?.percentComplete ?? 0 }) }}</p>
          <button
            type="button"
            class="text-xs font-semibold text-brand-600 hover:underline"
            @click="router.push({ name: 'course-feedback', params: { slug: courseSlug } })"
          >
            {{ t('feedback.giveFeedback') }}
          </button>
        </div>
      </div>

      <nav>
        <h2 class="mb-4 text-lg font-bold text-gray-800">{{ t('dashboard.courseMaterials') }}</h2>

        <div class="flex flex-col gap-3">
          <div
            v-for="module in currentCourse.modules"
            :key="module.id"
            class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs"
            :class="{ 'opacity-75': isModuleLocked(module.number) }"
            :data-module="module.themeNumber"
          >
            <button
              type="button"
              class="flex w-full items-center gap-3 border-t-4 px-4 py-4 text-left hover:bg-gray-50 sm:px-6"
              :style="{ borderTopColor: 'var(--module-primary)' }"
              :aria-expanded="expandedModules.has(module.id)"
              :aria-label="isModuleLocked(module.number) ? t('courseDetail.moduleLocked') : undefined"
              @click="toggleModule(module.id, module.number)"
            >
              <span
                class="hidden min-w-[90px] text-xs font-bold uppercase tracking-wide sm:inline"
                :style="{ color: 'var(--module-text)' }"
              >
                {{ t('module.label', { number: module.number }) }}
              </span>
              <span class="flex-1 font-semibold text-gray-800">{{ module.title }}</span>
              <LockIcon v-if="isModuleLocked(module.number)" class="size-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
              <ChevronDownIcon
                v-else
                class="size-5 flex-shrink-0 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': expandedModules.has(module.id) }"
              />
            </button>

            <div
              v-if="expandedModules.has(module.id)"
              class="flex flex-col gap-4 border-t border-gray-100 p-4"
              :style="{ background: 'var(--module-bg)' }"
            >
              <p v-if="isModuleLocked(module.number)" class="m-0 flex items-center gap-2 text-sm font-medium" :style="{ color: 'var(--module-text)' }">
                <LockIcon class="size-4 flex-shrink-0" aria-hidden="true" />
                {{ t('courseDetail.moduleLocked') }}
              </p>

              <template v-else>
                <p v-if="module.summary" class="m-0 text-sm" :style="{ color: 'var(--module-text)' }">{{ module.summary }}</p>

                <div class="flex flex-col gap-1">
                  <button
                    v-for="lesson in module.lessons"
                    :key="lesson.id"
                    type="button"
                    class="flex items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-800 hover:bg-black/5"
                    @click="handleLessonClick(lesson.id, module.number)"
                  >
                    <span
                      class="flex size-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      :class="lessonStatus(lesson.id) === 'Completed' ? 'bg-success-500' : ''"
                      :style="lessonStatus(lesson.id) === 'Completed' ? undefined : { background: 'var(--module-primary)' }"
                    >
                      {{ lessonStatus(lesson.id) === 'Completed' ? '✓' : lesson.sortOrder }}
                    </span>
                    <span class="flex flex-1 flex-col gap-0.5 text-sm">
                      {{ lesson.title }}
                      <span class="text-xs font-normal text-gray-500">{{ t('lesson.estimatedTime', { minutes: lesson.estimatedMinutes }) }}</span>
                    </span>
                  </button>
                </div>

                <div v-if="quizzesFor(module.id).length > 0" class="flex flex-col gap-1">
                  <h3 class="mb-1 mt-1 text-xs font-bold uppercase tracking-wide" :style="{ color: 'var(--module-text)' }">
                    {{ t('courseDetail.quizzes') }}
                  </h3>
                  <button
                    v-for="quiz in quizzesFor(module.id)"
                    :key="quiz.id"
                    type="button"
                    class="flex items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-black/5"
                    @click="handleQuizClick(quiz)"
                  >
                    <span class="flex-1 text-sm font-semibold text-gray-800">{{ quiz.title }}</span>
                    <Badge v-if="quiz.hasPassed" tone="success">{{ t('quiz.passed') }}</Badge>
                    <Badge v-else-if="quiz.kind === 'Final'" tone="info">{{ t('quiz.final') }}</Badge>
                    <Badge v-else tone="neutral">{{ t('quiz.formative') }}</Badge>
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </nav>
    </div>
  </div>
</template>
