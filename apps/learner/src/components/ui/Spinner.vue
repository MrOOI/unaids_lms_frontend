<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

withDefaults(defineProps<Props>(), { size: 'md' })

const sizeClasses = {
  sm: 'size-4 border-2',
  md: 'size-7 border-[3px]',
  lg: 'size-11 border-4',
}
</script>

<template>
  <div class="inline-flex items-center gap-3" role="status">
    <span
      class="inline-block animate-spin rounded-full border-gray-200 border-t-[var(--module-primary,var(--color-brand-500))]"
      :class="sizeClasses[size]"
      aria-hidden="true"
    />
    <span v-if="label" class="text-sm text-gray-500">{{ label }}</span>
    <span v-else class="visually-hidden">Loading…</span>
  </div>
</template>
