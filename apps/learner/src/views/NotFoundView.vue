<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Button from '../components/ui/Button.vue'

const { t } = useI18n()
</script>

<template>
  <div class="status-page">
    <div class="status-card">
      <p class="status-code">404</p>
      <h1>{{ t('errors.notFound.title') }}</h1>
      <p>{{ t('errors.notFound.message') }}</p>
      <RouterLink :to="{ name: 'home' }"><Button variant="primary">{{ t('errors.backHome') }}</Button></RouterLink>
    </div>
  </div>
</template>

<style scoped>
.status-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-6);
  background: var(--color-surface-alt);
}

.status-card {
  text-align: center;
  max-width: 28rem;
}

.status-code {
  margin: 0;
  font-size: 4rem;
  font-weight: 800;
  color: var(--module-1);
}

.status-card h1 {
  margin: var(--space-2) 0;
  font-size: 1.5rem;
  color: var(--color-text);
}

.status-card p {
  margin: 0 0 var(--space-6) 0;
  color: var(--color-text-muted);
}
</style>
