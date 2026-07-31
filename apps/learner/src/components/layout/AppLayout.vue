<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import LanguageSwitcher from '../LanguageSwitcher.vue'
import { MenuIcon, UserCircleIcon, LogoutIcon, ChevronDownIcon } from '../../icons'

const { t } = useI18n()
const router = useRouter()
const { user, isAdmin, isObserver, logout } = useAuth()

const menuOpen = ref(false)
const navOpen = ref(false)

async function handleLogout(): Promise<void> {
  menuOpen.value = false
  await logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gray-50">
    <a class="skip-link" href="#main">{{ t('a11y.skipToContent') }}</a>

    <header class="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div class="mx-auto flex max-w-(--breakpoint-2xl) flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
        <RouterLink :to="{ name: 'home' }" class="flex flex-shrink-0 flex-col text-gray-900 no-underline">
          <strong class="text-base font-bold leading-tight">{{ t('app.courseName') }}</strong>
          <span class="text-xs font-normal text-gray-500">{{ t('app.title') }}</span>
        </RouterLink>

        <button
          type="button"
          class="order-2 ml-auto flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 md:hidden"
          :aria-expanded="navOpen"
          :aria-label="t('a11y.toggleNavigation')"
          @click="navOpen = !navOpen"
        >
          <MenuIcon class="size-5" />
        </button>

        <nav
          class="order-4 flex w-full flex-col gap-1 border-t border-gray-100 pt-2 md:order-none md:w-auto md:flex-1 md:flex-row md:gap-2 md:border-0 md:pt-0"
          :class="navOpen ? 'flex' : 'hidden md:flex'"
          :aria-label="t('nav.courses')"
        >
          <RouterLink
            :to="{ name: 'home' }"
            class="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            active-class="bg-brand-50 text-brand-600 hover:bg-brand-50"
            exact-active-class="bg-brand-50 text-brand-600 hover:bg-brand-50"
            @click="navOpen = false"
          >
            {{ t('nav.myLearning') }}
          </RouterLink>
          <RouterLink
            :to="{ name: 'certificates' }"
            class="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            active-class="bg-brand-50 text-brand-600 hover:bg-brand-50"
            @click="navOpen = false"
          >
            {{ t('nav.certificates') }}
          </RouterLink>
          <RouterLink
            v-if="isAdmin || isObserver"
            :to="{ name: 'admin-dashboard' }"
            class="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 md:ml-auto"
            active-class="bg-brand-50 text-brand-600 hover:bg-brand-50"
            @click="navOpen = false"
          >
            {{ t('nav.admin') }}
          </RouterLink>
        </nav>

        <div class="order-3 flex flex-shrink-0 items-center gap-3 md:order-none">
          <LanguageSwitcher compact />

          <div class="relative">
            <button
              type="button"
              class="flex items-center gap-1 rounded-full"
              :aria-expanded="menuOpen"
              :aria-label="user?.fullName"
              @click="menuOpen = !menuOpen"
            >
              <UserCircleIcon class="size-9 text-gray-400" />
              <ChevronDownIcon class="size-4 text-gray-400" />
            </button>

            <div
              v-if="menuOpen"
              class="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-gray-200 bg-white p-2 shadow-theme-lg"
              @mouseleave="menuOpen = false"
            >
              <div class="border-b border-gray-100 px-3 py-2.5">
                <p class="truncate text-sm font-semibold text-gray-800">{{ user?.fullName }}</p>
                <p class="truncate text-xs text-gray-500">{{ user?.email }}</p>
              </div>
              <RouterLink
                :to="{ name: 'profile' }"
                class="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
                @click="menuOpen = false"
              >
                <UserCircleIcon class="size-5 text-gray-400" />
                {{ t('profile.title') }}
              </RouterLink>
              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-error-600 hover:bg-error-50"
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

    <main id="main" class="flex-1">
      <slot />
    </main>
  </div>
</template>
