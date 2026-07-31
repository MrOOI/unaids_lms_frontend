<script setup lang="ts">
/**
 * SysAdmin certificate revocation. There is no "list all certificates"
 * endpoint on the backend yet, so an admin acts on a certificate id they
 * already have (from a learner report, a support ticket, etc.) — this view
 * is a focused revoke tool, plus the same public verify lookup for
 * convenience when only the verification code is on hand.
 */
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCertificates } from '../../composables/useCertificates'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import Card from '../../components/ui/Card.vue'
import Button from '../../components/ui/Button.vue'
import Alert from '../../components/ui/Alert.vue'
import FormField from '../../components/form/FormField.vue'

const { t, locale } = useI18n()
const certs = useCertificates()
const toast = useToast()
const { confirm } = useConfirm()

const revokeForm = reactive({ certificateId: '', reason: '' })
const isRevoking = ref(false)

const verifyCode = ref('')

async function handleRevoke(): Promise<void> {
  if (!revokeForm.certificateId.trim()) return
  const confirmed = await confirm({
    title: t('admin.certificates.revokeConfirmTitle'),
    message: t('admin.certificates.revokeConfirmMessage'),
    confirmLabel: t('admin.certificates.revoke'),
    danger: true,
  })
  if (!confirmed) return

  isRevoking.value = true
  try {
    await certs.revoke(revokeForm.certificateId.trim(), revokeForm.reason.trim())
    toast.success(t('admin.certificates.revoked'))
    revokeForm.certificateId = ''
    revokeForm.reason = ''
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
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

    <div class="admin-grid">
      <Card :title="t('admin.certificates.revokeTitle')">
        <div class="admin-form">
          <FormField :label="t('admin.certificates.certificateId')">
            <input v-model="revokeForm.certificateId" type="text" class="admin-input" placeholder="00000000-0000-0000-0000-000000000000" />
          </FormField>
          <FormField :label="t('admin.certificates.reason')">
            <input v-model="revokeForm.reason" type="text" class="admin-input" />
          </FormField>
          <div class="admin-form__actions">
            <Button variant="danger" :loading="isRevoking" @click="handleRevoke">{{ t('admin.certificates.revoke') }}</Button>
          </div>
        </div>
      </Card>

      <Card :title="t('admin.certificates.lookupTitle')">
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

.admin-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
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

@media (max-width: 800px) {
  .admin-grid {
    grid-template-columns: 1fr;
  }
}
</style>
