<script setup lang="ts">
interface Props {
  title: string
  message?: string
  icon?: string
}
defineProps<Props>()
</script>

<template>
  <div class="ui-empty">
    <div v-if="icon" class="ui-empty__icon" aria-hidden="true">{{ icon }}</div>
    <p class="ui-empty__title">{{ title }}</p>
    <p v-if="message" class="ui-empty__message">{{ message }}</p>
    <div v-if="$slots.action" class="ui-empty__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.ui-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--space-2);
  padding: var(--space-8) var(--space-6);
  color: var(--color-text-muted);
}

.ui-empty__icon {
  font-size: 2rem;
  margin-bottom: var(--space-2);
}

.ui-empty__title {
  margin: 0;
  font-weight: 600;
  color: var(--color-text);
}

.ui-empty__message {
  margin: 0;
  font-size: 0.875rem;
  max-width: 32rem;
}

.ui-empty__action {
  margin-top: var(--space-3);
}
</style>
