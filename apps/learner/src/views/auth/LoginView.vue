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
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>{{ t('auth.login.title') }}</h1>
        <p>{{ t('auth.login.subtitle') }}</p>
      </div>

      <Alert v-if="sessionExpired && !error" type="info" class="login-alert">
        {{ t('auth.login.sessionExpired') }}
      </Alert>

      <Alert v-if="error" type="error" class="login-alert" dismissible @dismiss="clearError">
        {{ error === 'invalid_credentials' ? t('auth.login.invalidCredentials') : error }}
      </Alert>

      <form @submit.prevent="handleSubmit" class="login-form">
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
            autocomplete="email"
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
            autocomplete="current-password"
          />
        </FormField>

        <div class="login-options">
          <label class="remember-me">
            <input v-model="form.rememberMe" type="checkbox" class="remember-checkbox" />
            <span>{{ t('auth.login.rememberMe') }}</span>
          </label>
          <!-- TODO: Add forgot password flow when implemented -->
        </div>

        <Button
          type="submit"
          :loading="isLoading"
          class="login-submit"
        >
          {{ t('auth.login.submit') }}
        </Button>
      </form>

      <p class="login-footer">
        {{ t('auth.login.noAccount') }}
        <RouterLink to="/auth/register">{{ t('auth.register.linkText') }}</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--space-4);
  background: var(--color-surface-alt);
}

.login-card {
  width: 100%;
  max-width: 450px;
  padding: var(--space-8);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.login-header {
  margin-bottom: var(--space-8);
  text-align: center;
}

.login-header h1 {
  margin: 0 0 var(--space-2) 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
}

.login-header p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.login-alert {
  margin-bottom: var(--space-6);
}

.login-form {
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

.login-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.remember-me {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text);
}

.remember-checkbox {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--module-1);
}

.login-submit {
  margin-top: var(--space-2);
}

.login-footer {
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}

.login-footer a {
  color: var(--module-1);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.login-footer a:hover {
  color: var(--module-1-accessible);
  text-decoration: underline;
}

@media (max-width: 640px) {
  .login-container {
    min-height: auto;
    padding: var(--space-4) 0;
  }

  .login-card {
    margin: var(--space-4);
    padding: var(--space-6);
  }

  .login-header h1 {
    font-size: 1.5rem;
  }
}
</style>
