<script setup lang="ts">
import { computed } from 'vue'
import { mediaUrl } from '../../lib/http'
import type { AudioPayload } from '../../lib/blocks'

const props = defineProps<{ content: Partial<AudioPayload> }>()
const src = computed(() => (props.content.assetId ? mediaUrl(props.content.assetId) : props.content.url))
</script>

<template>
  <figure v-if="src" class="audio-block">
    <audio :src="src" controls preload="metadata" />
    <figcaption v-if="content.caption">{{ content.caption }}</figcaption>
  </figure>
</template>

<style scoped>
.audio-block {
  margin: 0;
}

.audio-block audio {
  width: 100%;
}

.audio-block figcaption {
  margin-top: var(--space-2);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
</style>
