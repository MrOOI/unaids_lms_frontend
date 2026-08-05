<script setup lang="ts">
/** Course feedback (§16) — registration, navigation, content, interactivity, video, technical issues, outcome, satisfaction. */
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCourses } from '../composables/useCourses'
import { useFeedback } from '../composables/useFeedback'
import { useToast } from '../composables/useToast'
import Card from '../components/ui/Card.vue'
import Button from '../components/ui/Button.vue'
import Spinner from '../components/ui/Spinner.vue'
import RatingInput from '../components/form/RatingInput.vue'
import FormField from '../components/form/FormField.vue'
import Textarea from '../components/ui/Textarea.vue'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { currentCourse, fetchCourseDetail } = useCourses()
const { isLoading, submit, getMyFeedback } = useFeedback()
const toast = useToast()

const courseSlug = route.params.slug as string
const isFetching = ref(true)

const form = reactive({
  registrationRating: 3,
  navigationRating: 3,
  contentQualityRating: 3,
  interactivityRating: 3,
  videoRating: 3,
  learningOutcomeRating: 3,
  satisfactionRating: 3,
  technicalIssuesText: '',
  additionalComments: '',
})

onMounted(async () => {
  try {
    const course = await fetchCourseDetail(courseSlug, locale.value)
    const existing = await getMyFeedback(course.id)
    if (existing) {
      form.registrationRating = existing.registrationRating
      form.navigationRating = existing.navigationRating
      form.contentQualityRating = existing.contentQualityRating
      form.interactivityRating = existing.interactivityRating
      form.videoRating = existing.videoRating
      form.learningOutcomeRating = existing.learningOutcomeRating
      form.satisfactionRating = existing.satisfactionRating
      form.technicalIssuesText = existing.technicalIssuesText ?? ''
      form.additionalComments = existing.additionalComments ?? ''
    }
  } catch {
    // Course fetch failure surfaces as a blank page; not fatal for a feedback form.
  } finally {
    isFetching.value = false
  }
})

async function handleSubmit(): Promise<void> {
  if (!currentCourse.value) return
  try {
    await submit(currentCourse.value.id, {
      registrationRating: form.registrationRating,
      navigationRating: form.navigationRating,
      contentQualityRating: form.contentQualityRating,
      interactivityRating: form.interactivityRating,
      videoRating: form.videoRating,
      learningOutcomeRating: form.learningOutcomeRating,
      satisfactionRating: form.satisfactionRating,
      technicalIssuesText: form.technicalIssuesText.trim() || null,
      additionalComments: form.additionalComments.trim() || null,
    })
    toast.success(t('feedback.submitted'))
    await router.push({ name: 'course-detail', params: { slug: courseSlug } })
  } catch {
    toast.error(t('feedback.submitFailed'))
  }
}
</script>

<template>
  <div class="feedback-view">
    <div class="feedback-header">
      <button type="button" class="feedback-back" @click="router.push({ name: 'course-detail', params: { slug: courseSlug } })">
        &larr; {{ t('common.back') }}
      </button>
      <h1>{{ t('feedback.title') }}</h1>
      <p v-if="currentCourse">{{ t('feedback.subtitle', { course: currentCourse.title }) }}</p>
    </div>

    <div v-if="isFetching" class="feedback-loading"><Spinner :label="t('common.loading')" /></div>

    <form v-else class="feedback-body" @submit.prevent="handleSubmit">
      <Card :title="t('feedback.ratingsSection')">
        <div class="feedback-ratings">
          <RatingInput v-model="form.registrationRating" :label="t('feedback.categories.registration')" />
          <RatingInput v-model="form.navigationRating" :label="t('feedback.categories.navigation')" />
          <RatingInput v-model="form.contentQualityRating" :label="t('feedback.categories.contentQuality')" />
          <RatingInput v-model="form.interactivityRating" :label="t('feedback.categories.interactivity')" />
          <RatingInput v-model="form.videoRating" :label="t('feedback.categories.video')" />
          <RatingInput v-model="form.learningOutcomeRating" :label="t('feedback.categories.learningOutcome')" />
          <RatingInput v-model="form.satisfactionRating" :label="t('feedback.categories.satisfaction')" />
        </div>
      </Card>

      <Card :title="t('feedback.detailsSection')">
        <div class="feedback-details">
          <FormField :label="t('feedback.categories.technicalIssues')" :help-text="t('feedback.technicalIssuesHint')">
            <Textarea v-model="form.technicalIssuesText" :rows="3" />
          </FormField>
          <FormField :label="t('feedback.additionalComments')">
            <Textarea v-model="form.additionalComments" :rows="4" />
          </FormField>
        </div>
      </Card>

      <div class="feedback-actions">
        <Button type="submit" variant="primary" :loading="isLoading">{{ t('feedback.submit') }}</Button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.feedback-view {
  min-height: 100%;
}

.feedback-header {
  padding: var(--space-8);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.feedback-back {
  border: none;
  background: transparent;
  color: var(--color-accent, var(--module-1));
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-bottom: var(--space-4);
}

.feedback-header h1 {
  margin: 0 0 var(--space-2) 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text);
}

.feedback-header p {
  margin: 0;
  color: var(--color-text-muted);
}

.feedback-loading {
  display: flex;
  justify-content: center;
  padding: var(--space-8);
}

.feedback-body {
  max-width: 700px;
  margin: 0 auto;
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.feedback-ratings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.feedback-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.feedback-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .feedback-ratings {
    grid-template-columns: 1fr;
  }
}
</style>
