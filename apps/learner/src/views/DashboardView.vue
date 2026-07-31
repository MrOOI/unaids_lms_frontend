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
  <div class="min-h-full">
    <div class="border-b border-gray-200 bg-white px-4 py-8 sm:px-8">
      <h1 class="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl">
        {{ t('dashboard.welcome', { name: user?.fullName || '' }) }}
      </h1>
      <p class="text-sm text-gray-500">{{ t('dashboard.subtitle') }}</p>
    </div>

    <div class="mx-auto max-w-(--breakpoint-2xl)">
      <Alert v-if="error" type="error" class="mx-4 mt-6 sm:mx-8" dismissible @dismiss="clearError">
        {{ error }}
      </Alert>

      <div v-if="isLoading && courses.length === 0" class="flex min-h-[400px] items-center justify-center">
        <Spinner :label="t('common.loading')" />
      </div>

      <EmptyState v-else-if="courses.length === 0" class="m-4 sm:m-8" :title="t('dashboard.noCourses')" icon="📚" />

      <div v-else class="p-4 sm:p-8">
        <div class="mb-8">
          <h2 class="mb-2 text-xl font-bold text-gray-800">{{ t('dashboard.availableCourses') }}</h2>
          <p class="text-sm text-gray-500">{{ t('dashboard.courseCount', { count: courses.length }) }}</p>
        </div>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
          <article
            v-for="(course, index) in courses"
            :key="course.id"
            :data-module="index % 6"
            class="flex flex-col gap-4 rounded-2xl border border-t-4 border-gray-200 bg-white p-6 shadow-theme-xs transition hover:-translate-y-0.5 hover:shadow-theme-md"
            :style="{ borderTopColor: 'var(--module-primary, var(--module-1))' }"
          >
            <span
              class="text-xs font-semibold uppercase tracking-wide"
              :style="{ color: 'var(--module-text, var(--module-1-accessible))' }"
            >
              {{ t('dashboard.modules', { count: course.moduleCount }) }}
            </span>

            <div class="flex-1">
              <h3 class="mb-2 text-lg font-bold leading-snug text-gray-800">{{ course.title }}</h3>
              <p class="text-sm leading-relaxed text-gray-500">{{ course.description }}</p>
            </div>

            <div v-if="progressFor(course.id)" class="flex flex-col gap-2">
              <div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  class="h-full rounded-full transition-[width] duration-300"
                  :style="{
                    width: `${progressFor(course.id)?.percentComplete ?? 0}%`,
                    background: 'var(--module-primary, var(--module-1))',
                  }"
                />
              </div>
              <p class="text-xs font-semibold text-gray-500">
                {{ t('dashboard.progress', { percent: progressFor(course.id)?.percentComplete ?? 0 }) }}
              </p>
            </div>

            <div class="mt-auto flex gap-3">
              <Button
                v-if="progressFor(course.id)"
                type="button"
                variant="primary"
                size="sm"
                class="flex-1"
                @click="goToCourse(course.slug)"
              >
                {{ t('dashboard.continue') }}
              </Button>

              <Button
                v-else
                type="button"
                variant="secondary"
                size="sm"
                class="flex-1"
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
