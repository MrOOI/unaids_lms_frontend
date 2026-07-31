<script setup lang="ts">
/**
 * Alert component — displays messages with semantic types.
 * Supports error, success, warning, and info types with proper ARIA roles.
 */
import { computed, ref } from 'vue'
import { SuccessIcon, ErrorIcon, WarningIcon, InfoCircleIcon } from '../../icons'

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

const variants: Record<AlertType, { container: string; icon: string }> = {
  success: { container: 'border-success-500 bg-success-50', icon: 'text-success-500' },
  error: { container: 'border-error-500 bg-error-50', icon: 'text-error-500' },
  warning: { container: 'border-warning-500 bg-warning-50', icon: 'text-warning-500' },
  info: { container: 'border-blue-light-500 bg-blue-light-50', icon: 'text-blue-light-500' },
}

const icons: Record<AlertType, object> = {
  success: SuccessIcon,
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoCircleIcon,
}

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
  <div
    v-if="isVisible"
    class="flex items-start gap-3 rounded-xl border p-4"
    :class="variants[type].container"
    :role="alertRole"
    :aria-live="props.type === 'error' ? 'assertive' : 'polite'"
  >
    <div class="-mt-0.5 flex-shrink-0" :class="variants[type].icon">
      <component :is="icons[type]" class="size-5" />
    </div>

    <div class="flex-1">
      <p v-if="title" class="mb-1 text-sm font-semibold text-gray-800">{{ title }}</p>
      <div class="text-sm text-gray-600">
        <slot />
      </div>
    </div>

    <button
      v-if="dismissible"
      type="button"
      class="-m-1 flex-shrink-0 rounded-md p-1 text-gray-400 hover:bg-black/5 hover:text-gray-600"
      :aria-label="`Dismiss ${props.type} message`"
      @click="handleDismiss"
    >
      <span aria-hidden="true" class="block text-lg leading-none">&times;</span>
    </button>
  </div>
</template>
