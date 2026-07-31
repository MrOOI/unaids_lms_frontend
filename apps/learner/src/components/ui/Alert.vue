<script setup lang="ts">
/**
 * Alert component — displays messages with semantic types.
 * Supports error, success, warning, and info types with proper ARIA roles.
 */

import { ref, computed } from 'vue'

type AlertType = 'error' | 'success' | 'warning' | 'info'

interface Props {
  type?: AlertType
  dismissible?: boolean
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
})

const emit = defineEmits<{
  dismiss: []
}>()

const isVisible = ref(true)

const alertClass = computed(() => ({
  'alert': true,
  [`alert--${props.type}`]: true,
}))

const alertRole = computed(() => {
  switch (props.type) {
    case 'error':
    case 'warning':
      return 'alert'
    case 'success':
    case 'info':
    default:
      return 'status'
  }
})

function handleDismiss(): void {
  isVisible.value = false
  emit('dismiss')
}
</script>

<template>
  <div v-if="isVisible" :class="alertClass" :role="alertRole" :aria-live="props.type === 'error' ? 'assertive' : 'polite'">
    <div class="alert__content">
      <div v-if="title" class="alert__title">{{ title }}</div>
      <div class="alert__message">
        <slot />
      </div>
    </div>
    <button
      v-if="dismissible"
      type="button"
      class="alert__close"
      :aria-label="`Dismiss ${props.type} message`"
      @click="handleDismiss"
    >
      <span aria-hidden="true">×</span>
    </button>
  </div>
</template>

<style scoped>
.alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-md);
  border-left: 4px solid;
}

.alert__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.alert__title {
  font-weight: 600;
  font-size: 0.875rem;
}

.alert__message {
  font-size: 0.875rem;
  line-height: 1.5;
}

.alert__close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  transition: opacity 0.2s;
  border-radius: var(--radius-md);
}

.alert__close:hover {
  opacity: 0.7;
}

.alert__close:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: -2px;
}

/* Error state */
.alert--error {
  background: #fce8e6;
  border-color: var(--color-error);
  color: #8b1f16;
}

/* Success state */
.alert--success {
  background: #e6f4ea;
  border-color: var(--color-success);
  color: #0d652d;
}

/* Warning state */
.alert--warning {
  background: #fef7e0;
  border-color: #f9ab00;
  color: #7f6000;
}

/* Info state */
.alert--info {
  background: #e8f0fe;
  border-color: var(--color-focus);
  color: #1d4ed8;
}
</style>
