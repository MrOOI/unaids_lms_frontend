<script setup lang="ts">
/**
 * Admin: one course's settings, translations, and module/lesson structure.
 * Lesson content (translations + blocks) is edited on AdminLessonDetailView;
 * a quiz's questions are edited on AdminQuizDetailView.
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { SupportedLocale } from '@lms/i18n'
import { useAdminCatalog } from '../../composables/useAdminCatalog'
import { useToast } from '../../composables/useToast'
import type { AdminCourseDetailDto, AdminModuleDto } from '../../lib/api-types'
import Card from '../../components/ui/Card.vue'
import Button from '../../components/ui/Button.vue'
import Modal from '../../components/ui/Modal.vue'
import Badge from '../../components/ui/Badge.vue'
import Spinner from '../../components/ui/Spinner.vue'
import FormField from '../../components/form/FormField.vue'
import TranslationEditor from '../../components/admin/TranslationEditor.vue'

const props = defineProps<{ courseId: string }>()
const router = useRouter()
const { t } = useI18n()
const admin = useAdminCatalog()
const toast = useToast()

const course = ref<AdminCourseDetailDto | null>(null)
const isFetching = ref(true)
const courseLocale = ref<SupportedLocale>('uz')
const savingTranslation = ref(false)

const settingsForm = reactive({ slug: '', sortOrder: 0, isPublished: false, sequentialUnlock: false })

const showModuleModal = ref(false)
const editingModule = ref<AdminModuleDto | null>(null)
const moduleForm = reactive({ number: 0, themeNumber: 0, sortOrder: 0, isPublished: false })

const showLessonModal = ref(false)
const lessonModuleId = ref<string | null>(null)
const lessonForm = reactive({ sortOrder: 1, estimatedMinutes: 15, isPublished: false })

onMounted(load)

async function load(): Promise<void> {
  isFetching.value = true
  try {
    course.value = await admin.getCourse(props.courseId)
    settingsForm.slug = course.value.slug
    settingsForm.sortOrder = course.value.sortOrder
    settingsForm.isPublished = course.value.isPublished
    settingsForm.sequentialUnlock = course.value.sequentialUnlock
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.loadFailed'))
  } finally {
    isFetching.value = false
  }
}

const courseTranslationsMap = computed(() => {
  const map: Record<string, Record<string, string>> = {}
  for (const [locale, value] of Object.entries(course.value?.translations ?? {})) {
    map[locale] = { title: value.title, description: value.description }
  }
  return map
})

async function saveSettings(): Promise<void> {
  try {
    await admin.updateCourse(props.courseId, {
      slug: settingsForm.slug,
      sortOrder: settingsForm.sortOrder,
      isPublished: settingsForm.isPublished,
      sequentialUnlock: settingsForm.sequentialUnlock,
    })
    toast.success(t('admin.saved'))
    await load()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  }
}

async function saveCourseTranslation(locale: string, values: Record<string, string>): Promise<void> {
  savingTranslation.value = true
  try {
    await admin.upsertCourseTranslation(props.courseId, locale, {
      title: values.title,
      description: values.description,
    })
    toast.success(t('admin.saved'))
    await load()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  } finally {
    savingTranslation.value = false
  }
}

function openCreateModule(): void {
  editingModule.value = null
  const nextNumber = (course.value?.modules.length ?? 0)
  moduleForm.number = nextNumber
  moduleForm.themeNumber = nextNumber % 6
  moduleForm.sortOrder = nextNumber
  moduleForm.isPublished = false
  showModuleModal.value = true
}

function openEditModule(module: AdminModuleDto): void {
  editingModule.value = module
  moduleForm.number = module.number
  moduleForm.themeNumber = module.themeNumber
  moduleForm.sortOrder = module.sortOrder
  moduleForm.isPublished = module.isPublished
  showModuleModal.value = true
}

async function saveModule(): Promise<void> {
  try {
    if (editingModule.value) {
      await admin.updateModule(editingModule.value.id, { ...moduleForm })
    } else {
      await admin.addModule(props.courseId, { ...moduleForm })
    }
    showModuleModal.value = false
    toast.success(t('admin.saved'))
    await load()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  }
}

function openCreateLesson(moduleId: string): void {
  lessonModuleId.value = moduleId
  const module = course.value?.modules.find((m) => m.id === moduleId)
  lessonForm.sortOrder = (module?.lessons.length ?? 0) + 1
  lessonForm.estimatedMinutes = 15
  lessonForm.isPublished = false
  showLessonModal.value = true
}

async function saveLesson(): Promise<void> {
  if (!lessonModuleId.value) return
  try {
    const result = await admin.addLesson(lessonModuleId.value, { ...lessonForm })
    showLessonModal.value = false
    toast.success(t('admin.saved'))
    await router.push({ name: 'admin-lesson-detail', params: { lessonId: result.id } })
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  }
}

async function confirmModuleTranslations(module: AdminModuleDto): Promise<void> {
  // Module translations are edited inline via a lightweight prompt-modal pattern
  // reusing the same TranslationEditor, scoped per module id.
  moduleTranslationsTarget.value = module
}

const moduleTranslationsTarget = ref<AdminModuleDto | null>(null)
const moduleLocale = ref<SupportedLocale>('uz')

function moduleTranslationsMap(module: AdminModuleDto): Record<string, Record<string, string>> {
  const map: Record<string, Record<string, string>> = {}
  for (const [locale, value] of Object.entries(module.translations)) {
    map[locale] = { title: value.title, summary: value.summary }
  }
  return map
}

async function saveModuleTranslation(locale: string, values: Record<string, string>): Promise<void> {
  if (!moduleTranslationsTarget.value) return
  savingTranslation.value = true
  try {
    await admin.upsertModuleTranslation(moduleTranslationsTarget.value.id, locale, {
      title: values.title,
      summary: values.summary,
    })
    toast.success(t('admin.saved'))
    await load()
    moduleTranslationsTarget.value =
      course.value?.modules.find((m) => m.id === moduleTranslationsTarget.value?.id) ?? null
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  } finally {
    savingTranslation.value = false
  }
}
</script>

<template>
  <div class="admin-course-detail">
    <button type="button" class="admin-back" @click="router.push({ name: 'admin-dashboard' })">
      ← {{ t('admin.courses.title') }}
    </button>

    <div v-if="isFetching" class="admin-loading"><Spinner :label="t('common.loading')" /></div>

    <template v-else-if="course">
      <div class="admin-page-header">
        <div>
          <h1>{{ course.translations[courseLocale]?.title ?? course.slug }}</h1>
          <Badge :tone="course.isPublished ? 'success' : 'neutral'">
            {{ course.isPublished ? t('admin.published') : t('admin.draft') }}
          </Badge>
        </div>
      </div>

      <div class="admin-grid">
        <Card :title="t('admin.courses.settings')">
          <div class="admin-form">
            <FormField :label="t('admin.courses.slug')">
              <input v-model="settingsForm.slug" type="text" class="admin-input" />
            </FormField>
            <FormField :label="t('admin.courses.sortOrder')">
              <input v-model.number="settingsForm.sortOrder" type="number" class="admin-input" />
            </FormField>
            <label class="admin-checkbox">
              <input v-model="settingsForm.isPublished" type="checkbox" />
              <span>{{ t('admin.published') }}</span>
            </label>
            <label class="admin-checkbox">
              <input v-model="settingsForm.sequentialUnlock" type="checkbox" />
              <span>{{ t('admin.courses.sequentialUnlock') }}</span>
            </label>
            <p class="admin-hint">{{ t('admin.courses.sequentialUnlockHint') }}</p>
            <div class="admin-form__actions">
              <Button variant="primary" size="sm" :loading="admin.isLoading.value" @click="saveSettings">
                {{ t('common.save') }}
              </Button>
            </div>
          </div>
        </Card>

        <Card :title="t('admin.courses.translations')">
          <TranslationEditor
            v-model:active-locale="courseLocale"
            :translations="courseTranslationsMap"
            :saving="savingTranslation"
            :fields="[
              { key: 'title', label: t('admin.fields.title') },
              { key: 'description', label: t('admin.fields.description'), multiline: true },
            ]"
            @save="saveCourseTranslation"
          />
        </Card>
      </div>

      <Card :title="t('admin.modules.title')">
        <template #actions>
          <Button variant="primary" size="sm" @click="openCreateModule">{{ t('admin.modules.add') }}</Button>
        </template>

        <div v-if="course.modules.length === 0" class="admin-empty-row">{{ t('admin.modules.empty') }}</div>

        <div v-for="module in course.modules" :key="module.id" class="module-block" :data-module="module.themeNumber">
          <div class="module-block__header">
            <span class="module-block__badge">{{ t('module.label', { number: module.number }) }}</span>
            <strong>{{ module.translations[courseLocale]?.title ?? `Module ${module.number}` }}</strong>
            <Badge :tone="module.isPublished ? 'success' : 'neutral'">
              {{ module.isPublished ? t('admin.published') : t('admin.draft') }}
            </Badge>
            <div class="module-block__actions">
              <Button variant="secondary" size="sm" @click="openEditModule(module)">{{ t('common.edit') }}</Button>
              <Button variant="secondary" size="sm" @click="confirmModuleTranslations(module)">
                {{ t('admin.translations') }}
              </Button>
              <RouterLink :to="{ name: 'admin-module-quizzes', params: { moduleId: module.id } }">
                <Button variant="secondary" size="sm">{{ t('admin.nav.quizzes') }}</Button>
              </RouterLink>
            </div>
          </div>

          <div class="module-block__lessons">
            <RouterLink
              v-for="lesson in module.lessons"
              :key="lesson.id"
              :to="{ name: 'admin-lesson-detail', params: { lessonId: lesson.id } }"
              class="lesson-row"
            >
              <span>{{ lesson.translations[courseLocale]?.title ?? `Lesson ${lesson.sortOrder}` }}</span>
              <Badge :tone="lesson.isPublished ? 'success' : 'neutral'">
                {{ lesson.isPublished ? t('admin.published') : t('admin.draft') }}
              </Badge>
            </RouterLink>
            <Button variant="secondary" size="sm" @click="openCreateLesson(module.id)">
              {{ t('admin.lessons.add') }}
            </Button>
          </div>
        </div>
      </Card>
    </template>

    <!-- Module create/edit modal -->
    <Modal v-model="showModuleModal" :title="editingModule ? t('admin.modules.edit') : t('admin.modules.add')">
      <div class="admin-form">
        <FormField :label="t('admin.modules.number')">
          <input v-model.number="moduleForm.number" type="number" class="admin-input" />
        </FormField>
        <FormField :label="t('admin.modules.theme')">
          <div class="theme-picker">
            <button
              v-for="n in 6"
              :key="n - 1"
              type="button"
              class="theme-swatch"
              :data-module="n - 1"
              :class="{ 'theme-swatch--selected': moduleForm.themeNumber === n - 1 }"
              :aria-label="`Theme ${n - 1}`"
              @click="moduleForm.themeNumber = n - 1"
            />
          </div>
        </FormField>
        <FormField :label="t('admin.modules.sortOrder')">
          <input v-model.number="moduleForm.sortOrder" type="number" class="admin-input" />
        </FormField>
        <label class="admin-checkbox">
          <input v-model="moduleForm.isPublished" type="checkbox" />
          <span>{{ t('admin.published') }}</span>
        </label>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showModuleModal = false">{{ t('common.cancel') }}</Button>
        <Button variant="primary" :loading="admin.isLoading.value" @click="saveModule">{{ t('common.save') }}</Button>
      </template>
    </Modal>

    <!-- Module translations modal -->
    <Modal
      :model-value="!!moduleTranslationsTarget"
      :title="t('admin.modules.translations')"
      size="lg"
      @update:model-value="moduleTranslationsTarget = null"
    >
      <TranslationEditor
        v-if="moduleTranslationsTarget"
        v-model:active-locale="moduleLocale"
        :translations="moduleTranslationsMap(moduleTranslationsTarget)"
        :saving="savingTranslation"
        :fields="[
          { key: 'title', label: t('admin.fields.title') },
          { key: 'summary', label: t('admin.fields.summary'), multiline: true },
        ]"
        @save="saveModuleTranslation"
      />
    </Modal>

    <!-- Lesson create modal -->
    <Modal v-model="showLessonModal" :title="t('admin.lessons.add')">
      <div class="admin-form">
        <FormField :label="t('admin.lessons.sortOrder')">
          <input v-model.number="lessonForm.sortOrder" type="number" class="admin-input" />
        </FormField>
        <FormField :label="t('admin.lessons.estimatedMinutes')">
          <input v-model.number="lessonForm.estimatedMinutes" type="number" class="admin-input" />
        </FormField>
        <label class="admin-checkbox">
          <input v-model="lessonForm.isPublished" type="checkbox" />
          <span>{{ t('admin.published') }}</span>
        </label>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showLessonModal = false">{{ t('common.cancel') }}</Button>
        <Button variant="primary" :loading="admin.isLoading.value" @click="saveLesson">{{ t('common.create') }}</Button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.admin-back {
  border: none;
  background: transparent;
  color: var(--module-2);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-bottom: var(--space-6);
}

.admin-loading {
  display: flex;
  justify-content: center;
  padding: var(--space-8);
}

.admin-page-header {
  margin-bottom: var(--space-6);
}

.admin-page-header h1 {
  margin: 0 0 var(--space-2) 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}

.admin-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.admin-form__actions {
  display: flex;
  justify-content: flex-end;
}

.admin-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: inherit;
}

.admin-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.875rem;
  font-weight: 600;
}

.admin-hint {
  margin: calc(var(--space-2) * -1) 0 0 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.admin-empty-row {
  padding: var(--space-6);
  text-align: center;
  color: var(--color-text-muted);
}

.module-block {
  border: 1px solid var(--color-border);
  border-top: 4px solid var(--module-primary);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-4);
  overflow: hidden;
}

.module-block__header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--module-bg);
  flex-wrap: wrap;
}

.module-block__badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--module-text);
  text-transform: uppercase;
}

.module-block__actions {
  display: flex;
  gap: var(--space-2);
  margin-left: auto;
  flex-wrap: wrap;
}

.module-block__lessons {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
}

.lesson-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text);
}

.lesson-row:hover {
  background: var(--color-surface-alt);
}

.theme-picker {
  display: flex;
  gap: var(--space-2);
}

.theme-swatch {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid transparent;
  background: var(--module-primary);
  cursor: pointer;
}

.theme-swatch--selected {
  border-color: var(--color-text);
  box-shadow: 0 0 0 2px var(--color-surface), 0 0 0 4px var(--color-text);
}

@media (max-width: 800px) {
  .admin-grid {
    grid-template-columns: 1fr;
  }
}
</style>
