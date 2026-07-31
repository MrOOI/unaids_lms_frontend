<script setup lang="ts">
interface TabItem {
  value: string
  label: string
  /** Shown as a small dot when the tab has unsaved/missing content (e.g. an untranslated locale). */
  flagged?: boolean
}

interface Props {
  modelValue: string
  items: TabItem[]
}

defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>

<template>
  <div class="ui-tabs" role="tablist">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      role="tab"
      class="ui-tabs__tab"
      :class="{ 'ui-tabs__tab--active': modelValue === item.value }"
      :aria-selected="modelValue === item.value"
      @click="emit('update:modelValue', item.value)"
    >
      {{ item.label }}
      <span v-if="item.flagged" class="ui-tabs__flag" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.ui-tabs {
  display: flex;
  gap: var(--space-1);
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.ui-tabs__tab {
  position: relative;
  padding: var(--space-3) var(--space-4);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.ui-tabs__tab:hover {
  color: var(--color-text);
}

.ui-tabs__tab--active {
  color: var(--module-primary, var(--color-focus));
  border-bottom-color: var(--module-primary, var(--color-focus));
}

.ui-tabs__flag {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f9ab00;
}
</style>
