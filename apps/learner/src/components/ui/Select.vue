<script setup lang="ts">
import { ChevronDownIcon } from '../../icons'

interface OptionItem {
  value: string | number
  label: string
}

interface Props {
  modelValue: string | number
  options: OptionItem[]
  ariaLabel?: string
  /** Passed to the wrapper div — e.g. `max-w-xs` to constrain width in a toolbar. */
  wrapperClass?: string
}

defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [string | number] }>()
</script>

<template>
  <div class="relative" :class="wrapperClass">
    <select
      class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
      :aria-label="ariaLabel"
      :value="modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
    <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
      <ChevronDownIcon class="size-5" />
    </span>
  </div>
</template>
