<script setup lang="ts">
import type { MultiChoicePayload, MultiChoiceAnswer } from '../../lib/questions'

const props = defineProps<{ payload: MultiChoicePayload; modelValue?: MultiChoiceAnswer }>()
const emit = defineEmits<{ 'update:modelValue': [MultiChoiceAnswer] }>()

function toggle(optionId: string): void {
  const current = props.modelValue?.selected ?? []
  const next = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
  emit('update:modelValue', { selected: next })
}
</script>

<template>
  <fieldset class="choice-question">
    <legend class="visually-hidden">{{ payload.prompt }}</legend>
    <label
      v-for="option in payload.options"
      :key="option.id"
      class="choice-option"
      :class="{ 'choice-option--selected': modelValue?.selected?.includes(option.id) }"
    >
      <input
        type="checkbox"
        :checked="modelValue?.selected?.includes(option.id)"
        @change="toggle(option.id)"
      />
      <span>{{ option.text }}</span>
    </label>
  </fieldset>
</template>

<style scoped>
.choice-question {
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.choice-option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.choice-option:hover {
  border-color: var(--module-primary, var(--color-focus));
}

.choice-option--selected {
  border-color: var(--module-primary, var(--color-focus));
  background: var(--module-bg, var(--color-surface-alt));
}

.choice-option input {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  accent-color: var(--module-primary, var(--color-focus));
}
</style>
