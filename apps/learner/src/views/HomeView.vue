<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Placeholder module list until the Course API lands (Sprint 1–2).
// Colors come from the design tokens, identity is number + title (§8.3).
const modules = [0, 1, 2, 3, 4, 5]
</script>

<template>
  <h1>{{ t('app.courseName') }}</h1>
  <p>{{ t('module.ofTotal', { current: 0, total: modules.length }) }}</p>

  <ul class="module-grid">
    <li
      v-for="n in modules"
      :key="n"
      :data-module="n"
      class="module-card"
    >
      <span class="module-card__badge">{{ t('module.label', { number: n }) }}</span>
      <span class="module-card__status">{{ t('progress.notStarted') }}</span>
      <button type="button" class="module-card__cta">
        {{ t('common.continue') }}
      </button>
    </li>
  </ul>
</template>

<style scoped>
.module-grid {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: var(--space-4);
}

.module-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-6);
  background: var(--module-bg);
  border-top: 4px solid var(--module-primary);
  border-radius: var(--radius-lg);
}

.module-card__badge {
  font-weight: 700;
  color: var(--module-text);
}

.module-card__status {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.module-card__cta {
  align-self: flex-start;
  padding: var(--space-2) var(--space-6);
  border: none;
  border-radius: var(--radius-md);
  background: var(--module-text);
  color: #fff;
  font-weight: 600;
}
</style>
