<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useSidebar } from '../../composables/useSidebar'
import LanguageSwitcher from '../LanguageSwitcher.vue'
import { MenuIcon, UserCircleIcon, LogoutIcon, ChevronDownIcon } from '../../icons'

const { t } = useI18n()
const router = useRouter()
const { user, logout } = useAuth()
const { toggleSidebar, toggleMobileSidebar } = useSidebar()

const menuOpen = ref(false)

function handleToggle(): void {
  if (window.innerWidth >= 1024) {
    toggleSidebar()
  } else {
    toggleMobileSidebar()
  }
}

async function handleLogout(): Promise<void> {
  menuOpen.value = false
  await logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <header class="sticky top-0 z-[998] flex w-full border-b border-gray-200 bg-white">
    <div class="flex w-full items-center justify-between gap-4 px-4 py-3 lg:px-6">
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          :aria-label="t('a11y.toggleNavigation')"
          @click="handleToggle"
        >
          <MenuIcon class="size-5" />
        </button>
        <RouterLink :to="{ name: 'home' }" class="hidden text-sm font-medium text-gray-500 hover:text-gray-700 sm:inline">
          {{ t('admin.backToSite') }}
        </RouterLink>
      </div>

      <div class="flex items-center gap-3">
        <LanguageSwitcher compact />

        <div class="relative">
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg border border-gray-200 py-2 pl-2 pr-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            :aria-expanded="menuOpen"
            @click="menuOpen = !menuOpen"
          >
            <UserCircleIcon class="size-6 text-gray-400" />
            <span class="hidden max-w-[140px] truncate sm:inline">{{ user?.fullName }}</span>
            <ChevronDownIcon class="size-4 text-gray-400" />
          </button>

          <div
            v-if="menuOpen"
            class="absolute right-0 top-full z-40 mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-2 shadow-theme-lg"
            @mouseleave="menuOpen = false"
          >
            <div class="border-b border-gray-100 px-3 py-2.5">
              <p class="truncate text-sm font-semibold text-gray-800">{{ user?.fullName }}</p>
              <p class="truncate text-xs text-gray-500">{{ user?.roles.join(', ') }}</p>
            </div>
            <button
              type="button"
              class="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-error-600 hover:bg-error-50"
              @click="handleLogout"
            >
              <LogoutIcon class="size-5" />
              {{ t('nav.signOut') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
