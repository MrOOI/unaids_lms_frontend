<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSidebar } from '../../composables/useSidebar'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import Backdrop from './Backdrop.vue'

const { t } = useI18n()
const { isExpanded, isHovered } = useSidebar()
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <a class="skip-link" href="#admin-main">{{ t('a11y.skipToContent') }}</a>

    <AppSidebar />
    <Backdrop />

    <div
      class="flex-1 transition-all duration-300 ease-in-out"
      :class="isExpanded || isHovered ? 'lg:ml-[260px]' : 'lg:ml-[90px]'"
    >
      <AppHeader />
      <main id="admin-main" class="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
