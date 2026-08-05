<script setup lang="ts">
/**
 * 1-5 rating control. A native <select> rather than a custom star widget —
 * keyboard- and screen-reader-friendly by construction, consistent with the
 * matching/sequencing quiz components' choice of <select> over raw
 * drag-and-drop (WCAG 2.2 AA, §21).
 */
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  modelValue: number
  label: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

function handleChange(event: Event): void {
  emit('update:modelValue', Number((event.target as HTMLSelectElement).value))
}
</script>

<template>
  <div class="rating-input">
    <label class="rating-input__label">{{ props.label }}</label>
    <select class="rating-input__select" :value="props.modelValue" @change="handleChange">
      <option v-for="n in 5" :key="n" :value="n">{{ n }} — {{ t(`feedback.scale.${n}`) }}</option>
    </select>
  </div>
</template>

<style scoped>
.rating-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.rating-input__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.rating-input__select {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: inherit;
  background: var(--color-surface);
  color: var(--color-text);
  min-height: 44px;
}
</style>
