<script setup lang="ts">
import { mediaUrl } from '../../lib/http'
import type { ImagePayload } from '../../lib/blocks'

const props = defineProps<{ content: Partial<ImagePayload> }>()
</script>

<template>
  <figure v-if="props.content.assetId" class="image-block">
    <img :src="mediaUrl(props.content.assetId)" :alt="props.content.altText || ''" loading="lazy" />
    <figcaption v-if="props.content.caption">{{ props.content.caption }}</figcaption>
  </figure>
</template>

<style scoped>
.image-block {
  margin: 0;
}

.image-block img {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  display: block;
}

.image-block figcaption {
  margin-top: var(--space-2);
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  text-align: center;
}
</style>
