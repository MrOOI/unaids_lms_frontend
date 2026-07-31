<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import FormField from '../../components/form/FormField.vue'
import Input from '../../components/ui/Input.vue'
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
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
    <div class="w-full max-w-[450px] rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-lg sm:p-8">
      <div class="mb-8 text-center">
        <h1 class="mb-2 text-2xl font-bold text-gray-800">{{ t('auth.register.title') }}</h1>
        <p class="text-sm text-gray-500">{{ t('auth.register.subtitle') }}</p>
      </div>

      <Alert v-if="error" type="error" class="mb-6">
        {{ error }}
      </Alert>

      <form class="mb-6 flex flex-col gap-6" @submit.prevent="handleSubmit">
        <FormField
          :label="t('auth.form.fullName')"
          :error="touched.fullName ? errors.fullName : ''"
          required
        >
          <Input
            v-model="form.fullName"
            type="text"
            :placeholder="t('auth.form.fullNamePlaceholder')"
            :error="!!errors.fullName"
            @blur="handleFieldBlur('fullName')"
          />
        </FormField>

        <FormField
          :label="t('auth.form.email')"
          :error="touched.email ? errors.email : ''"
          required
        >
          <Input
            v-model="form.email"
            type="email"
            :placeholder="t('auth.form.emailPlaceholder')"
            :error="!!errors.email"
            @blur="handleFieldBlur('email')"
          />
        </FormField>

        <FormField
          :label="t('auth.form.password')"
          :error="touched.password ? errors.password : ''"
          required
          :help-text="t('auth.form.passwordHint')"
        >
          <Input
            v-model="form.password"
            type="password"
            :placeholder="t('auth.form.passwordPlaceholder')"
            :error="!!errors.password"
            @blur="handleFieldBlur('password')"
          />
        </FormField>

        <FormField
          :label="t('auth.form.confirmPassword')"
          :error="touched.confirmPassword ? errors.confirmPassword : ''"
          required
        >
          <Input
            v-model="form.confirmPassword"
            type="password"
            :placeholder="t('auth.form.confirmPasswordPlaceholder')"
            :error="!!errors.confirmPassword"
            @blur="handleFieldBlur('confirmPassword')"
          />
        </FormField>

        <FormField :label="t('auth.form.language')">
          <select
            v-model="form.preferredLocale"
            class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
          >
            <option value="uz">Ўзбек (Latin)</option>
            <option value="kaa">Қарақалпақ</option>
            <option value="en">English</option>
            <option value="ru">Русский</option>
          </select>
        </FormField>

        <label class="flex items-start gap-2 text-sm text-gray-700">
          <input v-model="form.consentAccepted" type="checkbox" class="mt-0.5 size-5 flex-shrink-0 cursor-pointer accent-brand-500" />
          <span>{{ t('auth.form.consent') }}</span>
        </label>

        <Button type="submit" :loading="isLoading" :disabled="!form.consentAccepted" class="mt-2 w-full">
          {{ t('auth.register.submit') }}
        </Button>
      </form>

      <p class="text-center text-sm text-gray-500">
        {{ t('auth.register.haveAccount') }}
        <RouterLink to="/auth/login" class="font-semibold text-brand-600 hover:underline">{{ t('auth.login.linkText') }}</RouterLink>
      </p>
    </div>
  </div>
</template>
