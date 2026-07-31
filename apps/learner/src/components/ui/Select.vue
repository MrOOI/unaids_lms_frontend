<script setup lang="ts">
interface OptionItem {
  value: string | number
  label: string
}

interface Props {
  modelValue: string | number
  options: OptionItem[]
  ariaLabel?: string
}

defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [string | number] }>()
</script>

<template>
  <select
    class="ui-select"
    :aria-label="ariaLabel"
    :value="modelValue"
    @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
  </select>
</template>

<style scoped>
.ui-select {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: inherit;
  color: var(--color-text);
  background: var(--color-surface);
  min-height: var(--min-touch-target);
}

.ui-select:focus-visible {
  outline: none;
  border-color: var(--color-focus);
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
}
</style>
