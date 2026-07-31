<script setup lang="ts">
/** Structured payload editor, one form per ContentBlockType. */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ContentBlockType } from '../../lib/api-types'
import { mediaUrl } from '../../lib/http'
import { useMedia } from '../../composables/useMedia'
import RichTextEditor from './RichTextEditor.vue'
import FormField from '../form/FormField.vue'

const props = defineProps<{ type: ContentBlockType; modelValue: Record<string, unknown> }>()
const emit = defineEmits<{ 'update:modelValue': [Record<string, unknown>] }>()
const { t } = useI18n()
const media = useMedia()

const uploading = ref(false)

function set(key: string, value: unknown): void {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

async function handleUpload(event: Event, assetKey = 'assetId', fileNameKey?: string, sizeKey?: string): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const result = await media.upload(file)
    const patch: Record<string, unknown> = { ...props.modelValue, [assetKey]: result.id }
    if (fileNameKey) patch[fileNameKey] = file.name
    if (sizeKey) patch[sizeKey] = file.size
    emit('update:modelValue', patch)
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="block-editor">
    <template v-if="type === 'RichText' || type === 'KeyMessage'">
      <FormField :label="t('admin.blocks.html')">
        <RichTextEditor :model-value="(modelValue.html as string) ?? ''" @update:model-value="set('html', $event)" />
      </FormField>
    </template>

    <template v-else-if="type === 'Image'">
      <FormField :label="t('admin.blocks.image')">
        <input type="file" accept="image/*" :disabled="uploading" @change="handleUpload($event, 'assetId')" />
        <img v-if="modelValue.assetId" :src="mediaUrl(modelValue.assetId as string)" class="block-editor__preview" />
      </FormField>
      <FormField :label="t('admin.blocks.altText')">
        <input type="text" class="block-editor__input" :value="modelValue.altText as string" @input="set('altText', ($event.target as HTMLInputElement).value)" />
      </FormField>
      <FormField :label="t('admin.blocks.caption')">
        <input type="text" class="block-editor__input" :value="modelValue.caption as string" @input="set('caption', ($event.target as HTMLInputElement).value)" />
      </FormField>
    </template>

    <template v-else-if="type === 'Video' || type === 'Audio'">
      <FormField :label="t('admin.blocks.uploadFile')">
        <input :accept="type === 'Video' ? 'video/*' : 'audio/*'" type="file" :disabled="uploading" @change="handleUpload($event, 'assetId')" />
      </FormField>
      <FormField :label="t('admin.blocks.orExternalUrl')">
        <input type="text" class="block-editor__input" :value="modelValue.url as string" placeholder="https://…" @input="set('url', ($event.target as HTMLInputElement).value)" />
      </FormField>
      <FormField :label="t('admin.blocks.caption')">
        <input type="text" class="block-editor__input" :value="modelValue.caption as string" @input="set('caption', ($event.target as HTMLInputElement).value)" />
      </FormField>
    </template>

    <template v-else-if="type === 'FileAttachment'">
      <FormField :label="t('admin.blocks.uploadFile')">
        <input type="file" :disabled="uploading" @change="handleUpload($event, 'assetId', 'fileName', 'sizeBytes')" />
        <p v-if="modelValue.fileName" class="block-editor__hint">{{ modelValue.fileName }}</p>
      </FormField>
    </template>

    <template v-else-if="type === 'ExternalLink'">
      <FormField :label="t('admin.blocks.url')">
        <input type="text" class="block-editor__input" :value="modelValue.url as string" placeholder="https://…" @input="set('url', ($event.target as HTMLInputElement).value)" />
      </FormField>
      <FormField :label="t('admin.blocks.label')">
        <input type="text" class="block-editor__input" :value="modelValue.label as string" @input="set('label', ($event.target as HTMLInputElement).value)" />
      </FormField>
      <FormField :label="t('admin.blocks.description')">
        <input type="text" class="block-editor__input" :value="modelValue.description as string" @input="set('description', ($event.target as HTMLInputElement).value)" />
      </FormField>
    </template>
  </div>
</template>

<style scoped>
.block-editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.block-editor__input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: inherit;
}

.block-editor__preview {
  display: block;
  margin-top: var(--space-3);
  max-width: 200px;
  border-radius: var(--radius-md);
}

.block-editor__hint {
  margin: var(--space-2) 0 0 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}
</style>
