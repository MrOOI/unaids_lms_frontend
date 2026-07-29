<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { LOCALE_NAMES, SUPPORTED_LOCALES, type SupportedLocale } from '@lms/i18n'

const { locale, t } = useI18n()

function setLocale(code: SupportedLocale) {
  locale.value = code
  localStorage.setItem('lms-locale', code)
  document.documentElement.lang = code
}
</script>

<template>
  <nav :aria-label="t('a11y.languageSwitcher')" class="lang-switcher">
    <button
      v-for="code in SUPPORTED_LOCALES"
      :key="code"
      type="button"
      class="lang-switcher__btn"
      :class="{ 'lang-switcher__btn--active': locale === code }"
      :aria-pressed="locale === code"
      :lang="code"
      @click="setLocale(code)"
    >
      {{ LOCALE_NAMES[code] }}
    </button>
  </nav>
</template>

<style scoped>
.lang-switcher {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.lang-switcher__btn {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
}

.lang-switcher__btn--active {
  background: var(--color-text);
  color: var(--color-surface);
  border-color: var(--color-text);
}
</style>
