<script setup lang="ts">
/**
 * Structured solution + payload editor for one question, per type. `solution`
 * is locale-independent (shown once); `payload` is the current locale's
 * presentation data (prompt/options/feedback) — the parent swaps `payload`
 * when the locale tab changes and keeps `solution` constant across locales.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { QuestionType } from '../../lib/api-types'
import type { OptionItem } from '../../lib/questions'
import OptionListEditor from './OptionListEditor.vue'
import Textarea from '../ui/Textarea.vue'
import FormField from '../form/FormField.vue'

const props = defineProps<{
  type: QuestionType
  solution: Record<string, unknown>
  payload: Record<string, unknown>
}>()
const emit = defineEmits<{
  'update:solution': [Record<string, unknown>]
  'update:payload': [Record<string, unknown>]
}>()
const { t } = useI18n()

function setSolution(patch: Record<string, unknown>): void {
  emit('update:solution', { ...props.solution, ...patch })
}
function setPayload(patch: Record<string, unknown>): void {
  emit('update:payload', { ...props.payload, ...patch })
}

const options = computed<OptionItem[]>(() => (props.payload.options as OptionItem[]) ?? [])
const leftItems = computed<OptionItem[]>(() => (props.payload.left as OptionItem[]) ?? [])
const rightItems = computed<OptionItem[]>(() => (props.payload.right as OptionItem[]) ?? [])
const sequenceItems = computed<OptionItem[]>(() => (props.payload.items as OptionItem[]) ?? [])
const dndItems = computed<OptionItem[]>(() => (props.payload.items as OptionItem[]) ?? [])
const zones = computed<OptionItem[]>(() => (props.payload.zones as OptionItem[]) ?? [])

function setOptions(next: OptionItem[]): void {
  setPayload({ options: next })
}

function toggleMultiCorrect(id: string): void {
  const current = (props.solution.correct as string[]) ?? []
  setSolution({ correct: current.includes(id) ? current.filter((x) => x !== id) : [...current, id] })
}

function setPairSolution(leftId: string, rightId: string): void {
  setSolution({ pairs: { ...((props.solution.pairs as Record<string, string>) ?? {}), [leftId]: rightId } })
}

function setPlacementSolution(itemId: string, zoneId: string): void {
  setSolution({ placements: { ...((props.solution.placements as Record<string, string>) ?? {}), [itemId]: zoneId } })
}

function setSequenceItems(next: OptionItem[]): void {
  // Author's list order *is* the correct order — kept in sync automatically.
  setPayload({ items: next })
  setSolution({ order: next.map((i) => i.id) })
}

const feedback = computed(() => (props.payload.feedback as { correct?: string; incorrect?: string }) ?? {})
function setFeedback(key: 'correct' | 'incorrect', value: string): void {
  setPayload({ feedback: { ...feedback.value, [key]: value } })
}
</script>

<template>
  <div class="question-editor">
    <FormField :label="t('admin.questions.prompt')">
      <Textarea :model-value="(payload.prompt as string) ?? ''" :rows="2" @update:model-value="setPayload({ prompt: $event })" />
    </FormField>

    <FormField v-if="type === 'Scenario'" :label="t('admin.questions.scenario')">
      <Textarea :model-value="(payload.scenario as string) ?? ''" :rows="3" @update:model-value="setPayload({ scenario: $event })" />
    </FormField>

    <!-- SingleChoice / Scenario / MultiChoice: options + correctness -->
    <template v-if="type === 'SingleChoice' || type === 'Scenario' || type === 'MultiChoice'">
      <FormField :label="t('admin.questions.options')">
        <OptionListEditor :items="options" :add-label="t('admin.questions.addOption')" @update:items="setOptions" />
      </FormField>

      <FormField :label="t('admin.questions.correctAnswer')">
        <div v-if="type === 'MultiChoice'" class="correctness-list">
          <label v-for="opt in options" :key="opt.id" class="correctness-row">
            <input
              type="checkbox"
              :checked="((solution.correct as string[]) ?? []).includes(opt.id)"
              @change="toggleMultiCorrect(opt.id)"
            />
            <span>{{ opt.text || t('admin.questions.untitledOption') }}</span>
          </label>
        </div>
        <div v-else class="correctness-list">
          <label v-for="opt in options" :key="opt.id" class="correctness-row">
            <input
              type="radio"
              name="correct-single"
              :checked="solution.correct === opt.id"
              @change="setSolution({ correct: opt.id })"
            />
            <span>{{ opt.text || t('admin.questions.untitledOption') }}</span>
          </label>
        </div>
      </FormField>
    </template>

    <!-- TrueFalse -->
    <FormField v-else-if="type === 'TrueFalse'" :label="t('admin.questions.correctAnswer')">
      <div class="correctness-list">
        <label class="correctness-row">
          <input type="radio" name="tf" :checked="solution.correct === true" @change="setSolution({ correct: true })" />
          <span>{{ t('quiz.true') }}</span>
        </label>
        <label class="correctness-row">
          <input type="radio" name="tf" :checked="solution.correct === false" @change="setSolution({ correct: false })" />
          <span>{{ t('quiz.false') }}</span>
        </label>
      </div>
    </FormField>

    <!-- Matching -->
    <template v-else-if="type === 'Matching'">
      <div class="matching-columns">
        <FormField :label="t('admin.questions.leftColumn')">
          <OptionListEditor :items="leftItems" :add-label="t('admin.questions.addItem')" @update:items="setPayload({ left: $event })" />
        </FormField>
        <FormField :label="t('admin.questions.rightColumn')">
          <OptionListEditor :items="rightItems" :add-label="t('admin.questions.addItem')" @update:items="setPayload({ right: $event })" />
        </FormField>
      </div>
      <FormField :label="t('admin.questions.correctPairs')">
        <div v-for="left in leftItems" :key="left.id" class="pair-row">
          <span>{{ left.text || t('admin.questions.untitledOption') }}</span>
          <select
            class="pair-row__select"
            :value="(solution.pairs as Record<string, string> | undefined)?.[left.id] ?? ''"
            @change="setPairSolution(left.id, ($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled>{{ t('quiz.selectMatch') }}</option>
            <option v-for="right in rightItems" :key="right.id" :value="right.id">{{ right.text }}</option>
          </select>
        </div>
      </FormField>
    </template>

    <!-- Sequencing -->
    <template v-else-if="type === 'Sequencing'">
      <FormField :label="t('admin.questions.itemsInCorrectOrder')">
        <OptionListEditor :items="sequenceItems" :add-label="t('admin.questions.addItem')" @update:items="setSequenceItems" />
      </FormField>
    </template>

    <!-- DragAndDrop -->
    <template v-else-if="type === 'DragAndDrop'">
      <div class="matching-columns">
        <FormField :label="t('admin.questions.items')">
          <OptionListEditor :items="dndItems" :add-label="t('admin.questions.addItem')" @update:items="setPayload({ items: $event })" />
        </FormField>
        <FormField :label="t('admin.questions.zones')">
          <OptionListEditor :items="zones" :add-label="t('admin.questions.addZone')" @update:items="setPayload({ zones: $event })" />
        </FormField>
      </div>
      <FormField :label="t('admin.questions.correctPlacements')">
        <div v-for="item in dndItems" :key="item.id" class="pair-row">
          <span>{{ item.text || t('admin.questions.untitledOption') }}</span>
          <select
            class="pair-row__select"
            :value="(solution.placements as Record<string, string> | undefined)?.[item.id] ?? ''"
            @change="setPlacementSolution(item.id, ($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled>{{ t('quiz.selectZone') }}</option>
            <option v-for="zone in zones" :key="zone.id" :value="zone.id">{{ zone.text }}</option>
          </select>
        </div>
      </FormField>
    </template>

    <!-- Reflection -->
    <FormField v-else-if="type === 'Reflection'" :label="t('admin.questions.placeholder')">
      <input
        type="text"
        class="reflection-placeholder"
        :value="(payload.placeholder as string) ?? ''"
        @input="setPayload({ placeholder: ($event.target as HTMLInputElement).value })"
      />
    </FormField>

    <!-- Feedback (graded types only) -->
    <div v-if="type !== 'Reflection'" class="feedback-grid">
      <FormField :label="t('admin.questions.feedbackCorrect')">
        <Textarea :model-value="feedback.correct ?? ''" :rows="2" @update:model-value="setFeedback('correct', $event)" />
      </FormField>
      <FormField :label="t('admin.questions.feedbackIncorrect')">
        <Textarea :model-value="feedback.incorrect ?? ''" :rows="2" @update:model-value="setFeedback('incorrect', $event)" />
      </FormField>
    </div>
  </div>
</template>

<style scoped>
.question-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.correctness-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.correctness-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.875rem;
}

.matching-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.pair-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) 0;
}

.pair-row__select {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.reflection-placeholder {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.feedback-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}

@media (max-width: 700px) {
  .matching-columns,
  .feedback-grid {
    grid-template-columns: 1fr;
  }
}
</style>
