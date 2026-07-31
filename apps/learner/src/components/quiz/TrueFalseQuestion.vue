<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { TrueFalseAnswer } from '../../lib/questions'

defineProps<{ modelValue?: TrueFalseAnswer }>()
const emit = defineEmits<{ 'update:modelValue': [TrueFalseAnswer] }>()
const { t } = useI18n()
</script>

<template>
  <div class="true-false">
    <button
      type="button"
      class="true-false__btn"
      :class="{ 'true-false__btn--selected': modelValue?.value === true }"
      @click="emit('update:modelValue', { value: true })"
    >
      {{ t('quiz.true') }}
    </button>
    <button
      type="button"
      class="true-false__btn"
      :class="{ 'true-false__btn--selected': modelValue?.value === false }"
      @click="emit('update:modelValue', { value: false })"
    >
      {{ t('quiz.false') }}
    </button>
  </div>
</template>

<style scoped>
.true-false {
  display: flex;
  gap: var(--space-4);
}

.true-false__btn {
  flex: 1;
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  color: var(--color-text);
}

.true-false__btn:hover {
  border-color: var(--module-primary, var(--color-focus));
}

.true-false__btn--selected {
  border-color: var(--module-primary, var(--color-focus));
  background: var(--module-bg, var(--color-surface-alt));
  color: var(--module-text, var(--color-text));
}
</style>
