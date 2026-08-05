/**
 * Certificates: my certificates, public verification, PDF download,
 * admin registry search, reissue (name-typo fix), and revoke.
 */
import { computed, reactive } from 'vue'
import { apiFetch, apiFetchBlob, triggerBlobDownload, ApiError } from '../lib/http'
import type {
  CertificateVerificationResultDto,
  CertificateSummaryDto,
  CertificateAdminSummaryDto,
} from '../lib/api-types'

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

  async function fetchMyCertificates(): Promise<CertificateSummaryDto[]> {
    return apiFetch<CertificateSummaryDto[]>('/certificates')
  }

  async function listForAdmin(search?: string): Promise<CertificateAdminSummaryDto[]> {
    return apiFetch<CertificateAdminSummaryDto[]>('/admin/certificates', {
      query: search ? { search } : undefined,
    })
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

  async function reissue(certificateId: string, correctedName: string): Promise<void> {
    await apiFetch(`/certificates/${certificateId}/reissue`, {
      method: 'PUT',
      body: { correctedName },
    })
  }

  function clearError(): void {
    state.error = null
  }

  return {
    isLoading,
    error,
    verification,
    fetchMyCertificates,
    listForAdmin,
    verify,
    downloadPdf,
    revoke,
    reissue,
    clearError,
  }
}
