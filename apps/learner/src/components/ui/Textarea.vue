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
    class="w-full resize-y rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
    :class="monospace ? 'font-mono text-[13px]' : ''"
    :rows="rows"
    :placeholder="placeholder"
    :value="modelValue"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
