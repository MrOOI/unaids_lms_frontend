<script setup lang="ts">
/** Admin: quizzes belonging to one module (drafts included). */
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAdminQuiz } from '../../composables/useAdminQuiz'
import { useToast } from '../../composables/useToast'
import type { AdminQuizListItemDto, QuizKind } from '../../lib/api-types'
import Card from '../../components/ui/Card.vue'
import Button from '../../components/ui/Button.vue'
import Modal from '../../components/ui/Modal.vue'
import Badge from '../../components/ui/Badge.vue'
import Spinner from '../../components/ui/Spinner.vue'
import EmptyState from '../../components/ui/EmptyState.vue'
import FormField from '../../components/form/FormField.vue'
import Select from '../../components/ui/Select.vue'

const props = defineProps<{ moduleId: string }>()
const router = useRouter()
const { t } = useI18n()
const admin = useAdminQuiz()
const toast = useToast()

const quizzes = ref<AdminQuizListItemDto[]>([])
const isFetching = ref(true)
const showCreate = ref(false)

const form = reactive({
  kind: 'Formative' as QuizKind,
  passScorePercent: 70,
  maxAttempts: null as number | null,
  questionCount: null as number | null,
  shuffleQuestions: true,
  shuffleAnswers: true,
  isPublished: false,
  sortOrder: 0,
})

onMounted(load)

async function load(): Promise<void> {
  isFetching.value = true
  try {
    quizzes.value = await admin.listQuizzes(props.moduleId)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.loadFailed'))
  } finally {
    isFetching.value = false
  }
}

function openCreate(): void {
  form.kind = 'Formative'
  form.passScorePercent = 70
  form.maxAttempts = null
  form.questionCount = null
  form.shuffleQuestions = true
  form.shuffleAnswers = true
  form.isPublished = false
  form.sortOrder = quizzes.value.length
  showCreate.value = true
}

async function handleCreate(): Promise<void> {
  try {
    const result = await admin.addQuiz(props.moduleId, { ...form })
    showCreate.value = false
    toast.success(t('admin.saved'))
    await router.push({ name: 'admin-quiz-detail', params: { quizId: result.id } })
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  }
}
</script>

<template>
  <div class="admin-module-quizzes">
    <button type="button" class="admin-back" @click="router.back()">← {{ t('common.back') }}</button>

    <div class="admin-page-header">
      <h1>{{ t('admin.quizzes.title') }}</h1>
      <Button variant="primary" @click="openCreate">{{ t('admin.quizzes.add') }}</Button>
    </div>

    <div v-if="isFetching" class="admin-loading"><Spinner :label="t('common.loading')" /></div>

    <EmptyState v-else-if="quizzes.length === 0" icon="📝" :title="t('admin.quizzes.empty')" />

    <div v-else class="quiz-list">
      <Card v-for="quiz in quizzes" :key="quiz.id" :padded="false">
        <RouterLink :to="{ name: 'admin-quiz-detail', params: { quizId: quiz.id } }" class="quiz-row">
          <div class="quiz-row__info">
            <strong>{{ quiz.translations['uz']?.title || quiz.translations[Object.keys(quiz.translations)[0]]?.title || t('admin.quizzes.untitled') }}</strong>
            <span class="quiz-row__meta">
              {{ t('admin.quizzes.questionCount', { count: quiz.authoredQuestionCount }) }} ·
              {{ t('admin.quizzes.passScore', { percent: quiz.passScorePercent }) }}
            </span>
          </div>
          <div class="quiz-row__badges">
            <Badge :tone="quiz.kind === 'Final' ? 'info' : 'neutral'">{{ quiz.kind }}</Badge>
            <Badge :tone="quiz.isPublished ? 'success' : 'neutral'">
              {{ quiz.isPublished ? t('admin.published') : t('admin.draft') }}
            </Badge>
          </div>
        </RouterLink>
      </Card>
    </div>

    <Modal v-model="showCreate" :title="t('admin.quizzes.add')" size="lg">
      <div class="admin-form">
        <FormField :label="t('admin.quizzes.kind')">
          <Select v-model="form.kind" :options="[{ value: 'Formative', label: t('quiz.formative') }, { value: 'Final', label: t('quiz.final') }]" />
        </FormField>
        <FormField :label="t('admin.quizzes.passScore', { percent: '' })">
          <input v-model.number="form.passScorePercent" type="number" min="0" max="100" class="admin-input" />
        </FormField>
        <FormField :label="t('admin.quizzes.maxAttempts')">
          <input v-model.number="form.maxAttempts" type="number" min="1" class="admin-input" placeholder="∞" />
        </FormField>
        <FormField :label="t('admin.quizzes.questionCountLabel')">
          <input v-model.number="form.questionCount" type="number" min="1" class="admin-input" :placeholder="t('admin.quizzes.allQuestions')" />
        </FormField>
        <FormField :label="t('admin.quizzes.sortOrder')">
          <input v-model.number="form.sortOrder" type="number" class="admin-input" />
        </FormField>
        <label class="admin-checkbox">
          <input v-model="form.shuffleQuestions" type="checkbox" />
          <span>{{ t('admin.quizzes.shuffleQuestions') }}</span>
        </label>
        <label class="admin-checkbox">
          <input v-model="form.shuffleAnswers" type="checkbox" />
          <span>{{ t('admin.quizzes.shuffleAnswers') }}</span>
        </label>
        <label class="admin-checkbox">
          <input v-model="form.isPublished" type="checkbox" />
          <span>{{ t('admin.published') }}</span>
        </label>
      </div>
      <template #footer>
        <Button variant="secondary" @click="showCreate = false">{{ t('common.cancel') }}</Button>
        <Button variant="primary" :loading="admin.isLoading.value" @click="handleCreate">{{ t('common.create') }}</Button>
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

.admin-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}

.admin-page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.admin-loading {
  display: flex;
  justify-content: center;
  padding: var(--space-8);
}

.quiz-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.quiz-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5);
  text-decoration: none;
  color: var(--color-text);
  flex-wrap: wrap;
}

.quiz-row__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.quiz-row__meta {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.quiz-row__badges {
  display: flex;
  gap: var(--space-2);
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
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
</style>
