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
}

// Cleanup timer on unmount
onBeforeUnmount(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})
</script>

<template>
  <div class="verify-otp-container">
    <div class="verify-otp-card">
      <div class="verify-otp-header">
        <h1>{{ t('auth.otp.title') }}</h1>
        <p>{{ t('auth.otp.subtitle', { email }) }}</p>
      </div>

      <Alert v-if="error" type="error" class="verify-otp-alert">
        {{ error }}
      </Alert>

      <Alert v-if="resendMessage" type="success" class="verify-otp-alert">
        {{ resendMessage }}
      </Alert>

      <form @submit.prevent="handleSubmit" class="verify-otp-form">
        <FormField
          :label="t('auth.otp.code')"
          :error="otpError"
          required
        >
          <input
            v-model="otpCode"
            type="text"
            inputmode="numeric"
            maxlength="6"
            :placeholder="t('auth.otp.codePlaceholder')"
            :aria-invalid="!!otpError"
            @input="handleOtpInput"
            class="otp-input"
            autocomplete="one-time-code"
          />
          <p class="otp-hint">{{ t('auth.otp.hint') }}</p>
        </FormField>

        <Button
          type="submit"
          :loading="isLoading"
          class="verify-otp-submit"
        >
          {{ t('auth.otp.submit') }}
        </Button>
      </form>

      <div class="resend-section">
        <p class="resend-text">{{ t('auth.otp.noCode') }}</p>
        <Button
          type="button"
          variant="secondary"
          :loading="resendLoading"
          :disabled="!canResend || resendLoading || isLoading"
          @click="handleResend"
          class="resend-button"
        >
          {{ resendButtonText }}
        </Button>
      </div>

      <p class="verify-otp-footer">
        {{ t('auth.otp.expiration') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.verify-otp-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-4);
  background: var(--color-surface-alt);
}

.verify-otp-card {
  width: 100%;
  max-width: 450px;
  padding: var(--space-8);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.verify-otp-header {
  margin-bottom: var(--space-8);
  text-align: center;
}

.verify-otp-header h1 {
  margin: 0 0 var(--space-2) 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
}

.verify-otp-header p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  word-break: break-all;
}

.verify-otp-alert {
  margin-bottom: var(--space-6);
}

.verify-otp-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}

.otp-input {
  width: 100%;
  padding: var(--space-4) var(--space-6);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: 'Courier New', monospace;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.5rem;
  text-align: center;
  color: var(--color-text);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.otp-input:focus {
  outline: none;
  border-color: var(--color-focus);
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
}

.otp-input:invalid {
  border-color: var(--color-error);
}

.otp-hint {
  margin: var(--space-2) 0 0 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: center;
}

.verify-otp-submit {
  margin-top: var(--space-4);
}

.resend-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border);
}

.resend-text {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.resend-button {
  min-width: 150px;
}

.verify-otp-footer {
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: var(--space-4) 0 0 0;
}

@media (max-width: 640px) {
  .verify-otp-container {
    min-height: auto;
    padding: var(--space-4) 0;
  }

  .verify-otp-card {
    margin: var(--space-4);
    padding: var(--space-6);
  }

  .verify-otp-header h1 {
    font-size: 1.5rem;
  }

  .otp-input {
    font-size: 1.75rem;
    letter-spacing: 0.25rem;
  }
}
</style>
