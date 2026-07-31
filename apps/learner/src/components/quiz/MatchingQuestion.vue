<script setup lang="ts">
/**
 * Accessible matching UI: each left-column item gets a <select> of the
 * (shuffled) right-column options, rather than raw drag-and-drop — keyboard-
 * and screen-reader-friendly per the platform's WCAG 2.2 AA commitment.
 */
import { useI18n } from 'vue-i18n'
import type { MatchingPayload, MatchingAnswer } from '../../lib/questions'

const props = defineProps<{ payload: MatchingPayload; modelValue?: MatchingAnswer }>()
const emit = defineEmits<{ 'update:modelValue': [MatchingAnswer] }>()
const { t } = useI18n()

function setPair(leftId: string, rightId: string): void {
  emit('update:modelValue', { pairs: { ...(props.modelValue?.pairs ?? {}), [leftId]: rightId } })
}
</script>

<template>
  <div class="matching-question">
    <div v-for="left in payload.left" :key="left.id" class="matching-row">
      <span class="matching-row__left">{{ left.text }}</span>
      <select
        class="matching-row__select"
        :value="modelValue?.pairs?.[left.id] ?? ''"
        :aria-label="t('quiz.matchWith', { item: left.text })"
        @change="setPair(left.id, ($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>{{ t('quiz.selectMatch') }}</option>
        <option v-for="right in payload.right" :key="right.id" :value="right.id">{{ right.text }}</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.matching-question {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.matching-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.matching-row__left {
  font-weight: 600;
}

.matching-row__select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: inherit;
}

@media (max-width: 560px) {
  .matching-row {
    grid-template-columns: 1fr;
  }
}
</style>
