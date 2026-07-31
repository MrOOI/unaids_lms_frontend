<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import LanguageSwitcher from '../LanguageSwitcher.vue'

const { t } = useI18n()
const router = useRouter()
const { user, isObserver, isSysAdmin, logout } = useAuth()

const sidebarOpen = ref(false)

async function handleLogout(): Promise<void> {
  await logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="admin-shell">
    <a class="skip-link" href="#admin-main">{{ t('a11y.skipToContent') }}</a>

    <header class="admin-topbar">
      <button
        type="button"
        class="admin-topbar__toggle"
        :aria-expanded="sidebarOpen"
        aria-label="Toggle navigation"
        @click="sidebarOpen = !sidebarOpen"
      >
        <span aria-hidden="true">☰</span>
      </button>
      <RouterLink :to="{ name: 'admin-dashboard' }" class="admin-topbar__brand">
        {{ t('admin.brand') }}
      </RouterLink>
      <div class="admin-topbar__spacer" />
      <LanguageSwitcher compact />
      <RouterLink :to="{ name: 'home' }" class="admin-topbar__exit">{{ t('admin.backToSite') }}</RouterLink>
      <button type="button" class="admin-topbar__logout" @click="handleLogout">{{ t('nav.signOut') }}</button>
    </header>

    <div class="admin-body">
      <aside class="admin-sidebar" :class="{ 'admin-sidebar--open': sidebarOpen }">
        <div class="admin-sidebar__user">
          <strong>{{ user?.fullName }}</strong>
          <span>{{ user?.roles.join(', ') }}</span>
        </div>
        <nav class="admin-sidebar__nav" @click="sidebarOpen = false">
          <RouterLink :to="{ name: 'admin-dashboard' }" class="admin-sidebar__link">
            {{ t('admin.nav.courses') }}
          </RouterLink>
          <RouterLink v-if="isObserver" :to="{ name: 'admin-reporting' }" class="admin-sidebar__link">
            {{ t('admin.nav.reporting') }}
          </RouterLink>
          <RouterLink v-if="isSysAdmin" :to="{ name: 'admin-certificates' }" class="admin-sidebar__link">
            {{ t('admin.nav.certificates') }}
          </RouterLink>
        </nav>
      </aside>

      <main id="admin-main" class="admin-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-surface-alt);
}

.admin-topbar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-6);
  background: var(--color-text);
  color: var(--color-surface);
  position: sticky;
  top: 0;
  z-index: 40;
}

.admin-topbar__toggle {
  display: none;
  border: none;
  background: transparent;
  color: inherit;
  width: 36px;
  height: 36px;
}

.admin-topbar__brand {
  color: var(--color-surface);
  text-decoration: none;
  font-weight: 700;
}

.admin-topbar__spacer {
  flex: 1;
}

.admin-topbar__exit,
.admin-topbar__logout {
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-surface);
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  cursor: pointer;
}

.admin-topbar__exit:hover,
.admin-topbar__logout:hover {
  background: rgba(255, 255, 255, 0.12);
}

.admin-body {
  flex: 1;
  display: flex;
}

.admin-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.admin-sidebar__user {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-5) var(--space-5);
  border-bottom: 1px solid var(--color-border);
  font-size: 0.8125rem;
}

.admin-sidebar__user span {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.admin-sidebar__nav {
  display: flex;
  flex-direction: column;
  padding: var(--space-3);
  gap: var(--space-1);
}

.admin-sidebar__link {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  color: var(--color-text);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
}

.admin-sidebar__link:hover {
  background: var(--color-surface-alt);
}

.admin-sidebar__link.router-link-active {
  background: var(--module-2-bg);
  color: var(--module-2-accessible);
}

.admin-main {
  flex: 1;
  padding: var(--space-8);
  max-width: 1200px;
}

@media (max-width: 900px) {
  .admin-topbar__toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .admin-sidebar {
    position: fixed;
    top: 56px;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    z-index: 30;
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.1);
  }

  .admin-sidebar--open {
    transform: translateX(0);
  }

  .admin-main {
    padding: var(--space-5);
  }
}
</style>
