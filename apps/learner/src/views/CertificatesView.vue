<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useCertificates } from '../composables/useCertificates'
import { useToast } from '../composables/useToast'
import type { CertificateSummaryDto } from '../lib/api-types'
import Card from '../components/ui/Card.vue'
import Badge from '../components/ui/Badge.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import Spinner from '../components/ui/Spinner.vue'
import Button from '../components/ui/Button.vue'

const { t, locale } = useI18n()
const router = useRouter()
const { fetchMyCertificates, downloadPdf } = useCertificates()
const toast = useToast()

const isLoading = ref(true)
const certificates = ref<CertificateSummaryDto[]>([])
const downloadingId = ref<string | null>(null)

onMounted(async () => {
  try {
    certificates.value = await fetchMyCertificates()
  } catch {
    certificates.value = []
  } finally {
    isLoading.value = false
  }
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(locale.value, { year: 'numeric', month: 'long', day: 'numeric' })
}

async function handleDownload(cert: CertificateSummaryDto): Promise<void> {
  downloadingId.value = cert.id
  try {
    await downloadPdf(cert.id, `${cert.certificateNumber}.pdf`)
  } catch {
    toast.error(t('certificates.downloadFailed'))
  } finally {
    downloadingId.value = null
  }
}
</script>

<template>
  <div class="certificates-view">
    <div class="certificates-header">
      <h1>{{ t('certificates.title') }}</h1>
      <p>{{ t('certificates.subtitle') }}</p>
    </div>

    <div class="certificates-body">
      <div v-if="isLoading" class="certificates-loading"><Spinner :label="t('common.loading')" /></div>

      <EmptyState
        v-else-if="certificates.length === 0"
        icon="🎓"
        :title="t('certificates.empty.title')"
        :message="t('certificates.empty.message')"
      >
        <template #action>
          <Button variant="secondary" @click="router.push({ name: 'certificate-verify' })">
            {{ t('certificates.verifyLink') }}
          </Button>
        </template>
      </EmptyState>

      <div v-else class="certificate-list">
        <Card v-for="cert in certificates" :key="cert.id">
          <div class="certificate-row">
            <div class="certificate-info">
              <p class="certificate-course">{{ cert.courseTitle }}</p>
              <p class="certificate-meta">
                {{ t('certificates.list.number') }}: <span class="mono">{{ cert.certificateNumber }}</span>
                &nbsp;·&nbsp;
                {{ t('certificates.list.issuedOn') }}: {{ formatDate(cert.issuedAt) }}
              </p>
            </div>
            <div class="certificate-actions">
              <Badge :tone="cert.isRevoked ? 'error' : 'success'">
                {{ cert.isRevoked ? t('certificates.list.revoked') : t('certificates.list.valid') }}
              </Badge>
              <Button
                v-if="!cert.isRevoked"
                variant="secondary"
                :loading="downloadingId === cert.id"
                @click="handleDownload(cert)"
              >
                {{ t('certificates.list.download') }}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.certificates-view {
  min-height: 100%;
}

.certificates-header {
  padding: var(--space-8);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.certificates-header h1 {
  margin: 0 0 var(--space-2) 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
}

.certificates-header p {
  margin: 0;
  color: var(--color-text-muted);
}

.certificates-body {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-8);
}

.certificates-loading {
  display: flex;
  justify-content: center;
  padding: var(--space-8);
}

.certificate-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.certificate-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.certificate-course {
  margin: 0 0 var(--space-1) 0;
  font-weight: 600;
  color: var(--color-text);
}

.certificate-meta {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.certificate-meta .mono {
  font-family: var(--font-mono, monospace);
}

.certificate-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}
</style>
