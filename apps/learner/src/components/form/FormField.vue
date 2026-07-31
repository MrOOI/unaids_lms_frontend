<script setup lang="ts">
/**
 * FormField component — wraps form inputs with label and error handling.
 * Provides consistent styling and accessibility.
 */

interface Props {
  label?: string
  error?: string
  required?: boolean
  helpText?: string
}

defineProps<Props>()
</script>

<template>
  <div class="form-field">
    <label v-if="label" class="form-label">
      <span>{{ label }}</span>
      <span v-if="required" class="required" aria-label="required">*</span>
    </label>

    <div class="form-input-wrapper">
      <slot />
      <p v-if="error" class="form-error" role="alert">
        {{ error }}
      </p>
    </div>

    <p v-if="helpText && !error" class="form-help-text">
      {{ helpText }}
    </p>
  </div>
</template>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text);
  cursor: pointer;
}

.required {
  color: var(--color-error);
}

.form-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-error {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-error);
  font-weight: 500;
}

.form-help-text {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
</style>
