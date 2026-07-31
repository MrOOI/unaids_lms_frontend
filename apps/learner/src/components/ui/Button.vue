<script setup lang="ts">
/**
 * Button component — accessible button with loading and variant support.
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

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-2 text-theme-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm',
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300',
  secondary: 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:text-gray-300',
  danger: 'bg-error-500 text-white shadow-theme-xs hover:bg-error-600 disabled:bg-error-300',
  success: 'bg-success-500 text-white shadow-theme-xs hover:bg-success-600 disabled:bg-success-300',
}

const buttonClass = computed(() => [
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg font-medium transition',
  sizeClasses[props.size],
  variantClasses[props.variant],
  props.loading || props.disabled ? 'cursor-not-allowed opacity-70' : '',
])
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :class="buttonClass"
    :aria-label="ariaLabel || undefined"
    :aria-busy="props.loading"
  >
    <span
      v-if="loading"
      class="size-4 flex-shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
