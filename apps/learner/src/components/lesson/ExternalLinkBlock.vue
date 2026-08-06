<script setup lang="ts">
import type { ExternalLinkPayload } from '../../lib/blocks'

defineProps<{ content: Partial<ExternalLinkPayload> }>()
</script>

<template>
  <a v-if="content.url" class="link-block" :href="content.url" target="_blank" rel="noopener noreferrer">
    <span class="link-block__icon" aria-hidden="true">↗</span>
    <span class="link-block__info">
      <span class="link-block__label">{{ content.label || content.url }}</span>
      <span v-if="content.description" class="link-block__desc">{{ content.description }}</span>
    </span>
  </a>
</template>

<style scoped>
.link-block {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text);
}

.link-block:hover {
  border-color: var(--module-1);
  background: var(--color-surface-alt);
}

.link-block__icon {
  font-size: 1.25rem;
  color: var(--module-1);
  flex-shrink: 0;
}

.link-block__info {
  display: flex;
  flex-direction: column;
}

.link-block__label {
  font-weight: 600;
}

.link-block__desc {
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}
</style>
