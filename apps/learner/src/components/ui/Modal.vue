<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), { size: 'md' })
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

function close(): void {
  emit('update:modelValue', false)
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.modelValue) close()
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown))

watch(
  () => props.modelValue,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-gray-900/50 px-4 py-8"
        @mousedown.self="close"
      >
        <div
          class="flex max-h-[calc(100vh-4rem)] w-full flex-col rounded-2xl bg-white shadow-theme-lg"
          :class="sizeClasses[size]"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <header v-if="title || $slots.header" class="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
            <slot name="header">
              <h2 class="text-lg font-semibold text-gray-800">{{ title }}</h2>
            </slot>
            <button
              type="button"
              class="-m-1 flex-shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
              @click="close"
            >
              <span aria-hidden="true" class="block text-xl leading-none">&times;</span>
            </button>
          </header>
          <div class="overflow-y-auto p-6">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="flex justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50 px-6 py-4">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
