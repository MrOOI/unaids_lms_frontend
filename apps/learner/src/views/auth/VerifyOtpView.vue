<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import FormField from '../../components/form/FormField.vue'
import Button from '../../components/ui/Button.vue'
import Alert from '../../components/ui/Alert.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { verifyOtp, resendOtp, isLoading, error, clearError } = useAuth()

// Get email from route params
const email = ref(route.params.email as string)

// OTP state
const otpCode = ref('')
const otpError = ref('')
const resendMessage = ref('')
const resendLoading = ref(false)

// Timer state for resend cooldown
const resendCountdown = ref(0)
const timerInterval = ref<number | null>(null)

// Computed properties
const canResend = computed(() => resendCountdown.value === 0)
const resendButtonText = computed(() => {
  if (canResend.value) return t('auth.otp.resend')
  return t('auth.otp.resendCountdown', { seconds: resendCountdown.value })
})

// Start cooldown timer (2 minutes = 120 seconds)
function startCooldown(): void {
  resendCountdown.value = 120
  timerInterval.value = window.setInterval(() => {
    resendCountdown.value--
    if (resendCountdown.value <= 0) {
      if (timerInterval.value) clearInterval(timerInterval.value)
    }
  }, 1000)
}

// Validate OTP format (6 digits)
function validateOtp(code: string): string | null {
  if (!code) return t('validation.otpRequired')
  if (!/^\d{6}$/.test(code)) return t('validation.otpFormat')
  return null
}

// Handle OTP submission
async function handleSubmit(): Promise<void> {
  clearError()
  otpError.value = validateOtp(otpCode.value) || ''

  if (otpError.value) return

  try {
    await verifyOtp(email.value, otpCode.value)
    // Redirect to dashboard or profile completion
    await router.push({ name: 'home' })
  } catch (err) {
    console.error('OTP verification error:', err)
  }
}

// Handle resend OTP
async function handleResend(): Promise<void> {
  clearError()
  resendMessage.value = ''
  resendLoading.value = true

  try {
    const result = await resendOtp(email.value)
    resendMessage.value = result.message
    startCooldown()
    otpCode.value = ''
  } catch (err) {
    console.error('Resend OTP error:', err)
  } finally {
    resendLoading.value = false
  }
}

// Auto-focus on input
function handleOtpInput(event: Event): void {
  const input = event.target as HTMLInputElement
  // Only allow digits
  input.value = input.value.replace(/\D/g, '')
  // Limit to 6 digits
  if (input.value.length > 6) {
    input.value = input.value.slice(0, 6)
  }
  otpCode.value = input.value
}

// Cleanup timer on unmount
onBeforeUnmount(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
    <div class="w-full max-w-[450px] rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-lg sm:p-8">
      <div class="mb-8 text-center">
        <h1 class="mb-2 text-2xl font-bold text-gray-800">{{ t('auth.otp.title') }}</h1>
        <p class="break-all text-sm text-gray-500">{{ t('auth.otp.subtitle', { email }) }}</p>
      </div>

      <Alert v-if="error" type="error" class="mb-6">
        {{ error }}
      </Alert>

      <Alert v-if="resendMessage" type="success" class="mb-6">
        {{ resendMessage }}
      </Alert>

      <form class="mb-6 flex flex-col gap-6" @submit.prevent="handleSubmit">
        <FormField
          :label="t('auth.otp.code')"
          :error="otpError"
          :help-text="t('auth.otp.hint')"
          required
        >
          <input
            :value="otpCode"
            type="text"
            inputmode="numeric"
            maxlength="6"
            :placeholder="t('auth.otp.codePlaceholder')"
            :aria-invalid="!!otpError"
            autocomplete="one-time-code"
            class="w-full rounded-lg border-2 px-6 py-4 text-center font-mono text-3xl font-bold tracking-[0.5rem] text-gray-800 shadow-theme-xs focus:outline-hidden focus:ring-3"
            :class="otpError ? 'border-error-300 focus:border-error-300 focus:ring-error-500/10' : 'border-gray-300 focus:border-brand-300 focus:ring-brand-500/10'"
            @input="handleOtpInput"
          />
        </FormField>

        <Button type="submit" :loading="isLoading" class="mt-2 w-full">
          {{ t('auth.otp.submit') }}
        </Button>
      </form>

      <div class="flex flex-col items-center gap-3 border-t border-gray-100 pt-6">
        <p class="text-sm text-gray-500">{{ t('auth.otp.noCode') }}</p>
        <Button
          type="button"
          variant="secondary"
          :loading="resendLoading"
          :disabled="!canResend || resendLoading || isLoading"
          class="min-w-[150px]"
          @click="handleResend"
        >
          {{ resendButtonText }}
        </Button>
      </div>

      <p class="mt-4 text-center text-xs text-gray-500">
        {{ t('auth.otp.expiration') }}
      </p>
    </div>
  </div>
</template>
