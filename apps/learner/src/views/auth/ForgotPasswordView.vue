<script setup lang="ts">
/**
 * Forgot-password view — requests a reset link by email. Always shows the
 * same success message whether or not the account exists (the backend
 * mirrors this — see AuthController.ForgotPassword), so this view never
 * needs to branch on "did that email exist."
 */

import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import FormField from '../../components/form/FormField.vue'
import Input from '../../components/ui/Input.vue'
import Button from '../../components/ui/Button.vue'
import Alert from '../../components/ui/Alert.vue'

const { t } = useI18n()
const { forgotPassword, isLoading, clearError } = useAuth()

const form = reactive({ email: '' })
const touched = ref(false)
const fieldError = ref('')
const submitted = ref(false)
const submitError = ref('')

function validateEmail(email: string): string {
  if (!email) return t('validation.emailRequired')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('validation.emailInvalid')
  return ''
}

function handleBlur(): void {
  touched.value = true
  fieldError.value = validateEmail(form.email)
}

async function handleSubmit(): Promise<void> {
  clearError()
  submitError.value = ''
  fieldError.value = validateEmail(form.email)
  touched.value = true
  if (fieldError.value) return

  try {
    await forgotPassword(form.email)
    submitted.value = true
  } catch {
    submitError.value = t('auth.forgotPassword.genericError')
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
    <div class="w-full max-w-[450px] rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-lg sm:p-8">
      <div class="mb-8 text-center">
        <h1 class="mb-2 text-2xl font-bold text-gray-800">{{ t('auth.forgotPassword.title') }}</h1>
        <p class="text-sm text-gray-500">{{ t('auth.forgotPassword.subtitle') }}</p>
      </div>

      <Alert v-if="submitted" type="success" class="mb-6">
        {{ t('auth.forgotPassword.successMessage') }}
      </Alert>

      <Alert v-if="submitError" type="error" class="mb-6" dismissible @dismiss="submitError = ''">
        {{ submitError }}
      </Alert>

      <form v-if="!submitted" class="mb-6 flex flex-col gap-6" @submit.prevent="handleSubmit">
        <FormField :label="t('auth.form.email')" :error="touched ? fieldError : ''" required>
          <Input
            v-model="form.email"
            type="email"
            :placeholder="t('auth.form.emailPlaceholder')"
            :error="!!fieldError"
            autocomplete="email"
            @blur="handleBlur"
          />
        </FormField>

        <Button type="submit" :loading="isLoading" class="mt-2 w-full">
          {{ t('auth.forgotPassword.submit') }}
        </Button>
      </form>

      <p class="text-center text-sm text-gray-500">
        <RouterLink to="/auth/login" class="font-semibold text-brand-600 hover:underline">
          {{ t('auth.forgotPassword.backToLogin') }}
        </RouterLink>
      </p>
    </div>
  </div>
</template>
