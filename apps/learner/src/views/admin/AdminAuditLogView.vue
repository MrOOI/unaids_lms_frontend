<script setup lang="ts">
/** SysAdmin: audit log (§17) — read-only, paged, filterable by action. */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuditLog } from '../../composables/useAuditLog'
import { useToast } from '../../composables/useToast'
import type { AuditLogEntryDto } from '../../lib/api-types'
import Card from '../../components/ui/Card.vue'
import Button from '../../components/ui/Button.vue'
import Spinner from '../../components/ui/Spinner.vue'

const { t, locale } = useI18n()
const auditLog = useAuditLog()
const toast = useToast()

const PAGE_SIZE = 50

const entries = ref<AuditLogEntryDto[]>([])
const totalCount = ref(0)
const page = ref(1)
const actionFilter = ref('')
const isFetching = ref(true)
const expandedId = ref<string | null>(null)

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)))

onMounted(load)

async function load(): Promise<void> {
  isFetching.value = true
  try {
    const result = await auditLog.getRecent(page.value, PAGE_SIZE, actionFilter.value.trim())
    entries.value = result.entries
    totalCount.value = result.totalCount
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.loadFailed'))
  } finally {
    isFetching.value = false
  }
}

async function applyFilter(): Promise<void> {
  page.value = 1
  await load()
}

async function goToPage(next: number): Promise<void> {
  if (next < 1 || next > totalPages.value) return
  page.value = next
  await load()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(locale.value, { dateStyle: 'medium', timeStyle: 'short' })
}

function toggleDetails(id: string): void {
  expandedId.value = expandedId.value === id ? null : id
}
</script>

<template>
  <div class="admin-audit-log">
    <div class="admin-page-header">
      <h1>{{ t('admin.auditLog.title') }}</h1>
    </div>

    <Card>
      <form class="audit-filter" @submit.prevent="applyFilter">
        <input
          v-model="actionFilter"
          type="text"
          class="admin-input"
          :placeholder="t('admin.auditLog.actionPlaceholder')"
        />
        <Button type="submit" variant="secondary" :loading="isFetching">{{ t('common.search') }}</Button>
      </form>

      <div v-if="isFetching" class="audit-loading"><Spinner :label="t('common.loading')" /></div>
      <p v-else-if="entries.length === 0" class="audit-empty">{{ t('admin.auditLog.empty') }}</p>

      <div v-else class="audit-table" role="table">
        <div class="audit-row audit-row--head" role="row">
          <span role="columnheader">{{ t('admin.auditLog.columns.when') }}</span>
          <span role="columnheader">{{ t('admin.auditLog.columns.actor') }}</span>
          <span role="columnheader">{{ t('admin.auditLog.columns.action') }}</span>
          <span role="columnheader">{{ t('admin.auditLog.columns.entity') }}</span>
        </div>

        <template v-for="entry in entries" :key="entry.id">
          <button type="button" class="audit-row audit-row--clickable" role="row" @click="toggleDetails(entry.id)">
            <span>{{ formatDate(entry.createdAt) }}</span>
            <span>{{ entry.actorName }}</span>
            <span class="mono">{{ entry.action }}</span>
            <span class="mono">{{ entry.entityType }}#{{ entry.entityId.slice(0, 8) }}</span>
          </button>
          <div v-if="expandedId === entry.id" class="audit-details">
            <pre>{{ entry.detailsJson }}</pre>
          </div>
        </template>
      </div>

      <div v-if="!isFetching && entries.length > 0" class="audit-pagination">
        <Button variant="secondary" size="sm" :disabled="page <= 1" @click="goToPage(page - 1)">
          {{ t('common.back') }}
        </Button>
        <span class="audit-pagination__label">{{ t('admin.auditLog.pageOf', { page, totalPages }) }}</span>
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

.audit-filter {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.audit-filter .admin-input {
  flex: 1;
  max-width: 320px;
}

.admin-input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: inherit;
}

.audit-loading {
  display: flex;
  justify-content: center;
  padding: var(--space-6);
}

.audit-empty {
  color: var(--color-text-muted);
  padding: var(--space-4) 0;
}

.audit-table {
  display: flex;
  flex-direction: column;
  overflow-x: auto;
}

.audit-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr 1.2fr;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
  min-width: 640px;
  text-align: left;
}

.audit-row--head {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  border-bottom-width: 2px;
}

.audit-row--clickable {
  background: none;
  border-left: none;
  border-right: none;
  border-top: none;
  cursor: pointer;
  width: 100%;
  font: inherit;
  color: inherit;
}

.audit-row--clickable:hover {
  background: var(--color-surface-alt);
}

.mono {
  font-family: var(--font-mono, monospace);
  font-size: 0.8125rem;
}

.audit-details {
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-alt);
  border-bottom: 1px solid var(--color-border);
}

.audit-details pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--font-mono, monospace);
  font-size: 0.8125rem;
}

.audit-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.audit-pagination__label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
</style>
