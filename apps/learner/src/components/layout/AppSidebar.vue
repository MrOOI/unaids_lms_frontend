<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuth } from '../../composables/useAuth'
import { useSidebar } from '../../composables/useSidebar'
import { GridIcon, PieChartIcon, DocsIcon } from '../../icons'

const route = useRoute()
const { t } = useI18n()
const { isObserver, isSysAdmin } = useAuth()
const { isExpanded, isHovered, isMobileOpen, setHovered, closeMobileSidebar } = useSidebar()

const showLabels = computed(() => isExpanded.value || isHovered.value || isMobileOpen.value)

const navItems = computed(() => [
  {
    icon: GridIcon,
    label: t('admin.nav.courses'),
    routeName: 'admin-dashboard',
    to: { name: 'admin-dashboard' },
    matches: ['admin-dashboard', 'admin-course-detail', 'admin-lesson-detail', 'admin-module-quizzes', 'admin-quiz-detail'],
    visible: true,
  },
  {
    icon: PieChartIcon,
    label: t('admin.nav.reporting'),
    routeName: 'admin-reporting',
    to: { name: 'admin-reporting' },
    matches: ['admin-reporting'],
    visible: isObserver.value,
  },
  {
    icon: DocsIcon,
    label: t('admin.nav.certificates'),
    routeName: 'admin-certificates',
    to: { name: 'admin-certificates' },
    matches: ['admin-certificates'],
    visible: isSysAdmin.value,
  },
])

function isActive(matches: string[]): boolean {
  return matches.includes(route.name as string)
}
</script>

<template>
  <aside
    class="fixed top-0 left-0 z-[999] flex h-screen flex-col border-r border-gray-200 bg-white px-5 transition-all duration-300 ease-in-out"
    :class="[
      isExpanded || isHovered || isMobileOpen ? 'w-[260px]' : 'lg:w-[90px]',
      isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
    ]"
    @mouseenter="setHovered(true)"
    @mouseleave="setHovered(false)"
  >
    <div class="flex items-center py-6" :class="showLabels ? 'justify-start' : 'lg:justify-center'">
      <RouterLink :to="{ name: 'admin-dashboard' }" class="text-lg font-bold text-gray-900" @click="closeMobileSidebar">
        <span v-if="showLabels">{{ t('admin.brand') }}</span>
        <span v-else class="hidden lg:inline">{{ t('admin.brand').slice(0, 2) }}</span>
      </RouterLink>
    </div>

    <nav class="flex flex-1 flex-col overflow-y-auto no-scrollbar">
      <ul class="flex flex-col gap-1">
        <li v-for="item in navItems.filter((i) => i.visible)" :key="item.routeName">
          <RouterLink
            :to="item.to"
            class="menu-item group"
            :class="isActive(item.matches) ? 'menu-item-active' : 'menu-item-inactive'"
            @click="closeMobileSidebar"
          >
            <span :class="isActive(item.matches) ? 'menu-item-icon-active' : 'menu-item-icon-inactive'">
              <component :is="item.icon" class="size-5" />
            </span>
            <span v-if="showLabels" class="whitespace-nowrap">{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>
    </nav>
  </aside>
</template>
