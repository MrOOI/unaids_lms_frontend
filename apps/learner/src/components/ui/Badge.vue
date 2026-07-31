<script setup lang="ts">
import { computed } from 'vue'

type BadgeTone = 'neutral' | 'success' | 'warning' | 'error' | 'info'

interface Props {
  tone?: BadgeTone
}

const props = withDefaults(defineProps<Props>(), { tone: 'neutral' })

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-gray-100 text-gray-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  error: 'bg-error-50 text-error-700',
  info: 'bg-blue-light-50 text-blue-light-700',
}

const cls = computed(() => [
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
  toneClasses[props.tone],
])
</script>

<template>
  <span :class="cls"><slot /></span>
</template>
