<script setup lang="ts">
/** Admin: one lesson's settings, translations, and content blocks (all types, all locales). */
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { SupportedLocale } from '@lms/i18n'
import { useAdminCatalog } from '../../composables/useAdminCatalog'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import { CONTENT_BLOCK_TYPES, type AdminLessonDetailDto, type ContentBlockType } from '../../lib/api-types'
import { emptyPayload } from '../../lib/blocks'
import Card from '../../components/ui/Card.vue'
import Button from '../../components/ui/Button.vue'
import Modal from '../../components/ui/Modal.vue'
import Badge from '../../components/ui/Badge.vue'
import Spinner from '../../components/ui/Spinner.vue'
import FormField from '../../components/form/FormField.vue'
import Select from '../../components/ui/Select.vue'
import TranslationEditor from '../../components/admin/TranslationEditor.vue'
import BlockPayloadEditor from '../../components/admin/BlockPayloadEditor.vue'
import Tabs from '../../components/ui/Tabs.vue'

const props = defineProps<{ lessonId: string }>()
const router = useRouter()
const { t } = useI18n()
const admin = useAdminCatalog()
const toast = useToast()
const { confirm } = useConfirm()

const lesson = ref<AdminLessonDetailDto | null>(null)
const isFetching = ref(true)
const lessonLocale = ref<SupportedLocale>('uz')
const savingTranslation = ref(false)

const settingsForm = reactive({ sortOrder: 1, estimatedMinutes: 15, isPublished: false })

const showBlockModal = ref(false)
const blockForm = reactive({ type: 'RichText' as ContentBlockType, sortOrder: 1 })

const blockLocales = reactive<Record<string, SupportedLocale>>({})
const blockDrafts = reactive<Record<string, Record<string, unknown>>>({})
const savingBlock = reactive<Record<string, boolean>>({})

onMounted(load)

async function load(): Promise<void> {
  isFetching.value = true
  try {
    lesson.value = await admin.getLesson(props.lessonId)
    settingsForm.sortOrder = lesson.value.sortOrder
    settingsForm.estimatedMinutes = lesson.value.estimatedMinutes
    settingsForm.isPublished = lesson.value.isPublished
    for (const block of lesson.value.blocks) {
      blockLocales[block.id] ??= 'uz'
      syncDraft(block.id)
    }
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.loadFailed'))
  } finally {
    isFetching.value = false
  }
}

function syncDraft(blockId: string): void {
  const block = lesson.value?.blocks.find((b) => b.id === blockId)
  if (!block) return
  const locale = blockLocales[blockId]
  const raw = block.payloadJsonByLocale[locale]
  try {
    blockDrafts[blockId] = raw ? JSON.parse(raw) : { ...emptyPayload(block.type) }
  } catch {
    blockDrafts[blockId] = { ...emptyPayload(block.type) }
  }
}

function setBlockLocale(blockId: string, locale: SupportedLocale): void {
  blockLocales[blockId] = locale
  syncDraft(blockId)
}

async function saveSettings(): Promise<void> {
  try {
    await admin.updateLesson(props.lessonId, { ...settingsForm })
    toast.success(t('admin.saved'))
    await load()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  }
}

const lessonTranslationsMap = () => {
  const map: Record<string, Record<string, string>> = {}
  for (const [locale, value] of Object.entries(lesson.value?.translations ?? {})) {
    map[locale] = { title: value.title, intro: value.intro }
  }
  return map
}

async function saveLessonTranslation(locale: string, values: Record<string, string>): Promise<void> {
  savingTranslation.value = true
  try {
    await admin.upsertLessonTranslation(props.lessonId, locale, { title: values.title, intro: values.intro })
    toast.success(t('admin.saved'))
    await load()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  } finally {
    savingTranslation.value = false
  }
}

function openAddBlock(): void {
  blockForm.type = 'RichText'
  blockForm.sortOrder = (lesson.value?.blocks.length ?? 0) + 1
  showBlockModal.value = true
}

async function createBlock(): Promise<void> {
  try {
    await admin.addBlock(props.lessonId, { type: blockForm.type, sortOrder: blockForm.sortOrder })
    showBlockModal.value = false
    toast.success(t('admin.saved'))
    await load()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  }
}

async function saveBlockTranslation(blockId: string): Promise<void> {
  savingBlock[blockId] = true
  try {
    await admin.upsertBlockTranslation(blockId, blockLocales[blockId], {
      payloadJson: JSON.stringify(blockDrafts[blockId] ?? {}),
    })
    toast.success(t('admin.saved'))
    await load()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  } finally {
    savingBlock[blockId] = false
  }
}

async function deleteBlock(blockId: string): Promise<void> {
  const confirmed = await confirm({
    title: t('admin.blocks.deleteConfirmTitle'),
    message: t('admin.blocks.deleteConfirmMessage'),
    danger: true,
    confirmLabel: t('common.delete'),
  })
  if (!confirmed) return
  try {
    await admin.deleteBlock(blockId)
    toast.success(t('admin.deleted'))
    await load()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  }
}

const localeTabs: SupportedLocale[] = ['uz', 'kaa', 'en', 'ru']
</script>

<template>
  <div class="admin-lesson-detail">
    <button type="button" class="admin-back" @click="router.back()">← {{ t('common.back') }}</button>

    <div v-if="isFetching" class="admin-loading"><Spinner :label="t('common.loading')" /></div>

    <template v-else-if="lesson">
      <div class="admin-grid">
        <Card :title="t('admin.lessons.settings')">
          <div class="admin-form">
            <FormField :label="t('admin.lessons.sortOrder')">
              <input v-model.number="settingsForm.sortOrder" type="number" class="admin-input" />
            </FormField>
            <FormField :label="t('admin.lessons.estimatedMinutes')">
              <input v-model.number="settingsForm.estimatedMinutes" type="number" class="admin-input" />
            </FormField>
            <label class="admin-checkbox">
              <input v-model="settingsForm.isPublished" type="checkbox" />
              <span>{{ t('admin.published') }}</span>
            </label>
            <div class="admin-form__actions">
              <Button variant="primary" size="sm" @click="saveSettings">{{ t('common.save') }}</Button>
            </div>
          </div>
        </Card>

        <Card :title="t('admin.lessons.translations')">
          <TranslationEditor
            v-model:active-locale="lessonLocale"
            :translations="lessonTranslationsMap()"
            :saving="savingTranslation"
            :fields="[
              { key: 'title', label: t('admin.fields.title') },
              { key: 'intro', label: t('admin.fields.intro'), multiline: true },
            ]"
            @save="saveLessonTranslation"
          />
        </Card>
      </div>

      <Card :title="t('admin.blocks.title')">
        <template #actions>
          <Button variant="primary" size="sm" @click="openAddBlock">{{ t('admin.blocks.add') }}</Button>
        </template>

        <div v-if="lesson.blocks.length === 0" class="admin-empty-row">{{ t('admin.blocks.empty') }}</div>

        <div v-for="block in lesson.blocks" :key="block.id" class="block-card">
          <div class="block-card__header">
            <Badge tone="info">{{ block.type }}</Badge>
            <span class="block-card__order">#{{ block.sortOrder }}</span>
            <Button variant="danger" size="sm" class="block-card__delete" @click="deleteBlock(block.id)">
              {{ t('common.delete') }}
            </Button>
          </div>

          <Tabs
            :model-value="blockLocales[block.id]"
            :items="localeTabs.map((code) => ({ value: code, label: code.toUpperCase(), flagged: !block.payloadJsonByLocale[code] }))"
            @update:model-value="(loc) => setBlockLocale(block.id, loc as SupportedLocale)"
          />

          <BlockPayloadEditor
            :type="block.type"
            :model-value="blockDrafts[block.id] ?? {}"
            @update:model-value="(v) => (blockDrafts[block.id] = v)"
          />

          <div class="block-card__actions">
            <Button variant="primary" size="sm" :loading="savingBlock[block.id]" @click="saveBlockTranslation(block.id)">
              {{ t('admin.saveTranslation') }}
            </Button>
          </div>
        </div>
      </Card>
    </template>

    <Modal v-model="showBlockModal" :title="t('admin.blocks.add')">
      <div class="admin-form">
        <FormField :label="t('admin.blocks.type')">
          <Select v-model="blockForm.type" :options="CONTENT_BLOCK_TYPES.map((type) => ({ value: type, label: type }))" />
        </FormField>
        <FormField :label="t('admin.blocks.sortOrder')">
          <input v-model.number="blockForm.sortOrder" type="number" class="admin-input" />
        </FormField>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showBlockModal = false">{{ t('common.cancel') }}</Button>
        <Button variant="primary" @click="createBlock">{{ t('common.create') }}</Button>
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

.admin-empty-row {
  padding: var(--space-6);
  text-align: center;
  color: var(--color-text-muted);
}

.block-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  margin-bottom: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.block-card__header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.block-card__order {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.block-card__delete {
  margin-left: auto;
}

.block-card__actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 800px) {
  .admin-grid {
    grid-template-columns: 1fr;
  }
}
</style>
