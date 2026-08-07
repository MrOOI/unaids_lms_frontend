<script setup lang="ts">
/** CourseAdmin/SysAdmin: browse, search, and copy IDs for previously uploaded media (§13 gap — upload was write-only). */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminMedia } from '../../composables/useAdminMedia'
import { useToast } from '../../composables/useToast'
import { mediaPosterUrl, mediaUrl } from '../../lib/http'
import type { MediaAssetSummary } from '../../lib/api-types'
import Card from '../../components/ui/Card.vue'
import Button from '../../components/ui/Button.vue'
import Badge from '../../components/ui/Badge.vue'
import Spinner from '../../components/ui/Spinner.vue'

const { t, locale } = useI18n()
const adminMedia = useAdminMedia()
const toast = useToast()

const PAGE_SIZE = 30

const items = ref<MediaAssetSummary[]>([])
const totalCount = ref(0)
const page = ref(1)
const search = ref('')
const isFetching = ref(true)
const copiedId = ref<string | null>(null)

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)))

onMounted(load)

async function load(): Promise<void> {
  isFetching.value = true
  try {
    const result = await adminMedia.list(search.value.trim(), page.value, PAGE_SIZE)
    items.value = result.items
    totalCount.value = result.totalCount
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.loadFailed'))
  } finally {
    isFetching.value = false
  }
}

async function applySearch(): Promise<void> {
  page.value = 1
  await load()
}

async function goToPage(next: number): Promise<void> {
  if (next < 1 || next > totalPages.value) return
  page.value = next
  await load()
}

function isImage(item: MediaAssetSummary): boolean {
  return item.contentType.startsWith('image/')
}

function isVideo(item: MediaAssetSummary): boolean {
  return item.contentType === 'video/mp4'
}

function thumbnailUrl(item: MediaAssetSummary): string | null {
  if (isImage(item)) return mediaUrl(item.id)
  if (isVideo(item) && item.hasPoster) return mediaPosterUrl(item.id)
  return null
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(locale.value, { year: 'numeric', month: 'short', day: 'numeric' })
}

function videoStatusTone(status: string | null): 'success' | 'warning' | 'error' | 'neutral' {
  if (status === 'Ready') return 'success'
  if (status === 'Processing') return 'warning'
  if (status === 'Failed') return 'error'
  return 'neutral'
}

async function copyId(item: MediaAssetSummary): Promise<void> {
  try {
    await navigator.clipboard.writeText(item.id)
    copiedId.value = item.id
    setTimeout(() => {
      if (copiedId.value === item.id) copiedId.value = null
    }, 2000)
  } catch {
    toast.error(t('admin.media.copyFailed'))
  }
}
</script>

<template>
  <div class="admin-media">
    <div class="admin-page-header">
      <h1>{{ t('admin.media.title') }}</h1>
      <p class="admin-media__subtitle">{{ t('admin.media.subtitle') }}</p>
    </div>

    <Card>
      <form class="media-search" @submit.prevent="applySearch">
        <input v-model="search" type="text" class="admin-input" :placeholder="t('admin.media.searchPlaceholder')" />
        <Button type="submit" variant="secondary" :loading="isFetching">{{ t('common.search') }}</Button>
      </form>

      <div v-if="isFetching" class="media-loading"><Spinner :label="t('common.loading')" /></div>
      <p v-else-if="items.length === 0" class="media-empty">{{ t('admin.media.empty') }}</p>

      <div v-else class="media-grid">
        <div v-for="item in items" :key="item.id" class="media-card">
          <div class="media-card__thumb">
            <img v-if="thumbnailUrl(item)" :src="thumbnailUrl(item)!" :alt="item.originalFileName" loading="lazy" />
            <span v-else class="media-card__placeholder" aria-hidden="true">{{ item.contentType.split('/')[0] }}</span>
          </div>
          <div class="media-card__body">
            <p class="media-card__name" :title="item.originalFileName">{{ item.originalFileName }}</p>
            <p class="media-card__meta">
              {{ formatBytes(item.sizeBytes) }}
              <template v-if="item.width && item.height"> · {{ item.width }}×{{ item.height }}</template>
              · {{ formatDate(item.createdAt) }}
            </p>
            <p class="media-card__meta">{{ t('admin.media.uploadedBy', { name: item.uploadedByName }) }}</p>
            <Badge v-if="item.videoStatus" :tone="videoStatusTone(item.videoStatus)">
              {{ t(`admin.media.videoStatus.${item.videoStatus}`) }}
            </Badge>
          </div>
          <Button size="sm" variant="secondary" @click="copyId(item)">
            {{ copiedId === item.id ? t('admin.media.copied') : t('admin.media.copyId') }}
          </Button>
        </div>
      </div>

      <div v-if="!isFetching && items.length > 0" class="media-pagination">
        <Button variant="secondary" size="sm" :disabled="page <= 1" @click="goToPage(page - 1)">
          {{ t('common.back') }}
        </Button>
        <span class="media-pagination__label">{{ t('admin.auditLog.pageOf', { page, totalPages }) }}</span>
        <Button variant="secondary" size="sm" :disabled="page >= totalPages" @click="goToPage(page + 1)">
          {{ t('common.continue') }}
        </Button>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.admin-page-header {
  margin-bottom: var(--space-6);
}

.admin-page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.admin-media__subtitle {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted, #6b7280);
  font-size: 0.875rem;
}

.media-search {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.media-search .admin-input {
  flex: 1;
}

.admin-input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: inherit;
}

.media-loading,
.media-empty {
  padding: var(--space-8) 0;
  text-align: center;
  color: var(--color-text-muted, #6b7280);
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-4);
}

.media-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: var(--radius-md);
}

.media-card__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 10;
  background: var(--color-surface-alt, #f6f5f3);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.media-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-card__placeholder {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted, #6b7280);
}

.media-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.media-card__name {
  margin: 0;
  font-weight: 600;
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.media-card__meta {
  margin: 0;
  font-size: var(--font-size-caption, 0.8125rem);
  color: var(--color-text-muted, #6b7280);
}

.media-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-6);
}
</style>
