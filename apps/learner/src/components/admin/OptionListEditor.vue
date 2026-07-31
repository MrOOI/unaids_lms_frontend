<script setup lang="ts">
/** Add/remove/reorder editor for an array of {id, text} items — options, matching columns, sequencing items, etc. */
import type { OptionItem } from '../../lib/questions'

const props = defineProps<{ items: OptionItem[]; addLabel: string }>()
const emit = defineEmits<{ 'update:items': [OptionItem[]] }>()

function addItem(): void {
  emit('update:items', [...props.items, { id: crypto.randomUUID(), text: '' }])
}

function removeItem(id: string): void {
  emit('update:items', props.items.filter((i) => i.id !== id))
}

function updateText(id: string, text: string): void {
  emit('update:items', props.items.map((i) => (i.id === id ? { ...i, text } : i)))
}

function move(index: number, delta: number): void {
  const target = index + delta
  if (target < 0 || target >= props.items.length) return
  const next = [...props.items]
  ;[next[index], next[target]] = [next[target], next[index]]
  emit('update:items', next)
}
</script>

<template>
  <div class="option-list">
    <div v-for="(item, index) in items" :key="item.id" class="option-list__row">
      <span class="option-list__controls">
        <button type="button" :disabled="index === 0" aria-label="Move up" @click="move(index, -1)">↑</button>
        <button type="button" :disabled="index === items.length - 1" aria-label="Move down" @click="move(index, 1)">↓</button>
      </span>
      <input
        type="text"
        class="option-list__input"
        :value="item.text"
        @input="updateText(item.id, ($event.target as HTMLInputElement).value)"
      />
      <button type="button" class="option-list__remove" aria-label="Remove" @click="removeItem(item.id)">×</button>
    </div>
    <button type="button" class="option-list__add" @click="addItem">+ {{ addLabel }}</button>
  </div>
</template>

<style scoped>
.option-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.option-list__row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.option-list__controls {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-list__controls button {
  width: 22px;
  height: 18px;
  font-size: 0.625rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-surface-alt);
  cursor: pointer;
}

.option-list__controls button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.option-list__input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: inherit;
}

.option-list__remove {
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-error);
  font-size: 1rem;
  cursor: pointer;
  flex-shrink: 0;
}

.option-list__add {
  align-self: flex-start;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  padding: var(--space-2) var(--space-4);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--module-1-accessible, var(--color-focus));
  cursor: pointer;
}
</style>
