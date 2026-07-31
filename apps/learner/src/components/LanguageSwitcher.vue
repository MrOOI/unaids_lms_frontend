<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { LOCALE_NAMES, SUPPORTED_LOCALES, type SupportedLocale } from '@lms/i18n'

interface Props {
  compact?: boolean
}
defineProps<Props>()

const { locale, t } = useI18n()
const open = ref(false)

function setLocale(code: SupportedLocale) {
  locale.value = code
  localStorage.setItem('lms-locale', code)
  document.documentElement.lang = code
  open.value = false
}
</script>

<template>
  <nav v-if="!compact" :aria-label="t('a11y.languageSwitcher')" class="lang-switcher">
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

  <div v-else class="lang-compact" @mouseleave="open = false">
    <button
      type="button"
      class="lang-compact__trigger"
      :aria-expanded="open"
      :aria-label="t('a11y.languageSwitcher')"
      @click="open = !open"
    >
      {{ locale.toUpperCase() }}
    </button>
    <div v-if="open" class="lang-compact__menu" role="menu">
      <button
        v-for="code in SUPPORTED_LOCALES"
        :key="code"
        type="button"
        role="menuitemradio"
        class="lang-compact__item"
        :class="{ 'lang-compact__item--active': locale === code }"
        :aria-checked="locale === code"
        :lang="code"
        @click="setLocale(code)"
      >
        {{ LOCALE_NAMES[code] }}
      </button>
    </div>
  </div>
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

.lang-compact {
  position: relative;
}

.lang-compact__trigger {
  min-width: 44px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.03em;
}

.lang-compact__trigger:hover {
  background: var(--color-surface-alt);
}

.lang-compact__menu {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  min-width: 160px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 50;
}

.lang-compact__item {
  display: block;
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: none;
  background: transparent;
  text-align: left;
  color: var(--color-text);
  font-size: 0.875rem;
  cursor: pointer;
}

.lang-compact__item:hover {
  background: var(--color-surface-alt);
}

.lang-compact__item--active {
  font-weight: 700;
  color: var(--module-1-accessible);
}
</style>
