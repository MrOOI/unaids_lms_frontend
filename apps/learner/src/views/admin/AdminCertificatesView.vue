<script setup lang="ts">
/**
 * Certificate registry (§6.5, §15): search, reissue (name-typo fix), revoke.
 * Plus a standalone verify-by-code lookup for support workflows where only
 * the code printed on the certificate is on hand.
 */
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCertificates } from '../../composables/useCertificates'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import type { CertificateAdminSummaryDto } from '../../lib/api-types'
import Card from '../../components/ui/Card.vue'
import Button from '../../components/ui/Button.vue'
import Badge from '../../components/ui/Badge.vue'
import Alert from '../../components/ui/Alert.vue'
import FormField from '../../components/form/FormField.vue'
import Spinner from '../../components/ui/Spinner.vue'

const { t, locale } = useI18n()
const certs = useCertificates()
const toast = useToast()
const { confirm } = useConfirm()

const isLoadingRegistry = ref(true)
const registry = ref<CertificateAdminSummaryDto[]>([])
const searchQuery = ref('')

const editingReissueId = ref<string | null>(null)
const reissueName = ref('')
const isSavingReissue = ref(false)

const editingRevokeId = ref<string | null>(null)
const revokeReason = ref('')
const isRevoking = ref(false)

const verifyCode = ref('')

async function loadRegistry(): Promise<void> {
  isLoadingRegistry.value = true
  try {
    registry.value = await certs.listForAdmin(searchQuery.value.trim() || undefined)
  } catch {
    toast.error(t('admin.errors.loadFailed'))
  } finally {
    isLoadingRegistry.value = false
  }
}

onMounted(loadRegistry)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(locale.value, { year: 'numeric', month: 'short', day: 'numeric' })
}

function startReissue(row: CertificateAdminSummaryDto): void {
  editingRevokeId.value = null
  editingReissueId.value = row.id
  reissueName.value = row.learnerName
}

function cancelReissue(): void {
  editingReissueId.value = null
  reissueName.value = ''
}

async function saveReissue(row: CertificateAdminSummaryDto): Promise<void> {
  const corrected = reissueName.value.trim()
  if (!corrected || corrected === row.learnerName) {
    cancelReissue()
    return
  }

  isSavingReissue.value = true
  try {
    await certs.reissue(row.id, corrected)
    row.learnerName = corrected
    toast.success(t('admin.certificates.reissueSuccess'))
    cancelReissue()
  } catch {
    toast.error(t('admin.errors.saveFailed'))
  } finally {
    isSavingReissue.value = false
  }
}

function startRevoke(row: CertificateAdminSummaryDto): void {
  editingReissueId.value = null
  editingRevokeId.value = row.id
  revokeReason.value = ''
}

function cancelRevoke(): void {
  editingRevokeId.value = null
  revokeReason.value = ''
}

async function confirmRevoke(row: CertificateAdminSummaryDto): Promise<void> {
  const confirmed = await confirm({
    title: t('admin.certificates.revokeConfirmTitle'),
    message: t('admin.certificates.revokeConfirmMessage'),
    confirmLabel: t('admin.certificates.revoke'),
    danger: true,
  })
  if (!confirmed) return

  isRevoking.value = true
  try {
    await certs.revoke(row.id, revokeReason.value.trim())
    row.isRevoked = true
    row.revocationReason = revokeReason.value.trim() || null
    toast.success(t('admin.certificates.revoked'))
    cancelRevoke()
  } catch {
    toast.error(t('admin.errors.saveFailed'))
  } finally {
    isRevoking.value = false
  }
}

async function handleVerify(): Promise<void> {
  if (!verifyCode.value.trim()) return
  try {
    await certs.verify(verifyCode.value.trim())
  } catch {
    // surfaced via certs.error
  }
}
</script>

<template>
  <div class="admin-certificates">
    <div class="admin-page-header">
      <h1>{{ t('admin.certificates.title') }}</h1>
    </div>

    <Card :title="t('admin.certificates.registryTitle')" class="registry-card">
      <form class="registry-search" @submit.prevent="loadRegistry">
        <input
          v-model="searchQuery"
          type="text"
          class="admin-input"
          :placeholder="t('admin.certificates.searchPlaceholder')"
        />
        <Button type="submit" variant="secondary" :loading="isLoadingRegistry">{{ t('common.search') }}</Button>
      </form>

      <div v-if="isLoadingRegistry" class="registry-loading"><Spinner :label="t('common.loading')" /></div>

      <p v-else-if="registry.length === 0" class="registry-empty">{{ t('admin.certificates.noResults') }}</p>

      <div v-else class="registry-table" role="table">
        <div class="registry-row registry-row--head" role="row">
          <span role="columnheader">{{ t('admin.certificates.columns.number') }}</span>
          <span role="columnheader">{{ t('admin.certificates.columns.learner') }}</span>
          <span role="columnheader">{{ t('admin.certificates.columns.course') }}</span>
          <span role="columnheader">{{ t('admin.certificates.columns.issuedOn') }}</span>
          <span role="columnheader">{{ t('admin.certificates.columns.status') }}</span>
          <span role="columnheader">{{ t('admin.certificates.columns.actions') }}</span>
        </div>

        <div v-for="row in registry" :key="row.id" class="registry-row" role="row">
          <span class="mono">{{ row.certificateNumber }}</span>

          <span v-if="editingReissueId !== row.id">{{ row.learnerName }}</span>
          <div v-else class="inline-edit">
            <input v-model="reissueName" type="text" class="admin-input admin-input--compact" />
            <Button size="sm" :loading="isSavingReissue" @click="saveReissue(row)">{{ t('common.save') }}</Button>
            <Button size="sm" variant="secondary" @click="cancelReissue">{{ t('common.cancel') }}</Button>
          </div>

          <span>{{ row.courseTitle }}</span>
          <span>{{ formatDate(row.issuedAt) }}</span>

          <span>
            <Badge :tone="row.isRevoked ? 'error' : 'success'">
              {{ row.isRevoked ? t('certificates.list.revoked') : t('certificates.list.valid') }}
            </Badge>
          </span>

          <div v-if="row.isRevoked" class="registry-actions">
            <span class="registry-revocation-reason" :title="row.revocationReason ?? ''">
              {{ row.revocationReason || '—' }}
            </span>
          </div>
          <div v-else-if="editingRevokeId === row.id" class="inline-edit">
            <input
              v-model="revokeReason"
              type="text"
              class="admin-input admin-input--compact"
              :placeholder="t('admin.certificates.reason')"
            />
            <Button size="sm" variant="danger" :loading="isRevoking" @click="confirmRevoke(row)">
              {{ t('admin.certificates.revoke') }}
            </Button>
            <Button size="sm" variant="secondary" @click="cancelRevoke">{{ t('common.cancel') }}</Button>
          </div>
          <div v-else-if="editingReissueId !== row.id" class="registry-actions">
            <Button size="sm" variant="secondary" @click="startReissue(row)">
              {{ t('admin.certificates.reissue') }}
            </Button>
            <Button size="sm" variant="danger" @click="startRevoke(row)">
              {{ t('admin.certificates.revoke') }}
            </Button>
          </div>
        </div>
      </div>
    </Card>

    <Card :title="t('admin.certificates.lookupTitle')" class="lookup-card">
      <div class="admin-form">
        <FormField :label="t('certificates.verify.codeLabel')">
          <input v-model="verifyCode" type="text" class="admin-input" />
        </FormField>
        <div class="admin-form__actions">
          <Button variant="secondary" :loading="certs.isLoading.value" @click="handleVerify">
            {{ t('certificates.verify.submit') }}
          </Button>
        </div>

        <Alert v-if="certs.error.value" type="error">{{ certs.error.value }}</Alert>
        <Alert v-else-if="certs.verification.value?.valid" type="success">
          <p>{{ t('certificates.verify.learner') }}: {{ certs.verification.value.learnerName }}</p>
          <p>{{ t('certificates.verify.course') }}: {{ certs.verification.value.courseName }}</p>
          <p>
            {{ t('certificates.verify.issuedOn') }}:
            {{ certs.verification.value.issuedAt ? new Date(certs.verification.value.issuedAt).toLocaleDateString(locale) : '' }}
          </p>
        </Alert>
        <Alert v-else-if="certs.verification.value" type="error">{{ t('certificates.verify.invalid') }}</Alert>
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

.registry-card {
  margin-bottom: var(--space-6);
}

.registry-search {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.registry-search .admin-input {
  flex: 1;
}

.registry-loading {
  display: flex;
  justify-content: center;
  padding: var(--space-6);
}

.registry-empty {
  color: var(--color-text-muted);
  padding: var(--space-4) 0;
}

.registry-table {
  display: flex;
  flex-direction: column;
  overflow-x: auto;
}

.registry-row {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1.6fr 1fr 0.8fr 1.8fr;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
  min-width: 720px;
}

.registry-row--head {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  border-bottom-width: 2px;
}

.mono {
  font-family: var(--font-mono, monospace);
  font-size: 0.875rem;
}

.registry-actions {
  display: flex;
  gap: var(--space-2);
}

.registry-revocation-reason {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inline-edit {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.admin-form__actions {
  display: flex;
  justify-content: flex-end;
}

.admin-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: inherit;
}

.admin-input--compact {
  padding: var(--space-2) var(--space-3);
  font-size: 0.875rem;
}
</style>
