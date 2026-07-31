<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { KeyMessagePayload } from '../../lib/blocks'

defineProps<{ content: Partial<KeyMessagePayload> }>()
const { t } = useI18n()
</script>

<template>
  <div v-if="content.html" class="key-message" role="note">
    <span class="key-message__badge">{{ t('lesson.keyMessage') }}</span>
    <div class="key-message__body" v-html="content.html" />
  </div>
</template>

<style scoped>
.key-message {
  padding: var(--space-5) var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--module-bg, var(--color-surface-alt));
  border-left: 5px solid var(--module-primary, var(--color-focus));
}

.key-message__badge {
  display: inline-block;
  margin-bottom: var(--space-3);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--module-text, var(--color-text));
}

.key-message__body {
  color: var(--color-text);
  line-height: 1.7;
}

.key-message__body :deep(p:last-child) {
  margin-bottom: 0;
}
</style>
