<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Textarea from '../ui/Textarea.vue'
import type { ReflectionPayload, ReflectionAnswer } from '../../lib/questions'

defineProps<{ payload: ReflectionPayload; modelValue?: ReflectionAnswer }>()
const emit = defineEmits<{ 'update:modelValue': [ReflectionAnswer] }>()
const { t } = useI18n()
</script>

<template>
  <div class="reflection-question">
    <Textarea
      :model-value="modelValue?.text ?? ''"
      :rows="5"
      :placeholder="payload.placeholder || t('quiz.reflectionPlaceholder')"
      @update:model-value="(value) => emit('update:modelValue', { text: value })"
    />
    <p class="reflection-hint">{{ t('quiz.reflectionHint') }}</p>
  </div>
</template>

<style scoped>
.reflection-question {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.reflection-hint {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
</style>
