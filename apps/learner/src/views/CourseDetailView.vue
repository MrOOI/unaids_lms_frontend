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

async function toggleModule(moduleId: string): Promise<void> {
  if (expandedModules.value.has(moduleId)) {
    expandedModules.value.delete(moduleId)
    return
  }
  expandedModules.value.add(moduleId)
  if (!quizzesLoaded.has(moduleId)) {
    quizzesLoaded.add(moduleId)
    try {
      await fetchModuleQuizzes(moduleId, locale.value)
    } catch {
      // Non-fatal — module still shows its lessons.
    }
  }
}

function handleLessonClick(lessonId: string): void {
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
  <div class="course-detail">
    <div class="course-detail-header">
      <button type="button" class="back-button" @click="router.push({ name: 'home' })">
        ← {{ t('common.back') }}
      </button>
      <h1>{{ currentCourse?.title ?? '' }}</h1>
      <p v-if="currentCourse?.description" class="course-description">{{ currentCourse.description }}</p>
    </div>

    <Alert v-if="error" type="error" class="detail-alert" dismissible @dismiss="clearError">
      {{ error }}
    </Alert>

    <div v-if="isLoading && !currentCourse" class="detail-loading">
      <Spinner :label="t('common.loading')" />
    </div>

    <div v-else-if="currentCourse" class="course-content">
      <div v-if="!isEnrolled" class="enroll-banner">
        <p>{{ t('courseDetail.enrollPrompt') }}</p>
        <Button variant="primary" size="sm" :loading="isEnrolling" @click="handleEnroll">
          {{ t('dashboard.enroll') }}
        </Button>
      </div>
      <div v-else class="progress-banner">
        <div class="progress-bar">
          <div class="progress-bar__fill" :style="{ width: `${progress?.percentComplete ?? 0}%` }" />
        </div>
        <p>{{ t('dashboard.progress', { percent: progress?.percentComplete ?? 0 }) }}</p>
      </div>

      <nav class="modules-nav">
        <h2>{{ t('dashboard.courseMaterials') }}</h2>

        <div class="modules-list">
          <div
            v-for="module in currentCourse.modules"
            :key="module.id"
            class="module-item"
            :data-module="module.themeNumber"
          >
            <button
              type="button"
              class="module-header"
              :aria-expanded="expandedModules.has(module.id)"
              @click="toggleModule(module.id)"
            >
              <span class="module-badge">{{ t('module.label', { number: module.number }) }}</span>
              <span class="module-title">{{ module.title }}</span>
              <span
                class="module-chevron"
                :class="{ 'module-chevron--open': expandedModules.has(module.id) }"
                aria-hidden="true"
              >
                ▼
              </span>
            </button>

            <div v-if="expandedModules.has(module.id)" class="module-panel">
              <p v-if="module.summary" class="module-summary">{{ module.summary }}</p>

              <div class="lessons-list">
                <button
                  v-for="lesson in module.lessons"
                  :key="lesson.id"
                  type="button"
                  class="lesson-item"
                  @click="handleLessonClick(lesson.id)"
                >
                  <span
                    class="lesson-check"
                    :class="{ 'lesson-check--done': lessonStatus(lesson.id) === 'Completed' }"
                    aria-hidden="true"
                  >
                    {{ lessonStatus(lesson.id) === 'Completed' ? '✓' : lesson.sortOrder }}
                  </span>
                  <span class="lesson-text">
                    {{ lesson.title }}
                    <span class="lesson-duration">{{ t('lesson.estimatedTime', { minutes: lesson.estimatedMinutes }) }}</span>
                  </span>
                </button>
              </div>

              <div v-if="quizzesFor(module.id).length > 0" class="quizzes-list">
                <h3>{{ t('courseDetail.quizzes') }}</h3>
                <button
                  v-for="quiz in quizzesFor(module.id)"
                  :key="quiz.id"
                  type="button"
                  class="quiz-item"
                  @click="handleQuizClick(quiz)"
                >
                  <span class="quiz-item__title">{{ quiz.title }}</span>
                  <Badge v-if="quiz.hasPassed" tone="success">{{ t('quiz.passed') }}</Badge>
                  <Badge v-else-if="quiz.kind === 'Final'" tone="info">{{ t('quiz.final') }}</Badge>
                  <Badge v-else tone="neutral">{{ t('quiz.formative') }}</Badge>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.course-detail {
  min-height: 100%;
}

.course-detail-header {
  padding: var(--space-6) var(--space-8);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.back-button {
  display: inline-block;
  margin-bottom: var(--space-4);
  padding: var(--space-2) var(--space-4);
  border: none;
  background: transparent;
  color: var(--module-1);
  font-weight: 600;
  cursor: pointer;
}

.back-button:hover {
  color: var(--module-1-accessible);
}

.course-detail-header h1 {
  margin: 0 0 var(--space-2) 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
}

.course-description {
  margin: 0;
  color: var(--color-text-muted);
  max-width: 60ch;
}

.detail-alert {
  margin: var(--space-6) var(--space-8) 0;
}

.detail-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.course-content {
  padding: var(--space-8);
  max-width: 900px;
  margin: 0 auto;
}

.enroll-banner,
.progress-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}

.enroll-banner p {
  margin: 0;
  color: var(--color-text);
  font-weight: 600;
}

.progress-banner {
  flex-direction: column;
  align-items: stretch;
}

.progress-banner p {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--color-surface-alt);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar__fill {
  height: 100%;
  background: var(--module-1);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.modules-nav h2 {
  margin: 0 0 var(--space-4) 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
}

.modules-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.module-item {
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.module-header {
  display: flex;
  align-items: center;
  width: 100%;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  border-top: 4px solid var(--module-primary);
}

.module-header:hover {
  background: var(--color-surface-alt);
}

.module-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--module-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 90px;
}

.module-title {
  flex: 1;
  font-weight: 600;
  color: var(--color-text);
}

.module-chevron {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  transition: transform 0.2s;
}

.module-chevron--open {
  transform: rotate(180deg);
}

.module-panel {
  border-top: 1px solid var(--color-border);
  background: var(--module-bg);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.module-summary {
  margin: 0;
  font-size: 0.875rem;
  color: var(--module-text);
}

.lessons-list,
.quizzes-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.quizzes-list h3 {
  margin: var(--space-2) 0 0 0;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--module-text);
}

.lesson-item,
.quiz-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  text-align: left;
  color: var(--color-text);
}

.lesson-item:hover,
.quiz-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.lesson-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--module-primary);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.lesson-check--done {
  background: var(--color-success);
}

.lesson-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: 0.875rem;
}

.lesson-duration {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: normal;
}

.quiz-item__title {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 600;
}

@media (max-width: 640px) {
  .course-detail-header {
    padding: var(--space-4);
  }

  .course-detail-header h1 {
    font-size: 1.25rem;
  }

  .course-content {
    padding: var(--space-4);
  }

  .module-header {
    padding: var(--space-3) var(--space-4);
  }

  .module-badge {
    display: none;
  }
}
</style>
