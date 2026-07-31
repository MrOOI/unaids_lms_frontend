<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

withDefaults(defineProps<Props>(), { size: 'md' })
</script>

<template>
  <div class="ui-spinner-wrap" role="status">
    <span class="ui-spinner" :class="`ui-spinner--${size}`" aria-hidden="true" />
    <span v-if="label" class="ui-spinner-label">{{ label }}</span>
    <span v-else class="visually-hidden">Loading…</span>
  </div>
</template>

<style scoped>
.ui-spinner-wrap {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
}

.ui-spinner {
  display: inline-block;
  border: 3px solid var(--color-border);
  border-top-color: var(--module-primary, var(--color-focus));
  border-radius: 50%;
  animation: ui-spin 0.7s linear infinite;
}

.ui-spinner--sm {
  width: 16px;
  height: 16px;
  border-width: 2px;
}
.ui-spinner--md {
  width: 28px;
  height: 28px;
}
.ui-spinner--lg {
  width: 44px;
  height: 44px;
  border-width: 4px;
}

.ui-spinner-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

@keyframes ui-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
