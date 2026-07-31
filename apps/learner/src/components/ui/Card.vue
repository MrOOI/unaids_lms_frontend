<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  padded?: boolean
}

withDefaults(defineProps<Props>(), { padded: true })
</script>

<template>
  <section class="ui-card" :class="{ 'ui-card--flush': !padded }">
    <header v-if="title || $slots.actions" class="ui-card__header">
      <div v-if="title" class="ui-card__heading">
        <h3 class="ui-card__title">{{ title }}</h3>
        <p v-if="subtitle" class="ui-card__subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="ui-card__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="ui-card__body">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="ui-card__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
.ui-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.ui-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.ui-card__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.ui-card__subtitle {
  margin: var(--space-1) 0 0 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.ui-card__actions {
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
}

.ui-card__body {
  padding: var(--space-6);
}

.ui-card--flush .ui-card__body {
  padding: 0;
}

.ui-card__footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-alt);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}
</style>
