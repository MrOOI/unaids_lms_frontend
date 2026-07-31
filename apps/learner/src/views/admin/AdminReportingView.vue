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
  <div class="admin-reporting">
    <div class="admin-page-header">
      <h1>{{ t('admin.reporting.title') }}</h1>
    </div>

    <div v-if="isFetching" class="admin-loading"><Spinner :label="t('common.loading')" /></div>

    <EmptyState v-else-if="courses.length === 0" icon="📊" :title="t('admin.reporting.noCourses')" />

    <template v-else>
      <Card>
        <div class="reporting-controls">
          <Select
            v-model="selectedCourseId"
            :options="courses.map((c) => ({ value: c.id, label: c.translations[locale]?.title ?? c.slug }))"
            @update:model-value="loadMetrics"
          />
          <Button variant="secondary" :loading="isExporting" @click="handleExport">
            {{ t('admin.reporting.exportLearners') }}
          </Button>
        </div>
      </Card>

      <div v-if="metrics.length > 0" class="metrics-grid">
        <Card v-for="m in metrics" :key="m.courseId" :title="selectedCourseName">
          <div class="metrics-tiles">
            <div class="metric-tile">
              <span class="metric-tile__value">{{ m.totalEnrolled }}</span>
              <span class="metric-tile__label">{{ t('admin.reporting.totalEnrolled') }}</span>
            </div>
            <div class="metric-tile">
              <span class="metric-tile__value">{{ m.completed }}</span>
              <span class="metric-tile__label">{{ t('admin.reporting.completed') }}</span>
            </div>
            <div class="metric-tile">
              <span class="metric-tile__value">{{ m.completionPercent }}%</span>
              <span class="metric-tile__label">{{ t('admin.reporting.completionRate') }}</span>
            </div>
            <div class="metric-tile">
              <span class="metric-tile__value">{{ m.passedFinalQuiz }}</span>
              <span class="metric-tile__label">{{ t('admin.reporting.passedFinal') }}</span>
            </div>
          </div>
        </Card>
      </div>
      <EmptyState v-else icon="📈" :title="t('admin.reporting.noMetrics')" />
    </template>
  </div>
</template>

<style scoped>
.admin-page-header {
  margin-bottom: var(--space-6);
}

.admin-page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.admin-loading {
  display: flex;
  justify-content: center;
  padding: var(--space-8);
}

.reporting-controls {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  flex-wrap: wrap;
}

.reporting-controls :deep(.ui-select) {
  max-width: 320px;
}

.metrics-grid {
  margin-top: var(--space-6);
}

.metrics-tiles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

.metric-tile {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-5);
  background: var(--color-surface-alt);
  border-radius: var(--radius-lg);
  text-align: center;
}

.metric-tile__value {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--module-2);
}

.metric-tile__label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

@media (max-width: 700px) {
  .metrics-tiles {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
