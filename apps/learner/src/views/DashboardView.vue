<script setup lang="ts">
/**
 * Dashboard — published course catalog with per-course enrollment/progress.
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../composables/useAuth'
import { useCourses } from '../composables/useCourses'
import { useProgress } from '../composables/useProgress'
import Button from '../components/ui/Button.vue'
import Alert from '../components/ui/Alert.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import Spinner from '../components/ui/Spinner.vue'

const router = useRouter()
const { t, locale } = useI18n()
const { user } = useAuth()
const { courses, isLoading, error, fetchCourses, clearError } = useCourses()
const { progressFor, getCourseProgress, enroll } = useProgress()

const enrollingCourses = ref<Set<string>>(new Set())

onMounted(load)

async function load(): Promise<void> {
  try {
    const list = await fetchCourses(locale.value)
    await Promise.all(list.map((c) => getCourseProgress(c.id)))
  } catch {
    // surfaced via `error`
  }
}

async function handleEnroll(courseId: string): Promise<void> {
  clearError()
  enrollingCourses.value.add(courseId)
  try {
    await enroll(courseId)
  } catch {
    // surfaced via `error`
  } finally {
    enrollingCourses.value.delete(courseId)
  }
}

function goToCourse(slug: string): void {
  router.push({ name: 'course-detail', params: { slug } })
}
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <div class="dashboard-welcome">
        <h1>{{ t('dashboard.welcome', { name: user?.fullName || '' }) }}</h1>
        <p>{{ t('dashboard.subtitle') }}</p>
      </div>
    </div>

    <div class="dashboard-body">
      <Alert v-if="error" type="error" class="dashboard-alert" dismissible @dismiss="clearError">
        {{ error }}
      </Alert>

      <div v-if="isLoading && courses.length === 0" class="dashboard-loading">
        <Spinner :label="t('common.loading')" />
      </div>

      <EmptyState v-else-if="courses.length === 0" :title="t('dashboard.noCourses')" icon="📚" />

      <div v-else class="courses-container">
        <div class="courses-header">
          <h2>{{ t('dashboard.availableCourses') }}</h2>
          <p class="courses-count">{{ t('dashboard.courseCount', { count: courses.length }) }}</p>
        </div>

        <div class="courses-grid">
          <article
            v-for="(course, index) in courses"
            :key="course.id"
            :data-module="index % 6"
            class="course-card"
          >
            <div class="course-card__header">
              <span class="course-card__meta">
                {{ t('dashboard.modules', { count: course.moduleCount }) }}
              </span>
            </div>

            <div class="course-card__body">
              <h3 class="course-card__title">{{ course.title }}</h3>
              <p class="course-card__description">{{ course.description }}</p>
            </div>

            <div v-if="progressFor(course.id)" class="course-card__progress">
              <div class="progress-bar">
                <div
                  class="progress-bar__fill"
                  :style="{ width: `${progressFor(course.id)?.percentComplete ?? 0}%` }"
                />
              </div>
              <p class="progress-text">
                {{ t('dashboard.progress', { percent: progressFor(course.id)?.percentComplete ?? 0 }) }}
              </p>
            </div>

            <div class="course-card__actions">
              <Button
                v-if="progressFor(course.id)"
                type="button"
                variant="primary"
                size="sm"
                @click="goToCourse(course.slug)"
              >
                {{ t('dashboard.continue') }}
              </Button>

              <Button
                v-else
                type="button"
                variant="secondary"
                size="sm"
                :loading="enrollingCourses.has(course.id)"
                @click="handleEnroll(course.id)"
              >
                {{ t('dashboard.enroll') }}
              </Button>
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100%;
}

.dashboard-header {
  padding: var(--space-8);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.dashboard-welcome h1 {
  margin: 0 0 var(--space-2) 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text);
}

.dashboard-welcome p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.dashboard-body {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-alert {
  margin: var(--space-6) var(--space-8) 0;
}

.dashboard-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.courses-container {
  padding: var(--space-8);
}

.courses-header {
  margin-bottom: var(--space-8);
}

.courses-header h2 {
  margin: 0 0 var(--space-2) 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.courses-count {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-6);
}

.course-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: 4px solid var(--module-primary, var(--module-1));
  border-radius: var(--radius-lg);
  transition: all 0.2s ease;
}

.course-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.course-card__meta {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--module-text, var(--module-1-accessible));
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.course-card__body {
  flex: 1;
}

.course-card__title {
  margin: 0 0 var(--space-2) 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.4;
}

.course-card__description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.course-card__progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
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
  background: var(--module-primary, var(--module-1));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

.course-card__actions {
  display: flex;
  gap: var(--space-3);
  margin-top: auto;
}

.course-card__actions :deep(button) {
  flex: 1;
  min-width: 100px;
}

@media (max-width: 640px) {
  .dashboard-header {
    padding: var(--space-4);
  }

  .dashboard-welcome h1 {
    font-size: 1.5rem;
  }

  .courses-container {
    padding: var(--space-4);
  }

  .courses-grid {
    grid-template-columns: 1fr;
  }

  .course-card {
    padding: var(--space-4);
  }
}
</style>
