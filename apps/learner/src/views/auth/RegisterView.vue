<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import FormField from '../../components/form/FormField.vue'
import Button from '../../components/ui/Button.vue'
import Alert from '../../components/ui/Alert.vue'

const router = useRouter()
const { t } = useI18n()
const { register, isLoading, error, clearError } = useAuth()

// Form state
const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  preferredLocale: 'uz',
  consentAccepted: false,
})

// Validation state
const touched = reactive({
  email: false,
  password: false,
  confirmPassword: false,
  fullName: false,
})

const errors = reactive<Record<string, string>>({})

// Validation rules
function validateEmail(email: string): string | null {
  if (!email) return t('validation.emailRequired')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('validation.emailInvalid')
  return null
}

function validatePassword(password: string): string | null {
  if (!password) return t('validation.passwordRequired')
  if (password.length < 10) return t('validation.passwordMinLength', { min: 10 })
  if (!/[A-Z]/.test(password)) return t('validation.passwordUppercase')
  if (!/[0-9]/.test(password)) return t('validation.passwordNumber')
  if (!/[!@#$%^&*]/.test(password)) return t('validation.passwordSpecial')
  return null
}

function validateConfirmPassword(pwd: string, confirm: string): string | null {
  if (!confirm) return t('validation.confirmPasswordRequired')
  if (pwd !== confirm) return t('validation.passwordMismatch')
  return null
}

function validateFullName(name: string): string | null {
  if (!name) return t('validation.fullNameRequired')
  if (name.trim().length < 2) return t('validation.fullNameMinLength', { min: 2 })
  return null
}

// Blur handlers for validation
function handleFieldBlur(field: keyof typeof touched): void {
  touched[field] = true
  validateField(field)
}

function validateField(field: string): void {
  switch (field) {
    case 'email':
      errors.email = validateEmail(form.email) || ''
      break
    case 'password':
      errors.password = validatePassword(form.password) || ''
      break
    case 'confirmPassword':
      errors.confirmPassword = validateConfirmPassword(form.password, form.confirmPassword) || ''
      break
    case 'fullName':
      errors.fullName = validateFullName(form.fullName) || ''
      break
  }
}

function isFormValid(): boolean {
  validateField('email')
  validateField('password')
  validateField('confirmPassword')
  validateField('fullName')

  return (
    !errors.email &&
    !errors.password &&
    !errors.confirmPassword &&
    !errors.fullName &&
    form.consentAccepted
  )
}

async function handleSubmit(): Promise<void> {
  clearError()

  if (!isFormValid()) return

  try {
    const result = await register({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      preferredLocale: form.preferredLocale,
      consentAccepted: form.consentAccepted,
    })

    // Redirect to OTP verification
    await router.push({
      name: 'verify-otp',
      params: { email: result.email },
    })
  } catch (err) {
    // Error is already set in useAuth
    console.error('Registration error:', err)
  }
}
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h1>{{ t('auth.register.title') }}</h1>
        <p>{{ t('auth.register.subtitle') }}</p>
      </div>

      <Alert v-if="error" type="error" class="register-alert">
        {{ error }}
      </Alert>

      <form @submit.prevent="handleSubmit" class="register-form">
        <FormField
          :label="t('auth.form.fullName')"
          :error="touched.fullName ? errors.fullName : ''"
          required
        >
          <input
            v-model="form.fullName"
            type="text"
            :placeholder="t('auth.form.fullNamePlaceholder')"
            :aria-invalid="!!errors.fullName"
            @blur="handleFieldBlur('fullName')"
            class="form-input"
          />
        </FormField>

        <FormField
          :label="t('auth.form.email')"
          :error="touched.email ? errors.email : ''"
          required
        >
          <input
            v-model="form.email"
            type="email"
            :placeholder="t('auth.form.emailPlaceholder')"
            :aria-invalid="!!errors.email"
            @blur="handleFieldBlur('email')"
            class="form-input"
          />
        </FormField>

        <FormField
          :label="t('auth.form.password')"
          :error="touched.password ? errors.password : ''"
          required
        >
          <input
            v-model="form.password"
            type="password"
            :placeholder="t('auth.form.passwordPlaceholder')"
            :aria-invalid="!!errors.password"
            @blur="handleFieldBlur('password')"
            class="form-input"
          />
          <p class="password-hint">{{ t('auth.form.passwordHint') }}</p>
        </FormField>

        <FormField
          :label="t('auth.form.confirmPassword')"
          :error="touched.confirmPassword ? errors.confirmPassword : ''"
          required
        >
          <input
            v-model="form.confirmPassword"
            type="password"
            :placeholder="t('auth.form.confirmPasswordPlaceholder')"
            :aria-invalid="!!errors.confirmPassword"
            @blur="handleFieldBlur('confirmPassword')"
            class="form-input"
          />
        </FormField>

        <FormField :label="t('auth.form.language')">
          <select v-model="form.preferredLocale" class="form-input">
            <option value="uz">Ўзбек (Latin)</option>
            <option value="kaa">Қарақалпақ</option>
            <option value="en">English</option>
            <option value="ru">Русский</option>
          </select>
        </FormField>

        <div class="consent-field">
          <label class="consent-label">
            <input
              v-model="form.consentAccepted"
              type="checkbox"
              class="consent-checkbox"
            />
            <span>{{ t('auth.form.consent') }}</span>
          </label>
        </div>

        <Button
          type="submit"
          :loading="isLoading"
          :disabled="!form.consentAccepted"
          class="register-submit"
        >
          {{ t('auth.register.submit') }}
        </Button>
      </form>

      <p class="register-footer">
        {{ t('auth.register.haveAccount') }}
        <RouterLink to="/auth/login">{{ t('auth.login.linkText') }}</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-4);
  background: var(--color-surface-alt);
}

.register-card {
  width: 100%;
  max-width: 450px;
  padding: var(--space-8);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.register-header {
  margin-bottom: var(--space-8);
  text-align: center;
}

.register-header h1 {
  margin: 0 0 var(--space-2) 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
}

.register-header p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.register-alert {
  margin-bottom: var(--space-6);
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: inherit;
  color: var(--color-text);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-focus);
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
}

.form-input:invalid {
  border-color: var(--color-error);
}

.password-hint {
  margin: var(--space-2) 0 0 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.consent-field {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.consent-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text);
}

.consent-checkbox {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--module-1);
}

.register-submit {
  margin-top: var(--space-4);
}

.register-footer {
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}

.register-footer a {
  color: var(--module-1);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.register-footer a:hover {
  color: var(--module-1-accessible);
  text-decoration: underline;
}

@media (max-width: 640px) {
  .register-container {
    min-height: auto;
    padding: var(--space-4) 0;
  }

  .register-card {
    margin: var(--space-4);
    padding: var(--space-6);
  }

  .register-header h1 {
    font-size: 1.5rem;
  }
}
</style>
