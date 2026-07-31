<script setup lang="ts">
import { useToast } from '../../composables/useToast'

const { toasts, dismiss } = useToast()

const toneClasses: Record<string, string> = {
  success: 'bg-success-600 text-white',
  error: 'bg-error-600 text-white',
  info: 'bg-gray-800 text-white',
}
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-x-4 bottom-4 z-[1100] flex flex-col gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-w-[min(24rem,calc(100vw-2rem))]"
      role="region"
      aria-label="Notifications"
    >
      <TransitionGroup
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        leave-active-class="transition duration-200 ease-in absolute"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-center justify-between gap-4 rounded-xl px-4 py-3 text-sm font-medium shadow-theme-lg"
          :class="toneClasses[toast.tone]"
          role="status"
        >
          <span>{{ toast.message }}</span>
          <button
            type="button"
            class="flex-shrink-0 text-lg leading-none opacity-80 hover:opacity-100"
            aria-label="Dismiss"
            @click="dismiss(toast.id)"
          >
            &times;
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
