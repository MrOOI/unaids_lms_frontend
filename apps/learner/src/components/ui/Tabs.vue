<script setup lang="ts">
interface TabItem {
  value: string
  label: string
  /** Shown as a small dot when the tab has unsaved/missing content (e.g. an untranslated locale). */
  flagged?: boolean
}

interface Props {
  modelValue: string
  items: TabItem[]
}

defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
  <div class="flex flex-wrap gap-1 border-b border-gray-200" role="tablist">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      role="tab"
      class="relative -mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium"
      :class="
        modelValue === item.value
          ? 'border-brand-500 text-brand-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      "
      :aria-selected="modelValue === item.value"
      @click="emit('update:modelValue', item.value)"
    >
      {{ item.label }}
      <span v-if="item.flagged" class="size-1.5 rounded-full bg-warning-500" aria-hidden="true" />
    </button>
  </div>
</template>
