<script setup lang="ts">
import { computed } from 'vue'
import { mediaUrl } from '../../lib/http'
import type { VideoPayload } from '../../lib/blocks'

const props = defineProps<{ content: Partial<VideoPayload> }>()

const src = computed(() => (props.content.assetId ? mediaUrl(props.content.assetId) : props.content.url))
const isYouTube = computed(() => !!src.value && /youtube\.com|youtu\.be/.test(src.value))
const embedUrl = computed(() => {
  if (!isYouTube.value || !src.value) return ''
  const idMatch = src.value.match(/(?:v=|youtu\.be\/)([\w-]+)/)
  return idMatch ? `https://www.youtube-nocookie.com/embed/${idMatch[1]}` : src.value
})
</script>

<template>
  <figure v-if="src" class="video-block">
    <iframe
      v-if="isYouTube"
      :src="embedUrl"
      class="video-block__frame"
      title="Video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    />
    <video v-else class="video-block__native" :src="src" controls preload="metadata" />
    <figcaption v-if="content.caption">{{ content.caption }}</figcaption>
  </figure>
</template>

<style scoped>
.video-block {
  margin: 0;
}

.video-block__frame {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: none;
  border-radius: var(--radius-md);
}

.video-block__native {
  width: 100%;
  border-radius: var(--radius-md);
}

.video-block figcaption {
  margin-top: var(--space-2);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  text-align: center;
}
</style>
