<script setup lang="ts">
/**
 * Profile — only shows data the backend actually exposes: UserResponse
 * (id, email, fullName, preferredLocale, roles) plus the photo upload
 * endpoint. There is no profile-update endpoint beyond the photo, and
 * region/district/organization/profession are write-only at registration
 * (never returned by GET /auth/me) — so this view doesn't pretend to edit
 * fields it can't read back.
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useConfirm } from '../composables/useConfirm'
import Button from '../components/ui/Button.vue'
import Alert from '../components/ui/Alert.vue'
import Card from '../components/ui/Card.vue'
import Badge from '../components/ui/Badge.vue'

const { t } = useI18n()
const router = useRouter()
const { user, uploadProfilePhoto, logout } = useAuth()
const { confirm } = useConfirm()

const photoInput = ref<HTMLInputElement | null>(null)
const selectedPhoto = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const isUploadingPhoto = ref(false)
const photoError = ref('')
const photoSuccess = ref('')

function handlePhotoSelect(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    photoError.value = t('profile.invalidFileType')
    return
  }
  if (file.size > 100 * 1024 * 1024) {
    photoError.value = t('profile.fileTooLarge')
    return
  }

  selectedPhoto.value = file
  photoError.value = ''

  const reader = new FileReader()
  reader.onload = (e) => {
    photoPreview.value = (e.target?.result as string) || null
  }
  reader.readAsDataURL(file)
}

async function handleUploadPhoto(): Promise<void> {
  if (!selectedPhoto.value) return
  isUploadingPhoto.value = true
  photoError.value = ''
  photoSuccess.value = ''
  try {
    const result = await uploadProfilePhoto(selectedPhoto.value)
    photoSuccess.value = result.message
    selectedPhoto.value = null
    photoPreview.value = null
    if (photoInput.value) photoInput.value.value = ''
  } catch (err) {
    photoError.value = err instanceof Error ? err.message : 'Upload failed'
  } finally {
    isUploadingPhoto.value = false
  }
}

function triggerPhotoUpload(): void {
  photoInput.value?.click()
}

async function handleLogout(): Promise<void> {
  const confirmed = await confirm({
    title: t('profile.confirmLogout'),
    message: t('profile.logoutHint'),
    confirmLabel: t('nav.signOut'),
    danger: true,
  })
  if (confirmed) {
    await logout()
    await router.push({ name: 'login' })
  }
}
</script>

<template>
  <div class="profile-view">
    <div class="profile-header">
      <h1>{{ t('profile.title') }}</h1>
      <p>{{ t('profile.subtitle') }}</p>
    </div>

    <div class="profile-container">
      <Card :title="t('profile.photoSection')">
        <Alert v-if="photoError" type="error" class="section-alert" dismissible @dismiss="photoError = ''">
          {{ photoError }}
        </Alert>
        <Alert v-if="photoSuccess" type="success" class="section-alert" dismissible @dismiss="photoSuccess = ''">
          {{ photoSuccess }}
        </Alert>

        <div class="photo-upload">
          <div class="photo-preview-area">
            <div v-if="photoPreview" class="photo-preview">
              <img :src="photoPreview" :alt="t('profile.photoPreview')" />
            </div>
            <div v-else class="photo-placeholder">
              <p>{{ t('profile.noPhotoSelected') }}</p>
            </div>
          </div>

          <input ref="photoInput" type="file" accept="image/*" hidden @change="handlePhotoSelect" />

          <div class="photo-actions">
            <Button type="button" variant="secondary" @click="triggerPhotoUpload">
              {{ t('profile.selectPhoto') }}
            </Button>
            <Button
              v-if="selectedPhoto"
              type="button"
              variant="primary"
              :loading="isUploadingPhoto"
              @click="handleUploadPhoto"
            >
              {{ t('profile.uploadPhoto') }}
            </Button>
          </div>

          <p class="photo-hint">{{ t('profile.photoHint') }}</p>
        </div>
      </Card>

      <Card :title="t('profile.infoSection')">
        <dl class="profile-info">
          <div class="profile-info__row">
            <dt>{{ t('auth.form.fullName') }}</dt>
            <dd>{{ user?.fullName }}</dd>
          </div>
          <div class="profile-info__row">
            <dt>{{ t('auth.form.email') }}</dt>
            <dd>{{ user?.email }}</dd>
          </div>
          <div class="profile-info__row">
            <dt>{{ t('auth.form.language') }}</dt>
            <dd>{{ user?.preferredLocale?.toUpperCase() }}</dd>
          </div>
          <div class="profile-info__row">
            <dt>{{ t('profile.roles') }}</dt>
            <dd>
              <Badge v-for="role in user?.roles ?? []" :key="role" tone="info">{{ role }}</Badge>
            </dd>
          </div>
        </dl>
        <p class="profile-note">{{ t('profile.editNote') }}</p>
      </Card>

      <Card :title="t('profile.securitySection')">
        <Button type="button" variant="danger" @click="handleLogout">{{ t('nav.signOut') }}</Button>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
  min-height: 100%;
}

.profile-header {
  padding: var(--space-8);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  text-align: center;
}

.profile-header h1 {
  margin: 0 0 var(--space-2) 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text);
}

.profile-header p {
  margin: 0;
  color: var(--color-text-muted);
}

.profile-container {
  max-width: 600px;
  margin: 0 auto;
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.section-alert {
  margin-bottom: var(--space-4);
}

.photo-upload {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.photo-preview-area {
  width: 160px;
  aspect-ratio: 1;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-surface-alt);
  align-self: center;
}

.photo-preview,
.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

.photo-placeholder p {
  margin: 0;
  padding: var(--space-2);
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: center;
}

.photo-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: center;
  flex-wrap: wrap;
}

.photo-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: center;
}

.profile-info {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.profile-info__row {
  display: grid;
  grid-template-columns: 10rem 1fr;
  gap: var(--space-4);
  align-items: center;
}

.profile-info__row dt {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  font-weight: 600;
}

.profile-info__row dd {
  margin: 0;
  color: var(--color-text);
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.profile-note {
  margin: var(--space-5) 0 0 0;
  padding: var(--space-4);
  background: var(--color-surface-alt);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  border-left: 4px solid var(--module-1);
}

@media (max-width: 640px) {
  .profile-header {
    padding: var(--space-4);
  }

  .profile-info__row {
    grid-template-columns: 1fr;
    gap: var(--space-1);
  }
}
</style>
