<script setup lang="ts">
import { computed } from 'vue'

type BadgeTone = 'neutral' | 'success' | 'warning' | 'error' | 'info'

interface Props {
  tone?: BadgeTone
}

const props = withDefaults(defineProps<Props>(), { tone: 'neutral' })

const cls = computed(() => `ui-badge ui-badge--${props.tone}`)
</script>

<template>
  <span :class="cls"><slot /></span>
</template>

<style scoped>
.ui-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 0.1875rem var(--space-3);
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}

.ui-badge--neutral {
  background: var(--color-surface-alt);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}

.ui-badge--success {
  background: #e6f4ea;
  color: #0d652d;
}

.ui-badge--warning {
  background: #fef7e0;
  color: #7f6000;
}

.ui-badge--error {
  background: #fce8e6;
  color: #8b1f16;
}

.ui-badge--info {
  background: #e8f0fe;
  color: #1d4ed8;
}
</style>
