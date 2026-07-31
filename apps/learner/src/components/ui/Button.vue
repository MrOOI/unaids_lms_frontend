<script setup lang="ts">
/**
 * Button component — accessible button with loading and variant support.
 * Follows UNAIDS design system with module colors.
 */

import { computed } from 'vue'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
})

const buttonClass = computed(() => ({
  'btn': true,
  [`btn--${props.variant}`]: true,
  [`btn--${props.size}`]: true,
  'btn--loading': props.loading,
  'btn--disabled': props.disabled,
}))
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :class="buttonClass"
    :aria-label="ariaLabel || undefined"
    :aria-busy="props.loading"
  >
    <span class="btn__content">
      <span v-if="loading" class="btn__spinner" aria-hidden="true" />
      <slot />
    </span>
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-6);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.875rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-height: var(--min-touch-target);
  user-select: none;
}

/* Primary variant (default) */
.btn--primary {
  background: var(--module-1);
  color: #fff;
}

.btn--primary:hover:not(:disabled) {
  background: var(--module-1-accessible);
}

.btn--primary:active:not(:disabled) {
  transform: scale(0.98);
}

/* Secondary variant */
.btn--secondary {
  background: var(--color-surface-alt);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn--secondary:hover:not(:disabled) {
  background: var(--color-border);
}

.btn--secondary:active:not(:disabled) {
  transform: scale(0.98);
}

/* Danger variant */
.btn--danger {
  background: var(--color-error);
  color: #fff;
}

.btn--danger:hover:not(:disabled) {
  background: #8b1f16;
}

.btn--danger:active:not(:disabled) {
  transform: scale(0.98);
}

/* Success variant */
.btn--success {
  background: var(--color-success);
  color: #fff;
}

.btn--success:hover:not(:disabled) {
  background: #155d3b;
}

.btn--success:active:not(:disabled) {
  transform: scale(0.98);
}

/* Size variants */
.btn--sm {
  padding: var(--space-2) var(--space-4);
  font-size: 0.75rem;
}

.btn--lg {
  padding: var(--space-4) var(--space-8);
  font-size: 1rem;
}

/* Loading state */
.btn--loading {
  position: relative;
  color: transparent;
}

.btn__content {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.btn__spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Disabled state */
.btn:disabled,
.btn--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Focus visible for keyboard navigation */
.btn:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

/* Responsive */
@media (max-width: 640px) {
  .btn {
    padding: var(--space-2) var(--space-4);
    font-size: 0.875rem;
  }
}
</style>
