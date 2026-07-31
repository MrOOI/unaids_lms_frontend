<script setup lang="ts">
/** Admin: one quiz's settings, translations, and full question bank (solutions + all-locale payloads). */
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { SupportedLocale } from '@lms/i18n'
import { useAdminQuiz } from '../../composables/useAdminQuiz'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import { QUESTION_TYPES, type AdminQuizDetailDto, type QuestionType, type QuizKind } from '../../lib/api-types'
import { emptyQuestionPayload, emptySolution, parseJson } from '../../lib/questions'
import Card from '../../components/ui/Card.vue'
import Button from '../../components/ui/Button.vue'
import Modal from '../../components/ui/Modal.vue'
import Badge from '../../components/ui/Badge.vue'
import Spinner from '../../components/ui/Spinner.vue'
import EmptyState from '../../components/ui/EmptyState.vue'
import FormField from '../../components/form/FormField.vue'
import Select from '../../components/ui/Select.vue'
import Tabs from '../../components/ui/Tabs.vue'
import TranslationEditor from '../../components/admin/TranslationEditor.vue'
import QuestionEditor from '../../components/admin/QuestionEditor.vue'

const props = defineProps<{ quizId: string }>()
const router = useRouter()
const { t } = useI18n()
const admin = useAdminQuiz()
const toast = useToast()
const { confirm } = useConfirm()

const quiz = ref<AdminQuizDetailDto | null>(null)
const isFetching = ref(true)
const quizLocale = ref<SupportedLocale>('uz')
const savingTranslation = ref(false)

const settingsForm = reactive({
  kind: 'Formative' as QuizKind,
  passScorePercent: 70,
  maxAttempts: null as number | null,
  questionCount: null as number | null,
  shuffleQuestions: true,
  shuffleAnswers: true,
  isPublished: false,
  sortOrder: 0,
})

const expandedQuestion = ref<string | null>(null)
const questionLocales = reactive<Record<string, SupportedLocale>>({})
const solutionDrafts = reactive<Record<string, Record<string, unknown>>>({})
const payloadDrafts = reactive<Record<string, Record<string, unknown>>>({})
const questionSettingsDrafts = reactive<Record<string, { points: number; sortOrder: number; isActive: boolean }>>({})
const savingQuestion = reactive<Record<string, boolean>>({})
const savingQuestionTranslation = reactive<Record<string, boolean>>({})

const showCreate = ref(false)
const createForm = reactive({ type: 'SingleChoice' as QuestionType, points: 1, sortOrder: 1, isActive: true })

onMounted(load)

async function load(): Promise<void> {
  isFetching.value = true
  try {
    quiz.value = await admin.getQuiz(props.quizId)
    settingsForm.kind = quiz.value.kind
    settingsForm.passScorePercent = quiz.value.passScorePercent
    settingsForm.maxAttempts = quiz.value.maxAttempts
    settingsForm.questionCount = quiz.value.questionCount
    settingsForm.shuffleQuestions = quiz.value.shuffleQuestions
    settingsForm.shuffleAnswers = quiz.value.shuffleAnswers
    settingsForm.isPublished = quiz.value.isPublished
    settingsForm.sortOrder = quiz.value.sortOrder

    for (const question of quiz.value.questions) {
      questionLocales[question.id] ??= 'uz'
      solutionDrafts[question.id] = parseJson(question.solutionJson, emptySolution(question.type) as Record<string, unknown>)
      questionSettingsDrafts[question.id] = {
        points: question.points,
        sortOrder: question.sortOrder,
        isActive: question.isActive,
      }
      syncPayloadDraft(question.id)
    }
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.loadFailed'))
  } finally {
    isFetching.value = false
  }
}

function syncPayloadDraft(questionId: string): void {
  const question = quiz.value?.questions.find((q) => q.id === questionId)
  if (!question) return
  const locale = questionLocales[questionId]
  const raw = question.translations[locale]?.payloadJson
  const empty = emptyQuestionPayload(question.type) as unknown as Record<string, unknown>
  payloadDrafts[questionId] = raw ? parseJson(raw, empty) : { ...empty }
}

function setQuestionLocale(questionId: string, locale: SupportedLocale): void {
  questionLocales[questionId] = locale
  syncPayloadDraft(questionId)
}

async function saveSettings(): Promise<void> {
  if (!quiz.value) return
  try {
    await admin.updateQuiz(props.quizId, { ...settingsForm })
    toast.success(t('admin.saved'))
    await load()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  }
}

const quizTranslationsMap = () => {
  const map: Record<string, Record<string, string>> = {}
  for (const [locale, value] of Object.entries(quiz.value?.translations ?? {})) {
    map[locale] = { title: value.title, description: value.description }
  }
  return map
}

async function saveQuizTranslation(locale: string, values: Record<string, string>): Promise<void> {
  savingTranslation.value = true
  try {
    await admin.upsertQuizTranslation(props.quizId, locale, { title: values.title, description: values.description })
    toast.success(t('admin.saved'))
    await load()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  } finally {
    savingTranslation.value = false
  }
}

function openCreateQuestion(): void {
  createForm.type = 'SingleChoice'
  createForm.points = 1
  createForm.sortOrder = (quiz.value?.questions.length ?? 0) + 1
  createForm.isActive = true
  showCreate.value = true
}

async function createQuestion(): Promise<void> {
  try {
    await admin.addQuestion(props.quizId, {
      type: createForm.type,
      points: createForm.points,
      sortOrder: createForm.sortOrder,
      isActive: createForm.isActive,
      solutionJson: JSON.stringify(emptySolution(createForm.type)),
    })
    showCreate.value = false
    toast.success(t('admin.saved'))
    await load()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  }
}

async function saveQuestion(questionId: string): Promise<void> {
  const question = quiz.value?.questions.find((q) => q.id === questionId)
  if (!question) return
  savingQuestion[questionId] = true
  try {
    await admin.updateQuestion(questionId, {
      type: question.type,
      points: questionSettingsDrafts[questionId].points,
      sortOrder: questionSettingsDrafts[questionId].sortOrder,
      isActive: questionSettingsDrafts[questionId].isActive,
      solutionJson: JSON.stringify(solutionDrafts[questionId] ?? {}),
    })
    toast.success(t('admin.saved'))
    await load()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  } finally {
    savingQuestion[questionId] = false
  }
}

async function saveQuestionTranslation(questionId: string): Promise<void> {
  savingQuestionTranslation[questionId] = true
  try {
    await admin.upsertQuestionTranslation(questionId, questionLocales[questionId], {
      payloadJson: JSON.stringify(payloadDrafts[questionId] ?? {}),
    })
    toast.success(t('admin.saved'))
    await load()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  } finally {
    savingQuestionTranslation[questionId] = false
  }
}

async function deleteQuestion(questionId: string): Promise<void> {
  const confirmed = await confirm({
    title: t('admin.questions.deleteConfirmTitle'),
    message: t('admin.questions.deleteConfirmMessage'),
    danger: true,
    confirmLabel: t('common.delete'),
  })
  if (!confirmed) return
  try {
    await admin.deleteQuestion(questionId)
    toast.success(t('admin.deleted'))
    await load()
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  }
}

const localeTabs: SupportedLocale[] = ['uz', 'kaa', 'en', 'ru']
</script>

<template>
  <div class="admin-quiz-detail">
    <button type="button" class="admin-back" @click="router.back()">← {{ t('common.back') }}</button>

    <div v-if="isFetching" class="admin-loading"><Spinner :label="t('common.loading')" /></div>

    <template v-else-if="quiz">
      <div class="admin-grid">
        <Card :title="t('admin.quizzes.settings')">
          <div class="admin-form">
            <FormField :label="t('admin.quizzes.kind')">
              <Select
                v-model="settingsForm.kind"
                :options="[{ value: 'Formative', label: t('quiz.formative') }, { value: 'Final', label: t('quiz.final') }]"
              />
            </FormField>
            <FormField :label="t('admin.quizzes.passScore', { percent: '' })">
              <input v-model.number="settingsForm.passScorePercent" type="number" min="0" max="100" class="admin-input" />
            </FormField>
            <FormField :label="t('admin.quizzes.maxAttempts')">
              <input v-model.number="settingsForm.maxAttempts" type="number" min="1" class="admin-input" placeholder="∞" />
            </FormField>
            <FormField :label="t('admin.quizzes.questionCountLabel')">
              <input v-model.number="settingsForm.questionCount" type="number" min="1" class="admin-input" :placeholder="t('admin.quizzes.allQuestions')" />
            </FormField>
            <FormField :label="t('admin.quizzes.sortOrder')">
              <input v-model.number="settingsForm.sortOrder" type="number" class="admin-input" />
            </FormField>
            <label class="admin-checkbox">
              <input v-model="settingsForm.shuffleQuestions" type="checkbox" />
              <span>{{ t('admin.quizzes.shuffleQuestions') }}</span>
            </label>
            <label class="admin-checkbox">
              <input v-model="settingsForm.shuffleAnswers" type="checkbox" />
              <span>{{ t('admin.quizzes.shuffleAnswers') }}</span>
            </label>
            <label class="admin-checkbox">
              <input v-model="settingsForm.isPublished" type="checkbox" />
              <span>{{ t('admin.published') }}</span>
            </label>
            <div class="admin-form__actions">
              <Button variant="primary" size="sm" @click="saveSettings">{{ t('common.save') }}</Button>
            </div>
          </div>
        </Card>

        <Card :title="t('admin.quizzes.translations')">
          <TranslationEditor
            v-model:active-locale="quizLocale"
            :translations="quizTranslationsMap()"
            :saving="savingTranslation"
            :fields="[
              { key: 'title', label: t('admin.fields.title') },
              { key: 'description', label: t('admin.fields.description'), multiline: true },
            ]"
            @save="saveQuizTranslation"
          />
        </Card>
      </div>

      <Card :title="t('admin.questions.title')">
        <template #actions>
          <Button variant="primary" size="sm" @click="openCreateQuestion">{{ t('admin.questions.add') }}</Button>
        </template>

        <EmptyState v-if="quiz.questions.length === 0" icon="❓" :title="t('admin.questions.empty')" />

        <div v-for="question in quiz.questions" :key="question.id" class="question-card">
          <button type="button" class="question-card__header" @click="expandedQuestion = expandedQuestion === question.id ? null : question.id">
            <Badge tone="info">{{ question.type }}</Badge>
            <span class="question-card__points">{{ t('admin.questions.pointsShort', { points: question.points }) }}</span>
            <Badge :tone="question.isActive ? 'success' : 'neutral'">
              {{ question.isActive ? t('admin.questions.active') : t('admin.questions.inactive') }}
            </Badge>
            <span class="question-card__toggle" aria-hidden="true">{{ expandedQuestion === question.id ? '▲' : '▼' }}</span>
          </button>

          <div v-if="expandedQuestion === question.id" class="question-card__body">
            <div class="question-settings">
              <FormField :label="t('admin.questions.points')">
                <input v-model.number="questionSettingsDrafts[question.id].points" type="number" min="1" class="admin-input" />
              </FormField>
              <FormField :label="t('admin.questions.sortOrder')">
                <input v-model.number="questionSettingsDrafts[question.id].sortOrder" type="number" class="admin-input" />
              </FormField>
              <label class="admin-checkbox">
                <input v-model="questionSettingsDrafts[question.id].isActive" type="checkbox" />
                <span>{{ t('admin.questions.active') }}</span>
              </label>
            </div>

            <Tabs
              :model-value="questionLocales[question.id]"
              :items="localeTabs.map((code) => ({ value: code, label: code.toUpperCase(), flagged: !question.translations[code] }))"
              @update:model-value="(loc) => setQuestionLocale(question.id, loc as SupportedLocale)"
            />

            <QuestionEditor
              :type="question.type"
              :solution="solutionDrafts[question.id] ?? {}"
              :payload="payloadDrafts[question.id] ?? {}"
              @update:solution="(v) => (solutionDrafts[question.id] = v)"
              @update:payload="(v) => (payloadDrafts[question.id] = v)"
            />

            <div class="question-card__actions">
              <Button variant="danger" size="sm" @click="deleteQuestion(question.id)">{{ t('common.delete') }}</Button>
              <Button variant="secondary" size="sm" :loading="savingQuestionTranslation[question.id]" @click="saveQuestionTranslation(question.id)">
                {{ t('admin.saveTranslation') }}
              </Button>
              <Button variant="primary" size="sm" :loading="savingQuestion[question.id]" @click="saveQuestion(question.id)">
                {{ t('admin.questions.saveSolution') }}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </template>

    <Modal v-model="showCreate" :title="t('admin.questions.add')">
      <div class="admin-form">
        <FormField :label="t('admin.questions.type')">
          <Select v-model="createForm.type" :options="QUESTION_TYPES.map((type) => ({ value: type, label: type }))" />
        </FormField>
        <FormField :label="t('admin.questions.points')">
          <input v-model.number="createForm.points" type="number" min="1" class="admin-input" />
        </FormField>
        <FormField :label="t('admin.questions.sortOrder')">
          <input v-model.number="createForm.sortOrder" type="number" class="admin-input" />
        </FormField>
        <label class="admin-checkbox">
          <input v-model="createForm.isActive" type="checkbox" />
          <span>{{ t('admin.questions.active') }}</span>
        </label>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showCreate = false">{{ t('common.cancel') }}</Button>
        <Button variant="primary" @click="createQuestion">{{ t('common.create') }}</Button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.admin-back {
  border: none;
  background: transparent;
  color: var(--module-2);
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-bottom: var(--space-6);
}

.admin-loading {
  display: flex;
  justify-content: center;
  padding: var(--space-8);
}

.admin-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.admin-form__actions {
  display: flex;
  justify-content: flex-end;
}

.admin-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: inherit;
}

.admin-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.875rem;
  font-weight: 600;
}

.question-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-3);
  overflow: hidden;
}

.question-card__header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4);
  border: none;
  background: var(--color-surface-alt);
  cursor: pointer;
  text-align: left;
}

.question-card__points {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.question-card__toggle {
  margin-left: auto;
  color: var(--color-text-muted);
}

.question-card__body {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.question-settings {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  align-items: end;
}

.question-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  flex-wrap: wrap;
}

@media (max-width: 800px) {
  .admin-grid,
  .question-settings {
    grid-template-columns: 1fr;
  }
}
</style>
