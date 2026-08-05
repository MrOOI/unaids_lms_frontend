<script setup lang="ts">
/** Lesson view — renders every content-block type and tracks completion. */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCourses } from '../composables/useCourses'
import { useProgress } from '../composables/useProgress'
import { ApiError } from '../lib/http'
import { parsePayload } from '../lib/blocks'
import type {
  AudioPayload,
  ExternalLinkPayload,
  FileAttachmentPayload,
  ImagePayload,
  KeyMessagePayload,
  RichTextPayload,
  VideoPayload,
} from '../lib/blocks'
import Button from '../components/ui/Button.vue'
import Alert from '../components/ui/Alert.vue'
import Spinner from '../components/ui/Spinner.vue'
import RichTextBlock from '../components/lesson/RichTextBlock.vue'
import ImageBlock from '../components/lesson/ImageBlock.vue'
import VideoBlock from '../components/lesson/VideoBlock.vue'
import AudioBlock from '../components/lesson/AudioBlock.vue'
import FileAttachmentBlock from '../components/lesson/FileAttachmentBlock.vue'
import ExternalLinkBlock from '../components/lesson/ExternalLinkBlock.vue'
import KeyMessageBlock from '../components/lesson/KeyMessageBlock.vue'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { currentLesson, isLoading, error, fetchLesson, clearError } = useCourses()
const { completeLesson, saveStatusFor, error: progressError, clearError: clearProgressError } = useProgress()

const lessonId = computed(() => route.params.lessonId as string)
const courseSlug = computed(() => route.params.slug as string)
const isCompleting = ref(false)
const notEnrolled = ref(false)
const saveStatus = computed(() => saveStatusFor(lessonId.value))
const isLessonCompleted = computed(() => saveStatus.value === 'saved')
const isQueuedOffline = computed(() => saveStatus.value === 'queued')

onMounted(async () => {
  try {
    await fetchLesson(lessonId.value, locale.value)
  } catch {
    // surfaced via `error`
  }
})

async function handleCompleteLesson(): Promise<void> {
  clearProgressError()
  notEnrolled.value = false
  isCompleting.value = true
  try {
    await completeLesson(lessonId.value)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notEnrolled.value = true
    }
  } finally {
    isCompleting.value = false
  }
}
</script>

<template>
  <div class="lesson-view">
    <div class="lesson-header">
      <button type="button" class="back-button" @click="router.push({ name: 'course-detail', params: { slug: courseSlug } })">
        ← {{ t('common.back') }}
      </button>
    </div>

    <Alert v-if="error" type="error" dismissible @dismiss="clearError">{{ error }}</Alert>
    <Alert v-if="progressError" type="error" dismissible @dismiss="clearProgressError">{{ progressError }}</Alert>
    <Alert v-if="notEnrolled" type="warning">{{ t('lesson.notEnrolled') }}</Alert>
    <Alert v-if="isLessonCompleted" type="success">{{ t('lesson.completed') }}</Alert>
    <Alert v-if="isQueuedOffline" type="info">{{ t('lesson.completedOffline') }}</Alert>

    <div v-if="isLoading && !currentLesson" class="lesson-loading">
      <Spinner :label="t('common.loading')" />
    </div>

    <article v-else-if="currentLesson" class="lesson-content" :data-module="currentLesson.themeNumber">
      <header class="lesson-intro">
        <span class="lesson-module-badge">{{ t('module.label', { number: currentLesson.moduleNumber }) }}</span>
        <h1>{{ currentLesson.title }}</h1>
        <p v-if="currentLesson.intro">{{ currentLesson.intro }}</p>
        <div class="lesson-meta">
          <span class="estimated-time">
            {{ t('lesson.estimatedTime', { minutes: currentLesson.estimatedMinutes }) }}
          </span>
        </div>
      </header>

      <div class="lesson-blocks">
        <div v-for="block in currentLesson.blocks" :key="block.id" class="lesson-block">
          <RichTextBlock v-if="block.type === 'RichText'" :content="parsePayload<RichTextPayload>(block.payloadJson)" />
          <KeyMessageBlock v-else-if="block.type === 'KeyMessage'" :content="parsePayload<KeyMessagePayload>(block.payloadJson)" />
          <ImageBlock v-else-if="block.type === 'Image'" :content="parsePayload<ImagePayload>(block.payloadJson)" />
          <VideoBlock v-else-if="block.type === 'Video'" :content="parsePayload<VideoPayload>(block.payloadJson)" />
          <AudioBlock v-else-if="block.type === 'Audio'" :content="parsePayload<AudioPayload>(block.payloadJson)" />
          <FileAttachmentBlock
            v-else-if="block.type === 'FileAttachment'"
            :content="parsePayload<FileAttachmentPayload>(block.payloadJson)"
          />
          <ExternalLinkBlock
            v-else-if="block.type === 'ExternalLink'"
            :content="parsePayload<ExternalLinkPayload>(block.payloadJson)"
          />
        </div>
      </div>

      <footer class="lesson-footer">
        <Button type="button" variant="primary" size="lg" :loading="isCompleting" @click="handleCompleteLesson">
          {{ t('lesson.markComplete') }}
        </Button>
        <span v-if="saveStatus === 'saving'" class="save-status">{{ t('common.saving') }}</span>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.lesson-view {
  min-height: 100%;
}

.lesson-header {
  padding: var(--space-4) var(--space-8);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.back-button {
  display: inline-block;
  padding: var(--space-2) var(--space-4);
  border: none;
  background: transparent;
  color: var(--module-1);
  font-weight: 600;
  cursor: pointer;
}

.back-button:hover {
  color: var(--module-1-accessible);
}

.lesson-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.lesson-content {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-8);
}

.lesson-intro {
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-6);
  border-bottom: 2px solid var(--color-border);
}

.lesson-module-badge {
  display: inline-block;
  margin-bottom: var(--space-2);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--module-text, var(--color-text-muted));
}

.lesson-intro h1 {
  margin: 0 0 var(--space-2) 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
}

.lesson-intro p {
  margin: 0 0 var(--space-4) 0;
  font-size: 1.0625rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.lesson-meta {
  display: flex;
  gap: var(--space-4);
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.lesson-blocks {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

.lesson-block:empty {
  display: none;
}

.lesson-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border);
}

.save-status {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

@media (max-width: 640px) {
  .lesson-header {
    padding: var(--space-4);
  }

  .lesson-content {
    padding: var(--space-4);
  }

  .lesson-intro h1 {
    font-size: 1.5rem;
  }

  .lesson-blocks {
    gap: var(--space-4);
  }
}
</style>
