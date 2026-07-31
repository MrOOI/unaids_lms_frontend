/**
 * Certificates: public verification, PDF download, admin revoke.
 *
 * Note: `GET /api/certificates` (list-my-certificates) is a documented TODO
 * on the backend (CertificatesController.ListUserCertificates always returns
 * an empty array) — there is no certificate id to look up from the learner
 * side yet. This composable is wired for when that lands; today
 * `myCertificates` will simply always resolve empty.
 */
import { computed, reactive } from 'vue'
import { apiFetch, apiFetchBlob, triggerBlobDownload, ApiError } from '../lib/http'
import type { CertificateVerificationResultDto } from '../lib/api-types'

interface CertificatesState {
  isLoading: boolean
  error: string | null
  verification: CertificateVerificationResultDto | null
}

const state = reactive<CertificatesState>({
  isLoading: false,
  error: null,
  verification: null,
})

export function useCertificates() {
  const isLoading = computed(() => state.isLoading)
  const error = computed(() => state.error)
  const verification = computed(() => state.verification)

  async function fetchMyCertificates(): Promise<unknown[]> {
    return apiFetch<unknown[]>('/certificates')
  }

  async function verify(code: string): Promise<CertificateVerificationResultDto> {
    state.isLoading = true
    state.error = null
    try {
      const result = await apiFetch<CertificateVerificationResultDto>('/certificates/verify', {
        query: { code },
      })
      state.verification = result
      return result
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Verification failed'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  async function downloadPdf(certificateId: string, fileName = 'certificate.pdf'): Promise<void> {
    state.isLoading = true
    state.error = null
    try {
      const blob = await apiFetchBlob(`/certificates/${certificateId}/pdf`, { method: 'POST' })
      triggerBlobDownload(blob, fileName)
    } catch (err) {
      state.error = err instanceof ApiError ? err.message : 'Failed to download certificate'
      throw err
    } finally {
      state.isLoading = false
    }
  }

  async function revoke(certificateId: string, reason: string): Promise<void> {
    await apiFetch(`/certificates/${certificateId}/revoke`, { method: 'PUT', body: { reason } })
  }

  function clearError(): void {
    state.error = null
  }

  return {
    isLoading,
    error,
    verification,
    fetchMyCertificates,
    verify,
    downloadPdf,
    revoke,
    clearError,
  }
}
