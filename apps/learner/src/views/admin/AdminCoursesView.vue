<script setup lang="ts">
/** Admin: full course list (drafts included) + create-course flow. */
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAdminCatalog } from '../../composables/useAdminCatalog'
import { useToast } from '../../composables/useToast'
import type { AdminCourseListItemDto } from '../../lib/api-types'
import Card from '../../components/ui/Card.vue'
import Button from '../../components/ui/Button.vue'
import Modal from '../../components/ui/Modal.vue'
import Badge from '../../components/ui/Badge.vue'
import EmptyState from '../../components/ui/EmptyState.vue'
import Spinner from '../../components/ui/Spinner.vue'
import FormField from '../../components/form/FormField.vue'

const router = useRouter()
const { t, locale } = useI18n()
const { isLoading, listCourses, createCourse } = useAdminCatalog()
const toast = useToast()

const courses = ref<AdminCourseListItemDto[]>([])
const isFetching = ref(true)
const showCreate = ref(false)
const form = reactive({ slug: '', sortOrder: 0 })

onMounted(load)

async function load(): Promise<void> {
  isFetching.value = true
  try {
    courses.value = await listCourses()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.loadFailed'))
  } finally {
    isFetching.value = false
  }
}

function titleFor(course: AdminCourseListItemDto): string {
  return course.translations[locale.value]?.title ?? course.translations[Object.keys(course.translations)[0]]?.title ?? course.slug
}

async function handleCreate(): Promise<void> {
  if (!form.slug.trim()) return
  try {
    const result = await createCourse({ slug: form.slug.trim(), sortOrder: form.sortOrder })
    showCreate.value = false
    form.slug = ''
    form.sortOrder = 0
    toast.success(t('admin.courses.created'))
    await router.push({ name: 'admin-course-detail', params: { courseId: result.id } })
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  }
}
</script>

<template>
  <div class="admin-courses">
    <div class="admin-page-header">
      <div>
        <h1>{{ t('admin.courses.title') }}</h1>
        <p>{{ t('admin.courses.subtitle') }}</p>
      </div>
      <Button variant="primary" @click="showCreate = true">{{ t('admin.courses.create') }}</Button>
    </div>

    <div v-if="isFetching" class="admin-loading"><Spinner :label="t('common.loading')" /></div>

    <EmptyState v-else-if="courses.length === 0" icon="📘" :title="t('admin.courses.empty')" />

    <div v-else class="admin-course-grid">
      <Card v-for="course in courses" :key="course.id" :padded="false">
        <RouterLink :to="{ name: 'admin-course-detail', params: { courseId: course.id } }" class="admin-course-card">
          <div class="admin-course-card__top">
            <Badge :tone="course.isPublished ? 'success' : 'neutral'">
              {{ course.isPublished ? t('admin.published') : t('admin.draft') }}
            </Badge>
            <span class="admin-course-card__slug">{{ course.slug }}</span>
          </div>
          <h3>{{ titleFor(course) }}</h3>
          <p>{{ t('admin.courses.moduleCount', { count: course.moduleCount }) }}</p>
        </RouterLink>
      </Card>
    </div>

    <Modal v-model="showCreate" :title="t('admin.courses.create')">
      <div class="admin-form">
        <FormField :label="t('admin.courses.slug')" required>
          <input v-model="form.slug" type="text" class="admin-input" placeholder="hiv-and-gender" />
        </FormField>
        <FormField :label="t('admin.courses.sortOrder')">
          <input v-model.number="form.sortOrder" type="number" class="admin-input" />
        </FormField>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showCreate = false">{{ t('common.cancel') }}</Button>
        <Button variant="primary" :loading="isLoading" @click="handleCreate">{{ t('common.create') }}</Button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.admin-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
  flex-wrap: wrap;
}

.admin-page-header h1 {
  margin: 0 0 var(--space-1) 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.admin-page-header p {
  margin: 0;
  color: var(--color-text-muted);
}

.admin-loading {
  display: flex;
  justify-content: center;
  padding: var(--space-8);
}

.admin-course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-5);
}

.admin-course-card {
  display: block;
  padding: var(--space-5);
  text-decoration: none;
  color: inherit;
}

.admin-course-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.admin-course-card__slug {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-family: 'Courier New', monospace;
}

.admin-course-card h3 {
  margin: 0 0 var(--space-2) 0;
  font-size: 1.0625rem;
  color: var(--color-text);
}

.admin-course-card p {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.admin-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: inherit;
}
</style>
