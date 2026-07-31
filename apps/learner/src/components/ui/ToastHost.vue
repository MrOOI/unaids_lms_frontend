<script setup lang="ts">
import { useToast } from '../../composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="ui-toast-host" role="region" aria-label="Notifications">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="ui-toast"
          :class="`ui-toast--${toast.tone}`"
          role="status"
        >
          <span>{{ toast.message }}</span>
          <button type="button" class="ui-toast__close" aria-label="Dismiss" @click="dismiss(toast.id)">×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.ui-toast-host {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  z-index: 1100;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-width: min(24rem, calc(100vw - 2rem));
}

.ui-toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.ui-toast--success {
  background: #0d652d;
  color: #fff;
}
.ui-toast--error {
  background: #8b1f16;
  color: #fff;
}
.ui-toast--info {
  background: var(--color-text);
  color: var(--color-surface);
}

.ui-toast__close {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: inherit;
  font-size: 1.125rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0.8;
}
.ui-toast__close:hover {
  opacity: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 640px) {
  .ui-toast-host {
    right: var(--space-4);
    bottom: var(--space-4);
    left: var(--space-4);
    max-width: none;
  }
}
</style>
