<script setup lang="ts">
/** Reorder-by-button UI (no raw drag-and-drop) for keyboard/screen-reader access. */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SequencingPayload, SequencingAnswer } from '../../lib/questions'

const props = defineProps<{ payload: SequencingPayload; modelValue?: SequencingAnswer }>()
const emit = defineEmits<{ 'update:modelValue': [SequencingAnswer] }>()
const { t } = useI18n()

const order = computed<string[]>(() => props.modelValue?.order ?? props.payload.items.map((i) => i.id))

function itemText(id: string): string {
  return props.payload.items.find((i) => i.id === id)?.text ?? ''
}

function move(index: number, delta: number): void {
  const next = [...order.value]
  const target = index + delta
  if (target < 0 || target >= next.length) return
  ;[next[index], next[target]] = [next[target], next[index]]
  emit('update:modelValue', { order: next })
}
</script>

<template>
  <ol class="sequencing-question">
    <li v-for="(itemId, index) in order" :key="itemId" class="sequencing-item">
      <span class="sequencing-item__index">{{ index + 1 }}</span>
      <span class="sequencing-item__text">{{ itemText(itemId) }}</span>
      <span class="sequencing-item__controls">
        <button
          type="button"
          :aria-label="t('quiz.moveUp')"
          :disabled="index === 0"
          @click="move(index, -1)"
        >
          ↑
        </button>
        <button
          type="button"
          :aria-label="t('quiz.moveDown')"
          :disabled="index === order.length - 1"
          @click="move(index, 1)"
        >
          ↓
        </button>
      </span>
    </li>
  </ol>
</template>

<style scoped>
.sequencing-question {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sequencing-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.sequencing-item__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--module-primary, var(--color-focus));
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.sequencing-item__text {
  flex: 1;
}

.sequencing-item__controls {
  display: flex;
  gap: var(--space-1);
}

.sequencing-item__controls button {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
  cursor: pointer;
}

.sequencing-item__controls button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
