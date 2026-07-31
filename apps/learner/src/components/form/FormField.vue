<script setup lang="ts">
/**
 * FormField component — wraps form inputs with label and error handling.
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
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="flex items-center gap-1 text-sm font-medium text-gray-700">
      <span>{{ label }}</span>
      <span v-if="required" class="text-error-500" aria-label="required">*</span>
    </label>

    <div class="flex flex-col gap-1.5">
      <slot />
      <p v-if="error" class="text-theme-xs font-medium text-error-500" role="alert">
        {{ error }}
      </p>
    </div>

    <p v-if="helpText && !error" class="text-theme-xs text-gray-500">
      {{ helpText }}
    </p>
  </div>
</template>
