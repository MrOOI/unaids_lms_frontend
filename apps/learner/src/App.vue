<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from './components/LanguageSwitcher.vue'

const { t } = useI18n()
</script>

<template>
  <a class="skip-link" href="#main">{{ t('a11y.skipToContent') }}</a>
  <header class="app-header">
    <div class="app-header__brand">
      <strong>{{ t('app.courseName') }}</strong>
      <span class="app-header__subtitle">{{ t('app.title') }}</span>
    </div>
    <LanguageSwitcher />
  </header>
  <main id="main">
    <RouterView />
  </main>
</template>

<style scoped>
.app-header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.app-header__brand {
  display: flex;
  flex-direction: column;
}

.app-header__subtitle {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

main {
  max-width: 72rem;
  margin: 0 auto;
  padding: var(--space-6);
}
</style>
