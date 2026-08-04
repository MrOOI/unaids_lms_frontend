<script setup lang="ts">
/**
 * Reset-password view — lands here from the emailed link
 * (?email=...&token=...). Same password strength rule as registration.
 */

import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import FormField from '../../components/form/FormField.vue'
import Input from '../../components/ui/Input.vue'
import Button from '../../components/ui/Button.vue'
import Alert from '../../components/ui/Alert.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { resetPassword, isLoading, clearError } = useAuth()

const email = computed(() => (typeof route.query.email === 'string' ? route.query.email : ''))
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const linkIsValid = computed(() => !!email.value && !!token.value)

const form = reactive({ password: '', confirmPassword: '' })
const touched = reactive({ password: false, confirmPassword: false })
const errors = reactive<Record<string, string>>({})
const submitted = ref(false)
const submitError = ref('')

function validatePassword(password: string): string {
  if (!password) return t('validation.passwordRequired')
  if (password.length < 10) return t('validation.passwordMinLength', { min: 10 })
  if (!/[A-Z]/.test(password)) return t('validation.passwordUppercase')
  if (!/[0-9]/.test(password)) return t('validation.passwordNumber')
  if (!/[!@#$%^&*]/.test(password)) return t('validation.passwordSpecial')
  return ''
}

function validateConfirmPassword(pwd: string, confirm: string): string {
  if (!confirm) return t('validation.confirmPasswordRequired')
  if (pwd !== confirm) return t('validation.passwordMismatch')
  return ''
}

function handleFieldBlur(field: keyof typeof touched): void {
  touched[field] = true
  if (field === 'password') {
    errors.password = validatePassword(form.password)
    errors.confirmPassword = validateConfirmPassword(form.password, form.confirmPassword)
  } else {
    errors.confirmPassword = validateConfirmPassword(form.password, form.confirmPassword)
  }
}

function isFormValid(): boolean {
  return !errors.password && !errors.confirmPassword && !!form.password && !!form.confirmPassword
}

async function handleSubmit(): Promise<void> {
  clearError()
  submitError.value = ''

  handleFieldBlur('password')
  handleFieldBlur('confirmPassword')
  if (!isFormValid()) return

  try {
    await resetPassword(email.value, token.value, form.password)
    submitted.value = true
  } catch {
    submitError.value = t('auth.resetPassword.invalidLink')
  }
}

async function goToLogin(): Promise<void> {
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
    <div class="w-full max-w-[450px] rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-lg sm:p-8">
      <div class="mb-8 text-center">
        <h1 class="mb-2 text-2xl font-bold text-gray-800">{{ t('auth.resetPassword.title') }}</h1>
        <p v-if="linkIsValid" class="break-all text-sm text-gray-500">
          {{ t('auth.resetPassword.subtitle', { email }) }}
        </p>
      </div>

      <Alert v-if="!linkIsValid" type="error" class="mb-6">
        {{ t('auth.resetPassword.invalidLink') }}
      </Alert>

      <template v-if="linkIsValid">
        <Alert v-if="submitted" type="success" class="mb-6">
          {{ t('auth.resetPassword.successMessage') }}
        </Alert>

        <Alert v-if="submitError" type="error" class="mb-6" dismissible @dismiss="submitError = ''">
          {{ submitError }}
        </Alert>

        <form v-if="!submitted" class="mb-6 flex flex-col gap-6" @submit.prevent="handleSubmit">
          <FormField
            :label="t('auth.form.password')"
            :error="touched.password ? errors.password : ''"
            :help-text="t('auth.form.passwordHint')"
            required
          >
            <Input
              v-model="form.password"
              type="password"
              :placeholder="t('auth.form.passwordPlaceholder')"
              :error="!!errors.password"
              autocomplete="new-password"
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
              autocomplete="new-password"
              @blur="handleFieldBlur('confirmPassword')"
            />
          </FormField>

          <Button type="submit" :loading="isLoading" class="mt-2 w-full">
            {{ t('auth.resetPassword.submit') }}
          </Button>
        </form>

        <Button v-if="submitted" class="w-full" @click="goToLogin">
          {{ t('auth.login.submit') }}
        </Button>
      </template>

      <p v-if="!linkIsValid" class="text-center text-sm text-gray-500">
        <RouterLink to="/auth/forgot-password" class="font-semibold text-brand-600 hover:underline">
          {{ t('auth.resetPassword.requestNewLink') }}
        </RouterLink>
      </p>
    </div>
  </div>
</template>
