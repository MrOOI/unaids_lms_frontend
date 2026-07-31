<script setup lang="ts">
import type { SingleChoicePayload, SingleChoiceAnswer } from '../../lib/questions'

const props = defineProps<{ payload: SingleChoicePayload; modelValue?: SingleChoiceAnswer; name: string }>()
const emit = defineEmits<{ 'update:modelValue': [SingleChoiceAnswer] }>()

function select(optionId: string): void {
  emit('update:modelValue', { selected: optionId })
}
</script>

<template>
  <fieldset class="choice-question">
    <legend class="visually-hidden">{{ payload.prompt }}</legend>
    <label
      v-for="option in payload.options"
      :key="option.id"
      class="choice-option"
      :class="{ 'choice-option--selected': modelValue?.selected === option.id }"
    >
      <input
        type="radio"
        :name="props.name"
        :checked="modelValue?.selected === option.id"
        @change="select(option.id)"
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
