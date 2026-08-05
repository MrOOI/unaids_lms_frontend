<script setup lang="ts">
/** Quiz attempt flow: start/resume → answer one question at a time → submit → results. */
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuizzes } from '../composables/useQuizzes'
import QuestionRunner from '../components/quiz/QuestionRunner.vue'
import Button from '../components/ui/Button.vue'
import Alert from '../components/ui/Alert.vue'
import Badge from '../components/ui/Badge.vue'
import Spinner from '../components/ui/Spinner.vue'
import Card from '../components/ui/Card.vue'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const {
  activeAttempt,
  lastResult,
  history,
  isLoading,
  error,
  startAttempt,
  submitAttempt,
  fetchHistory,
  clearError,
} = useQuizzes()

const quizId = computed(() => route.params.quizId as string)
const answers = reactive<Record<string, unknown>>({})
const currentIndex = ref(0)
const showHistory = ref(false)
const isQueuedOffline = ref(false)

onMounted(begin)

async function begin(): Promise<void> {
  Object.keys(answers).forEach((key) => delete answers[key])
  currentIndex.value = 0
  isQueuedOffline.value = false
  try {
    await startAttempt(quizId.value, locale.value)
  } catch {
    // surfaced via `error`
  }
}

const questions = computed(() => activeAttempt.value?.questions ?? [])
const currentQuestion = computed(() => questions.value[currentIndex.value])
const isLastQuestion = computed(() => currentIndex.value === questions.value.length - 1)
const answeredCount = computed(() => Object.keys(answers).filter((k) => answers[k] !== undefined).length)

function goTo(index: number): void {
  if (index >= 0 && index < questions.value.length) currentIndex.value = index
}

async function handleSubmit(): Promise<void> {
  if (!activeAttempt.value) return
  clearError()
  try {
    const result = await submitAttempt(
      activeAttempt.value.id,
      {
        answers: questions.value.map((q) => ({
          questionId: q.id,
          answerJson: JSON.stringify(answers[q.id] ?? {}),
        })),
      },
      locale.value,
    )
    isQueuedOffline.value = result === 'queued'
  } catch {
    // surfaced via `error`
  }
}

async function handleRetry(): Promise<void> {
  await begin()
}

async function toggleHistory(): Promise<void> {
  showHistory.value = !showHistory.value
  if (showHistory.value) {
    try {
      await fetchHistory(quizId.value)
    } catch {
      // non-fatal
    }
  }
}

function feedbackFor(questionId: string): string | null {
  return lastResult.value?.answers.find((a) => a.questionId === questionId)?.feedback ?? null
}

function isCorrect(questionId: string): boolean | null {
  return lastResult.value?.answers.find((a) => a.questionId === questionId)?.isCorrect ?? null
}
</script>

<template>
  <div class="quiz-view">
    <div class="quiz-header">
      <button type="button" class="back-button" @click="router.back()">← {{ t('common.back') }}</button>
    </div>

    <div class="quiz-body">
      <Alert v-if="error" type="error" dismissible @dismiss="clearError">{{ error }}</Alert>

      <div v-if="isLoading && !activeAttempt && !lastResult" class="quiz-loading">
        <Spinner :label="t('common.loading')" />
      </div>

      <!-- Submitted while offline: answers are saved and will be graded once reconnected, not scored yet. -->
      <Card v-else-if="isQueuedOffline" :title="t('quiz.queuedTitle')">
        <p>{{ t('quiz.queuedMessage') }}</p>
        <template #footer>
          <Button variant="primary" @click="router.back()">{{ t('common.back') }}</Button>
        </template>
      </Card>

      <!-- Results -->
      <Card v-else-if="lastResult" :title="t('quiz.resultTitle')">
        <div class="result-summary">
          <Badge :tone="lastResult.passed ? 'success' : 'error'">
            {{ lastResult.passed ? t('quiz.passed') : t('quiz.notPassed') }}
          </Badge>
          <p class="result-score">
            {{ t('quiz.scoreLine', { score: lastResult.scorePoints, max: lastResult.maxPoints, percent: lastResult.scorePercent }) }}
          </p>
        </div>

        <div class="result-answers">
          <div v-for="question in questions" :key="question.id" class="result-answer">
            <span class="result-answer__icon" aria-hidden="true">
              <template v-if="isCorrect(question.id) === true">✓</template>
              <template v-else-if="isCorrect(question.id) === false">✕</template>
              <template v-else>•</template>
            </span>
            <div class="result-answer__body">
              <QuestionRunner :question="question" :model-value="answers[question.id]" @update:model-value="() => {}" />
              <p v-if="feedbackFor(question.id)" class="result-answer__feedback">{{ feedbackFor(question.id) }}</p>
            </div>
          </div>
        </div>

        <template #footer>
          <Button variant="secondary" @click="router.back()">{{ t('common.back') }}</Button>
          <Button variant="primary" @click="handleRetry">{{ t('quiz.tryAgain') }}</Button>
        </template>
      </Card>

      <!-- In progress -->
      <Card v-else-if="currentQuestion" :title="t('quiz.questionOf', { current: currentIndex + 1, total: questions.length })">
        <template #actions>
          <span class="quiz-answered-count">{{ t('quiz.answeredCount', { answered: answeredCount, total: questions.length }) }}</span>
        </template>

        <div class="quiz-progress-dots">
          <button
            v-for="(q, index) in questions"
            :key="q.id"
            type="button"
            class="quiz-dot"
            :class="{ 'quiz-dot--active': index === currentIndex, 'quiz-dot--answered': answers[q.id] !== undefined }"
            :aria-label="t('quiz.goToQuestion', { number: index + 1 })"
            @click="goTo(index)"
          />
        </div>

        <QuestionRunner
          :question="currentQuestion"
          :model-value="answers[currentQuestion.id]"
          @update:model-value="(value) => (answers[currentQuestion.id] = value)"
        />

        <template #footer>
          <Button variant="secondary" :disabled="currentIndex === 0" @click="goTo(currentIndex - 1)">
            {{ t('quiz.previous') }}
          </Button>
          <Button v-if="!isLastQuestion" variant="primary" @click="goTo(currentIndex + 1)">
            {{ t('quiz.next') }}
          </Button>
          <Button v-else variant="primary" :loading="isLoading" @click="handleSubmit">
            {{ t('quiz.submit') }}
          </Button>
        </template>
      </Card>

      <div class="quiz-history-toggle">
        <button type="button" @click="toggleHistory">
          {{ showHistory ? t('quiz.hideHistory') : t('quiz.showHistory') }}
        </button>
      </div>

      <Card v-if="showHistory" :title="t('quiz.historyTitle')">
        <p v-if="history.length === 0" class="quiz-history-empty">{{ t('quiz.noHistory') }}</p>
        <ul v-else class="quiz-history-list">
          <li v-for="attempt in history" :key="attempt.attemptId" class="quiz-history-item">
            <span>{{ new Date(attempt.startedAt).toLocaleDateString(locale) }}</span>
            <Badge :tone="attempt.passed ? 'success' : attempt.status === 'Submitted' ? 'error' : 'neutral'">
              {{ attempt.status === 'Submitted' ? `${attempt.scorePercent}%` : t('quiz.inProgress') }}
            </Badge>
          </li>
        </ul>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.quiz-view {
  min-height: 100%;
}

.quiz-header {
  padding: var(--space-4) var(--space-8);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.back-button {
  border: none;
  background: transparent;
  color: var(--module-1);
  font-weight: 600;
  cursor: pointer;
  padding: var(--space-2) var(--space-4);
}

.quiz-body {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.quiz-loading {
  display: flex;
  justify-content: center;
  padding: var(--space-8);
}

.quiz-answered-count {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.quiz-progress-dots {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.quiz-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
  padding: 0;
}

.quiz-dot--answered {
  background: var(--module-primary, var(--color-focus));
  border-color: var(--module-primary, var(--color-focus));
}

.quiz-dot--active {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.result-summary {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}

.result-score {
  margin: 0;
  font-weight: 600;
  color: var(--color-text);
}

.result-answers {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.result-answer {
  display: flex;
  gap: var(--space-3);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}

.result-answer:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.result-answer__icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-surface-alt);
  font-weight: 700;
}

.result-answer__body {
  flex: 1;
  pointer-events: none;
}

.result-answer__feedback {
  margin: var(--space-3) 0 0 0;
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--color-text);
}

.quiz-history-toggle {
  text-align: center;
}

.quiz-history-toggle button {
  border: none;
  background: transparent;
  color: var(--module-1);
  font-weight: 600;
  cursor: pointer;
}

.quiz-history-empty {
  margin: 0;
  color: var(--color-text-muted);
}

.quiz-history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.quiz-history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.875rem;
}

.quiz-history-item:last-child {
  border-bottom: none;
}
</style>
