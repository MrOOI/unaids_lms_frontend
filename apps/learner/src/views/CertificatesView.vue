<script setup lang="ts">
/**
 * My certificates. The backend's list endpoint is a documented TODO
 * (CertificatesController.ListUserCertificates always returns an empty
 * array), so this reliably shows the empty state today — the page is wired
 * so it starts working the moment that endpoint returns real data.
 */
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useCertificates } from '../composables/useCertificates'
import Card from '../components/ui/Card.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import Spinner from '../components/ui/Spinner.vue'
import Button from '../components/ui/Button.vue'

const { t } = useI18n()
const router = useRouter()
const { fetchMyCertificates } = useCertificates()

const isLoading = ref(true)
const certificates = ref<unknown[]>([])

onMounted(async () => {
  try {
    certificates.value = await fetchMyCertificates()
  } catch {
    certificates.value = []
  } finally {
    isLoading.value = false
  }
})
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

      <Card v-else :title="t('certificates.title')">
        <p>{{ certificates.length }}</p>
      </Card>
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
</style>
