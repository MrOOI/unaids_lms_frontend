<script setup lang="ts">
import { mediaUrl } from '../../lib/http'
import type { FileAttachmentPayload } from '../../lib/blocks'

defineProps<{ content: Partial<FileAttachmentPayload> }>()

function formatSize(bytes: number | undefined): string {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }
  return `${value.toFixed(value < 10 && unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`
}
</script>

<template>
  <a
    v-if="content.assetId"
    class="file-block"
    :href="mediaUrl(content.assetId)"
    :download="content.fileName || true"
    target="_blank"
    rel="noopener"
  >
    <span class="file-block__icon" aria-hidden="true">📎</span>
    <span class="file-block__info">
      <span class="file-block__name">{{ content.fileName || 'Download file' }}</span>
      <span v-if="content.sizeBytes" class="file-block__size">{{ formatSize(content.sizeBytes) }}</span>
    </span>
  </a>
</template>

<style scoped>
.file-block {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
  text-decoration: none;
  color: var(--color-text);
  max-width: 100%;
}

.file-block:hover {
  border-color: var(--module-1);
}

.file-block__icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.file-block__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.file-block__name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-block__size {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
</style>
