<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { apiFetch, mediaHlsUrl, mediaPosterUrl, mediaUrl } from '../../lib/http'
import type { MediaStatusResponse } from '../../lib/api-types'
import type { VideoPayload } from '../../lib/blocks'

const props = defineProps<{ content: Partial<VideoPayload> }>()
const { t, locale } = useI18n()

const videoEl = ref<HTMLVideoElement | null>(null)
const status = ref<MediaStatusResponse | null>(null)
const qualities = ref<{ index: number; label: string }[]>([])
const showTranscript = ref(false)
const qualitySelectId = useId()
let hls: import('hls.js').default | null = null

const externalSrc = computed(() => (props.content.assetId ? undefined : props.content.url))
const isYouTube = computed(() => !!externalSrc.value && /youtube\.com|youtu\.be/.test(externalSrc.value))
const embedUrl = computed(() => {
  if (!isYouTube.value || !externalSrc.value) return ''
  const idMatch = externalSrc.value.match(/(?:v=|youtu\.be\/)([\w-]+)/)
  return idMatch ? `https://www.youtube-nocookie.com/embed/${idMatch[1]}` : externalSrc.value
})
const posterUrl = computed(() =>
  props.content.assetId && status.value?.hasPoster ? mediaPosterUrl(props.content.assetId) : undefined,
)

/**
 * HLS is loaded on demand via a dynamic import so hls.js (~40KB gzip) never
 * lands in the initial bundle — only lesson pages that actually render a
 * transcoded video pay for it, keeping the CI bundle-size budget intact.
 */
async function attachHls(assetId: string): Promise<void> {
  const el = videoEl.value
  if (!el) return
  const url = mediaHlsUrl(assetId)

  if (el.canPlayType('application/vnd.apple.mpegurl')) {
    el.src = url
    return
  }

  const { default: Hls } = await import('hls.js')
  if (!Hls.isSupported()) {
    el.src = mediaUrl(assetId)
    return
  }

  hls = new Hls()
  hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
    qualities.value = data.levels.map((level, index) => ({
      index,
      label: level.height ? `${level.height}p` : `#${index}`,
    }))
  })
  hls.loadSource(url)
  hls.attachMedia(el)
}

async function setupPlayback(): Promise<void> {
  const assetId = props.content.assetId
  if (!assetId || !videoEl.value) return

  try {
    status.value = await apiFetch<MediaStatusResponse>(`/media/${assetId}/status`)
  } catch {
    status.value = null
  }

  if (status.value?.videoStatus === 'Ready') {
    await attachHls(assetId)
  } else {
    // Still processing, transcode failed, or predates the pipeline: fall
    // back to the original file as a plain progressive download so the
    // video stays watchable immediately.
    videoEl.value.src = mediaUrl(assetId)
  }
}

function onQualityChange(event: Event): void {
  const value = Number((event.target as HTMLSelectElement).value)
  if (hls) {
    hls.currentLevel = value
  }
}

onMounted(setupPlayback)
onBeforeUnmount(() => {
  hls?.destroy()
  hls = null
})
</script>

<template>
  <figure v-if="content.assetId || externalSrc" class="video-block">
    <iframe
      v-if="isYouTube"
      :src="embedUrl"
      class="video-block__frame"
      title="Video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    />
    <video
      v-else-if="content.assetId"
      ref="videoEl"
      class="video-block__native"
      controls
      preload="metadata"
      :poster="posterUrl"
    >
      <track
        v-if="content.subtitleAssetId"
        kind="subtitles"
        :src="mediaUrl(content.subtitleAssetId)"
        :srclang="locale"
        :label="locale.toUpperCase()"
        default
      />
    </video>
    <video v-else class="video-block__native" :src="externalSrc" controls preload="metadata" />

    <div v-if="qualities.length > 1" class="video-block__quality">
      <label :for="qualitySelectId">{{ t('lesson.videoQuality') }}</label>
      <select :id="qualitySelectId" @change="onQualityChange">
        <option value="-1">{{ t('lesson.videoQualityAuto') }}</option>
        <option v-for="q in qualities" :key="q.index" :value="q.index">{{ q.label }}</option>
      </select>
    </div>

    <figcaption v-if="content.caption">{{ content.caption }}</figcaption>

    <div v-if="content.transcript" class="video-block__transcript">
      <button type="button" class="video-block__transcript-toggle" @click="showTranscript = !showTranscript">
        {{ showTranscript ? t('lesson.hideTranscript') : t('lesson.showTranscript') }}
      </button>
      <p v-if="showTranscript" class="video-block__transcript-text">{{ content.transcript }}</p>
    </div>
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

.video-block__quality {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
}

.video-block__quality select {
  font: inherit;
  color: inherit;
}

.video-block figcaption {
  margin-top: var(--space-2);
  font-size: var(--font-size-caption);
  color: var(--color-text-muted);
  text-align: center;
}

.video-block__transcript {
  margin-top: var(--space-3);
}

.video-block__transcript-toggle {
  background: none;
  border: none;
  padding: 0;
  color: var(--module-1, var(--color-text));
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  text-decoration: underline;
  min-height: var(--min-touch-target);
}

.video-block__transcript-text {
  margin: var(--space-2) 0 0;
  font-size: 0.875rem;
  color: var(--color-text);
  white-space: pre-wrap;
}
</style>
