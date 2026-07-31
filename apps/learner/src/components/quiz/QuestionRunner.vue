<script setup lang="ts">
/** Dispatches an attempt question to its type-specific answer component. */
import { computed } from 'vue'
import type { AttemptQuestionDto } from '../../lib/api-types'
import { parseJson } from '../../lib/questions'
import type {
  DragAndDropAnswer,
  DragAndDropPayload,
  MatchingAnswer,
  MatchingPayload,
  MultiChoiceAnswer,
  MultiChoicePayload,
  ReflectionAnswer,
  ReflectionPayload,
  ScenarioPayload,
  SequencingAnswer,
  SequencingPayload,
  SingleChoiceAnswer,
  SingleChoicePayload,
  TrueFalseAnswer,
} from '../../lib/questions'
import SingleChoiceQuestion from './SingleChoiceQuestion.vue'
import MultiChoiceQuestion from './MultiChoiceQuestion.vue'
import TrueFalseQuestion from './TrueFalseQuestion.vue'
import MatchingQuestion from './MatchingQuestion.vue'
import SequencingQuestion from './SequencingQuestion.vue'
import DragAndDropQuestion from './DragAndDropQuestion.vue'
import ReflectionQuestion from './ReflectionQuestion.vue'

const props = defineProps<{ question: AttemptQuestionDto; modelValue: unknown }>()
const emit = defineEmits<{ 'update:modelValue': [unknown] }>()

const prompt = computed(() => {
  const payload = parseJson<{ prompt?: string }>(props.question.payloadJson, {})
  return payload.prompt ?? ''
})
const scenario = computed(() => {
  if (props.question.type !== 'Scenario') return ''
  return parseJson<ScenarioPayload>(props.question.payloadJson, { prompt: '', options: [] }).scenario ?? ''
})

function update(value: unknown): void {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="question-runner">
    <p class="question-runner__prompt">{{ prompt }}</p>
    <p v-if="scenario" class="question-runner__scenario">{{ scenario }}</p>

    <SingleChoiceQuestion
      v-if="question.type === 'SingleChoice' || question.type === 'Scenario'"
      :payload="parseJson<SingleChoicePayload>(question.payloadJson, { prompt: '', options: [] })"
      :model-value="modelValue as SingleChoiceAnswer | undefined"
      :name="question.id"
      @update:model-value="update"
    />
    <MultiChoiceQuestion
      v-else-if="question.type === 'MultiChoice'"
      :payload="parseJson<MultiChoicePayload>(question.payloadJson, { prompt: '', options: [] })"
      :model-value="modelValue as MultiChoiceAnswer | undefined"
      @update:model-value="update"
    />
    <TrueFalseQuestion
      v-else-if="question.type === 'TrueFalse'"
      :model-value="modelValue as TrueFalseAnswer | undefined"
      @update:model-value="update"
    />
    <MatchingQuestion
      v-else-if="question.type === 'Matching'"
      :payload="parseJson<MatchingPayload>(question.payloadJson, { prompt: '', left: [], right: [] })"
      :model-value="modelValue as MatchingAnswer | undefined"
      @update:model-value="update"
    />
    <SequencingQuestion
      v-else-if="question.type === 'Sequencing'"
      :payload="parseJson<SequencingPayload>(question.payloadJson, { prompt: '', items: [] })"
      :model-value="modelValue as SequencingAnswer | undefined"
      @update:model-value="update"
    />
    <DragAndDropQuestion
      v-else-if="question.type === 'DragAndDrop'"
      :payload="parseJson<DragAndDropPayload>(question.payloadJson, { prompt: '', items: [], zones: [] })"
      :model-value="modelValue as DragAndDropAnswer | undefined"
      @update:model-value="update"
    />
    <ReflectionQuestion
      v-else-if="question.type === 'Reflection'"
      :payload="parseJson<ReflectionPayload>(question.payloadJson, { prompt: '' })"
      :model-value="modelValue as ReflectionAnswer | undefined"
      @update:model-value="update"
    />
  </div>
</template>

<style scoped>
.question-runner__prompt {
  margin: 0 0 var(--space-2) 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.5;
}

.question-runner__scenario {
  margin: 0 0 var(--space-5) 0;
  padding: var(--space-4);
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-style: italic;
}
</style>
