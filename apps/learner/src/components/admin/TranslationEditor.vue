<script setup lang="ts">
/**
 * Generic per-locale translation form: renders locale tabs (flagging any
 * locale with no saved translation yet) and a set of text/textarea fields for
 * whichever locale is selected. Used for course/module/lesson/quiz title +
 * description-shaped translations across the admin authoring screens.
 */
import { reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { LOCALE_NAMES, SUPPORTED_LOCALES, type SupportedLocale } from '@lms/i18n'
import Tabs from '../ui/Tabs.vue'
import Textarea from '../ui/Textarea.vue'
import Button from '../ui/Button.vue'
import FormField from '../form/FormField.vue'

export interface TranslationField {
  key: string
  label: string
  multiline?: boolean
}

const props = defineProps<{
  translations: Record<string, Record<string, string>>
  fields: TranslationField[]
  saving?: boolean
  activeLocale: SupportedLocale
}>()

const emit = defineEmits<{
  'update:activeLocale': [SupportedLocale]
  save: [locale: string, values: Record<string, string>]
}>()

const { t } = useI18n()

const form = reactive<Record<string, string>>({})

function loadFromTranslations(): void {
  const current = props.translations[props.activeLocale] ?? {}
  for (const field of props.fields) {
    form[field.key] = current[field.key] ?? ''
  }
}

loadFromTranslations()
watch(() => [props.activeLocale, props.translations], loadFromTranslations, { deep: true })

const tabItems = SUPPORTED_LOCALES.map((code) => ({
  value: code,
  label: LOCALE_NAMES[code],
  flagged: false,
}))

function isFlagged(code: SupportedLocale): boolean {
  const t = props.translations[code]
  return !t || props.fields.some((f) => !t[f.key]?.trim())
}

function handleSave(): void {
  emit('save', props.activeLocale, { ...form })
}
</script>

<template>
  <div class="translation-editor">
    <Tabs
      :model-value="activeLocale"
      :items="tabItems.map((item) => ({ ...item, flagged: isFlagged(item.value as SupportedLocale) }))"
      @update:model-value="emit('update:activeLocale', $event as SupportedLocale)"
    />

    <div class="translation-editor__form">
      <FormField v-for="field in fields" :key="field.key" :label="field.label">
        <Textarea v-if="field.multiline" v-model="form[field.key]" :rows="4" />
        <input v-else v-model="form[field.key]" type="text" class="translation-editor__input" />
      </FormField>

      <div class="translation-editor__actions">
        <Button variant="primary" size="sm" :loading="saving" @click="handleSave">
          {{ t('admin.saveTranslation') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.translation-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.translation-editor__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-top: var(--space-2);
}

.translation-editor__input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: inherit;
}

.translation-editor__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
