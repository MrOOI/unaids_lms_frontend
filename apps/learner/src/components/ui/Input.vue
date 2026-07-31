<script setup lang="ts">
/**
 * Input component — TailAdmin's text-input recipe, shared by every form
 * across the app instead of each view hand-rolling its own `.form-input`.
 */
import { computed } from 'vue'

interface Props {
  modelValue: string | number
  type?: string
  placeholder?: string
  error?: boolean
  disabled?: boolean
  autocomplete?: string
  inputmode?: 'text' | 'numeric' | 'decimal' | 'email' | 'tel' | 'search' | 'url' | 'none'
  maxlength?: number
  ariaInvalid?: boolean
}

const props = withDefaults(defineProps<Props>(), { type: 'text' })
const emit = defineEmits<{ 'update:modelValue': [string]; blur: [FocusEvent] }>()

const cls = computed(() => [
  'h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs transition',
  'placeholder:text-gray-400 focus:outline-hidden focus:ring-3',
  'disabled:cursor-not-allowed disabled:border-gray-100 disabled:bg-gray-50 disabled:text-gray-400',
  props.error
    ? 'border-error-300 focus:border-error-300 focus:ring-error-500/10'
    : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10',
])
</script>

<template>
  <input
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :autocomplete="autocomplete"
    :inputmode="inputmode"
    :maxlength="maxlength"
    :aria-invalid="ariaInvalid ?? error"
    :class="cls"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    @blur="emit('blur', $event)"
  />
</template>
