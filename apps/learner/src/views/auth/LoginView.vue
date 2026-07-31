<script setup lang="ts">
/**
 * Login view — authenticates existing users
 * Uses email + password with brute-force protection (5 attempts / 15 min)
 */

import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import { isAdminRole } from '../../lib/api-types'
import FormField from '../../components/form/FormField.vue'
import Input from '../../components/ui/Input.vue'
import Button from '../../components/ui/Button.vue'
import Alert from '../../components/ui/Alert.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { login, isLoading, error, clearError } = useAuth()

// Set by lib/sessionGuard.ts when a mid-session 401 forces a redirect here.
const sessionExpired = route.query.expired === '1'

const form = reactive({
  email: '',
  password: '',
  rememberMe: false,
})

const touched = reactive({
  email: false,
  password: false,
})

const errors = reactive<Record<string, string>>({})

function validateEmail(email: string): string | null {
  if (!email) return t('validation.emailRequired')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('validation.emailInvalid')
  return null
}

function validatePassword(password: string): string | null {
  if (!password) return t('validation.passwordRequired')
  return null
}

function handleFieldBlur(field: keyof typeof touched): void {
  touched[field] = true
  if (field === 'email') {
    errors.email = validateEmail(form.email) || ''
  } else if (field === 'password') {
    errors.password = validatePassword(form.password) || ''
  }
}

function isFormValid(): boolean {
  return !errors.email && !errors.password && !!form.email && !!form.password
}

async function handleSubmit(): Promise<void> {
  clearError()

  if (!isFormValid()) {
    handleFieldBlur('email')
    handleFieldBlur('password')
    return
  }

  try {
    const user = await login(form.email, form.password)

    const from = typeof route.query.from === 'string' ? route.query.from : null
    if (from) {
      await router.push(from)
    } else if (isAdminRole(user.roles)) {
      await router.push({ name: 'admin-dashboard' })
    } else {
      await router.push({ name: 'home' })
    }
  } catch (err) {
    console.error('Login error:', err)
    // Error is already in composable state
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
    <div class="w-full max-w-[450px] rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-lg sm:p-8">
      <div class="mb-8 text-center">
        <h1 class="mb-2 text-2xl font-bold text-gray-800">{{ t('auth.login.title') }}</h1>
        <p class="text-sm text-gray-500">{{ t('auth.login.subtitle') }}</p>
      </div>

      <Alert v-if="sessionExpired && !error" type="info" class="mb-6">
        {{ t('auth.login.sessionExpired') }}
      </Alert>

      <Alert v-if="error" type="error" class="mb-6" dismissible @dismiss="clearError">
        {{ error === 'invalid_credentials' ? t('auth.login.invalidCredentials') : error }}
      </Alert>

      <form class="mb-6 flex flex-col gap-6" @submit.prevent="handleSubmit">
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
            autocomplete="email"
            @blur="handleFieldBlur('email')"
          />
        </FormField>

        <FormField
          :label="t('auth.form.password')"
          :error="touched.password ? errors.password : ''"
          required
        >
          <Input
            v-model="form.password"
            type="password"
            :placeholder="t('auth.form.passwordPlaceholder')"
            :error="!!errors.password"
            autocomplete="current-password"
            @blur="handleFieldBlur('password')"
          />
        </FormField>

        <div class="flex items-center justify-between gap-4">
          <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input v-model="form.rememberMe" type="checkbox" class="size-5 cursor-pointer accent-brand-500" />
            <span>{{ t('auth.login.rememberMe') }}</span>
          </label>
          <!-- TODO: Add forgot password flow when implemented -->
        </div>

        <Button type="submit" :loading="isLoading" class="mt-2 w-full">
          {{ t('auth.login.submit') }}
        </Button>
      </form>

      <p class="text-center text-sm text-gray-500">
        {{ t('auth.login.noAccount') }}
        <RouterLink to="/auth/register" class="font-semibold text-brand-600 hover:underline">{{ t('auth.register.linkText') }}</RouterLink>
      </p>
    </div>
  </div>
</template>
