<script setup lang="ts">
interface Props {
  modelValue: string
  rows?: number
  placeholder?: string
  monospace?: boolean
}

withDefaults(defineProps<Props>(), { rows: 4 })
const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
  <textarea
    class="ui-textarea"
    :class="{ 'ui-textarea--mono': monospace }"
    :rows="rows"
    :placeholder="placeholder"
    :value="modelValue"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>

<style scoped>
.ui-textarea {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: inherit;
  color: var(--color-text);
  resize: vertical;
  line-height: 1.5;
}

.ui-textarea--mono {
  font-family: 'Courier New', monospace;
  font-size: 0.8125rem;
}

.ui-textarea:focus-visible {
  outline: none;
  border-color: var(--color-focus);
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
}
</style>
