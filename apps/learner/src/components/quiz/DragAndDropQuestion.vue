<script setup lang="ts">
/** Accessible drag-and-drop stand-in: assign each item to a zone via <select>. */
import { useI18n } from 'vue-i18n'
import type { DragAndDropPayload, DragAndDropAnswer } from '../../lib/questions'

const props = defineProps<{ payload: DragAndDropPayload; modelValue?: DragAndDropAnswer }>()
const emit = defineEmits<{ 'update:modelValue': [DragAndDropAnswer] }>()
const { t } = useI18n()

function setPlacement(itemId: string, zoneId: string): void {
  emit('update:modelValue', { placements: { ...(props.modelValue?.placements ?? {}), [itemId]: zoneId } })
}
</script>

<template>
  <div class="dnd-question">
    <div v-for="item in payload.items" :key="item.id" class="dnd-row">
      <span class="dnd-row__item">{{ item.text }}</span>
      <select
        class="dnd-row__select"
        :value="modelValue?.placements?.[item.id] ?? ''"
        :aria-label="t('quiz.placeInZone', { item: item.text })"
        @change="setPlacement(item.id, ($event.target as HTMLSelectElement).value)"
      >
        <option value="" disabled>{{ t('quiz.selectZone') }}</option>
        <option v-for="zone in payload.zones" :key="zone.id" :value="zone.id">{{ zone.text }}</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.dnd-question {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.dnd-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.dnd-row__item {
  font-weight: 600;
}

.dnd-row__select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: inherit;
}

@media (max-width: 560px) {
  .dnd-row {
    grid-template-columns: 1fr;
  }
}
</style>
