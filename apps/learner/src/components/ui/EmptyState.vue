<script setup lang="ts">
interface Props {
  title: string
  message?: string
  icon?: string
}
defineProps<Props>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center">
    <div v-if="icon" class="mb-2 text-4xl" aria-hidden="true">{{ icon }}</div>
    <p class="font-semibold text-gray-800">{{ title }}</p>
    <p v-if="message" class="max-w-md text-sm text-gray-500">{{ message }}</p>
    <div v-if="$slots.action" class="mt-3">
      <slot name="action" />
    </div>
  </div>
</template>
