<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  padded?: boolean
}

withDefaults(defineProps<Props>(), { padded: true })
</script>

<template>
  <section class="rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
    <header v-if="title || $slots.actions" class="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
      <div v-if="title">
        <h3 class="text-base font-semibold text-gray-800">{{ title }}</h3>
        <p v-if="subtitle" class="mt-1 text-sm text-gray-500">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-shrink-0 gap-2">
        <slot name="actions" />
      </div>
    </header>
    <div :class="padded ? 'p-6' : ''">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="rounded-b-2xl border-t border-gray-100 bg-gray-50 px-6 py-4">
      <slot name="footer" />
    </footer>
  </section>
</template>
