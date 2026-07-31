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
import Input from '../../components/ui/Input.vue'

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
  <div>
    <div class="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="mb-1 text-2xl font-bold text-gray-800">{{ t('admin.courses.title') }}</h1>
        <p class="text-sm text-gray-500">{{ t('admin.courses.subtitle') }}</p>
      </div>
      <Button variant="primary" @click="showCreate = true">{{ t('admin.courses.create') }}</Button>
    </div>

    <div v-if="isFetching" class="flex justify-center py-8"><Spinner :label="t('common.loading')" /></div>

    <EmptyState v-else-if="courses.length === 0" icon="📘" :title="t('admin.courses.empty')" />

    <div v-else class="grid grid-cols-1 gap-5 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
      <Card v-for="course in courses" :key="course.id" :padded="false">
        <RouterLink :to="{ name: 'admin-course-detail', params: { courseId: course.id } }" class="block p-5 text-inherit no-underline">
          <div class="mb-3 flex items-center justify-between gap-2">
            <Badge :tone="course.isPublished ? 'success' : 'neutral'">
              {{ course.isPublished ? t('admin.published') : t('admin.draft') }}
            </Badge>
            <span class="font-mono text-xs text-gray-500">{{ course.slug }}</span>
          </div>
          <h3 class="mb-2 text-base font-semibold text-gray-800">{{ titleFor(course) }}</h3>
          <p class="text-[13px] text-gray-500">{{ t('admin.courses.moduleCount', { count: course.moduleCount }) }}</p>
        </RouterLink>
      </Card>
    </div>

    <Modal v-model="showCreate" :title="t('admin.courses.create')">
      <div class="flex flex-col gap-4">
        <FormField :label="t('admin.courses.slug')" required>
          <Input v-model="form.slug" type="text" placeholder="hiv-and-gender" />
        </FormField>
        <FormField :label="t('admin.courses.sortOrder')">
          <Input :model-value="form.sortOrder" type="number" @update:model-value="form.sortOrder = Number($event)" />
        </FormField>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showCreate = false">{{ t('common.cancel') }}</Button>
        <Button variant="primary" :loading="isLoading" @click="handleCreate">{{ t('common.create') }}</Button>
      </template>
    </Modal>
  </div>
</template>
