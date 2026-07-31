<script setup lang="ts">
/** Public certificate verification — no auth required (matches AllowAnonymous on the backend). */
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useCertificates } from '../composables/useCertificates'
import Button from '../components/ui/Button.vue'
import Alert from '../components/ui/Alert.vue'

const { t, locale } = useI18n()
const route = useRoute()
const { verification, isLoading, error, verify, clearError } = useCertificates()

const code = ref((route.query.code as string) || '')
const hasSearched = ref(false)

onMounted(async () => {
  if (code.value) await runVerify()
})

async function runVerify(): Promise<void> {
  if (!code.value.trim()) return
  clearError()
  hasSearched.value = true
  try {
    await verify(code.value.trim())
  } catch {
    // surfaced via `error`
  }
}
</script>

<template>
  <div class="verify-container">
    <div class="verify-card">
      <h1>{{ t('certificates.verify.title') }}</h1>
      <p>{{ t('certificates.verify.subtitle') }}</p>

      <form class="verify-form" @submit.prevent="runVerify">
        <label class="verify-label" for="verify-code">{{ t('certificates.verify.codeLabel') }}</label>
        <div class="verify-input-row">
          <input id="verify-code" v-model="code" type="text" class="verify-input" />
          <Button type="submit" :loading="isLoading">{{ t('certificates.verify.submit') }}</Button>
        </div>
      </form>

      <Alert v-if="error" type="error" dismissible @dismiss="clearError">{{ error }}</Alert>

      <div v-if="hasSearched && verification && !isLoading" class="verify-result">
        <Alert v-if="verification.valid" type="success">
          <strong>{{ t('certificates.verify.validTitle') }}</strong>
          <p class="verify-detail">{{ t('certificates.verify.learner') }}: {{ verification.learnerName }}</p>
          <p class="verify-detail">{{ t('certificates.verify.course') }}: {{ verification.courseName }}</p>
          <p class="verify-detail">
            {{ t('certificates.verify.issuedOn') }}:
            {{ verification.issuedAt ? new Date(verification.issuedAt).toLocaleDateString(locale) : '' }}
          </p>
        </Alert>
        <Alert v-else type="error">{{ t('certificates.verify.invalid') }}</Alert>
      </div>
    </div>
  </div>
</template>

<style scoped>
.verify-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-4);
  background: var(--color-surface-alt);
}

.verify-card {
  width: 100%;
  max-width: 480px;
  padding: var(--space-8);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.verify-card h1 {
  margin: 0 0 var(--space-2) 0;
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
}

.verify-card > p {
  margin: 0 0 var(--space-6) 0;
  text-align: center;
  color: var(--color-text-muted);
}

.verify-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.verify-label {
  font-weight: 600;
  font-size: 0.875rem;
}

.verify-input-row {
  display: flex;
  gap: var(--space-3);
}

.verify-input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: inherit;
}

.verify-result {
  margin-top: var(--space-4);
}

.verify-detail {
  margin: var(--space-1) 0 0 0;
}
</style>
