<script setup lang="ts">
/**
 * Minimal WYSIWYG editor: a contenteditable surface with a small formatting
 * toolbar built on document.execCommand. It's a deprecated API, but every
 * evergreen browser still implements the handful of commands used here
 * (bold/italic/lists/link), and pulling in a full editor dependency wasn't
 * worth it for the authoring surface this project needs. The backend
 * sanitizes the resulting HTML server-side regardless (PayloadSanitizer).
 */
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const editor = ref<HTMLDivElement | null>(null)

onMounted(() => {
  if (editor.value) editor.value.innerHTML = props.modelValue || ''
})

watch(
  () => props.modelValue,
  (value) => {
    if (editor.value && editor.value.innerHTML !== value) {
      editor.value.innerHTML = value || ''
    }
  },
)

function exec(command: string, value?: string): void {
  document.execCommand(command, false, value)
  emitContent()
}

function emitContent(): void {
  emit('update:modelValue', editor.value?.innerHTML ?? '')
}

function insertLink(): void {
  const url = window.prompt('URL')
  if (url) exec('createLink', url)
}
</script>

<template>
  <div class="rte">
    <div class="rte__toolbar" role="toolbar" aria-label="Formatting">
      <button type="button" @click="exec('bold')"><strong>B</strong></button>
      <button type="button" @click="exec('italic')"><em>I</em></button>
      <button type="button" @click="exec('insertUnorderedList')">• List</button>
      <button type="button" @click="exec('insertOrderedList')">1. List</button>
      <button type="button" @click="insertLink">Link</button>
      <button type="button" @click="exec('formatBlock', 'h3')">H3</button>
      <button type="button" @click="exec('formatBlock', 'p')">¶</button>
      <button type="button" @click="exec('removeFormat')">Clear</button>
    </div>
    <div
      ref="editor"
      class="rte__surface"
      contenteditable="true"
      role="textbox"
      aria-multiline="true"
      @input="emitContent"
      @blur="emitContent"
    />
  </div>
</template>

<style scoped>
.rte {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.rte__toolbar {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-2);
  background: var(--color-surface-alt);
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.rte__toolbar button {
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: 0.8125rem;
  cursor: pointer;
}

.rte__toolbar button:hover {
  background: var(--color-border);
}

.rte__surface {
  min-height: 10rem;
  padding: var(--space-4);
  outline: none;
  line-height: 1.6;
}

.rte__surface:focus-visible {
  box-shadow: inset 0 0 0 2px var(--color-focus);
}
</style>
