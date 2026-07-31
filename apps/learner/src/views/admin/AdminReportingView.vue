<script setup lang="ts">
/** SysAdmin/Observer: per-course completion metrics + learner Excel export. */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminCatalog } from '../../composables/useAdminCatalog'
import { useReporting } from '../../composables/useReporting'
import { useToast } from '../../composables/useToast'
import type { AdminCourseListItemDto, CourseMetricsDto } from '../../lib/api-types'
import Card from '../../components/ui/Card.vue'
import Button from '../../components/ui/Button.vue'
import Select from '../../components/ui/Select.vue'
import Spinner from '../../components/ui/Spinner.vue'
import EmptyState from '../../components/ui/EmptyState.vue'

const { t, locale } = useI18n()
const catalog = useAdminCatalog()
const reporting = useReporting()
const toast = useToast()

const courses = ref<AdminCourseListItemDto[]>([])
const selectedCourseId = ref('')
const metrics = ref<CourseMetricsDto[]>([])
const isFetching = ref(true)
const isExporting = ref(false)

onMounted(async () => {
  try {
    courses.value = await catalog.listCourses()
    if (courses.value.length > 0) {
      selectedCourseId.value = courses.value[0].id
      await loadMetrics()
    }
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.loadFailed'))
  } finally {
    isFetching.value = false
  }
})

const selectedCourseName = computed(() => {
  const course = courses.value.find((c) => c.id === selectedCourseId.value)
  return course?.translations[locale.value]?.title ?? course?.slug ?? ''
})

async function loadMetrics(): Promise<void> {
  if (!selectedCourseId.value) return
  try {
    metrics.value = await reporting.getCourseMetrics(selectedCourseId.value)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.loadFailed'))
  }
}

async function handleExport(): Promise<void> {
  isExporting.value = true
  try {
    await reporting.exportLearners(selectedCourseId.value, selectedCourseName.value)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">{{ t('admin.reporting.title') }}</h1>
    </div>

    <div v-if="isFetching" class="flex justify-center py-8"><Spinner :label="t('common.loading')" /></div>

    <EmptyState v-else-if="courses.length === 0" icon="📊" :title="t('admin.reporting.noCourses')" />

    <template v-else>
      <Card>
        <div class="flex flex-wrap items-center gap-4">
          <Select
            v-model="selectedCourseId"
            wrapper-class="max-w-xs"
            :options="courses.map((c) => ({ value: c.id, label: c.translations[locale]?.title ?? c.slug }))"
            @update:model-value="loadMetrics"
          />
          <Button variant="secondary" :loading="isExporting" @click="handleExport">
            {{ t('admin.reporting.exportLearners') }}
          </Button>
        </div>
      </Card>

      <div v-if="metrics.length > 0" class="mt-6">
        <Card v-for="m in metrics" :key="m.courseId" :title="selectedCourseName">
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div class="flex flex-col items-center gap-1 rounded-2xl border border-gray-100 bg-gray-50 p-5 text-center">
              <span class="text-title-sm font-extrabold text-brand-600">{{ m.totalEnrolled }}</span>
              <span class="text-xs font-medium uppercase tracking-wide text-gray-500">{{ t('admin.reporting.totalEnrolled') }}</span>
            </div>
            <div class="flex flex-col items-center gap-1 rounded-2xl border border-gray-100 bg-gray-50 p-5 text-center">
              <span class="text-title-sm font-extrabold text-brand-600">{{ m.completed }}</span>
              <span class="text-xs font-medium uppercase tracking-wide text-gray-500">{{ t('admin.reporting.completed') }}</span>
            </div>
            <div class="flex flex-col items-center gap-1 rounded-2xl border border-gray-100 bg-gray-50 p-5 text-center">
              <span class="text-title-sm font-extrabold text-brand-600">{{ m.completionPercent }}%</span>
              <span class="text-xs font-medium uppercase tracking-wide text-gray-500">{{ t('admin.reporting.completionRate') }}</span>
            </div>
            <div class="flex flex-col items-center gap-1 rounded-2xl border border-gray-100 bg-gray-50 p-5 text-center">
              <span class="text-title-sm font-extrabold text-brand-600">{{ m.passedFinalQuiz }}</span>
              <span class="text-xs font-medium uppercase tracking-wide text-gray-500">{{ t('admin.reporting.passedFinal') }}</span>
            </div>
          </div>
        </Card>
      </div>
      <EmptyState v-else icon="📈" :title="t('admin.reporting.noMetrics')" />
    </template>
  </div>
</template>
