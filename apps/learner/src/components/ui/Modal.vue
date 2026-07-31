<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), { size: 'md' })
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

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
    <Transition name="modal-fade">
      <div v-if="modelValue" class="ui-modal-overlay" @mousedown.self="close">
        <div
          class="ui-modal"
          :class="`ui-modal--${size}`"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <header v-if="title || $slots.header" class="ui-modal__header">
            <slot name="header">
              <h2 class="ui-modal__title">{{ title }}</h2>
            </slot>
            <button type="button" class="ui-modal__close" aria-label="Close" @click="close">
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <div class="ui-modal__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="ui-modal__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ui-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 18, 14, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: var(--space-8) var(--space-4);
  overflow-y: auto;
  z-index: 1000;
}

.ui-modal {
  width: 100%;
  max-width: 32rem;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 4rem);
}

.ui-modal--sm {
  max-width: 24rem;
}
.ui-modal--lg {
  max-width: 48rem;
}

.ui-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.ui-modal__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
}

.ui-modal__close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  border-radius: var(--radius-md);
}

.ui-modal__close:hover {
  background: var(--color-surface-alt);
  color: var(--color-text);
}

.ui-modal__body {
  padding: var(--space-6);
  overflow-y: auto;
}

.ui-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-alt);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.15s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
