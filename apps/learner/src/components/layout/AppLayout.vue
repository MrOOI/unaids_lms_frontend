<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import LanguageSwitcher from '../LanguageSwitcher.vue'

const { t } = useI18n()
const router = useRouter()
const { user, isAdmin, isObserver, logout } = useAuth()

const menuOpen = ref(false)
const navOpen = ref(false)

function initials(name: string | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

async function handleLogout(): Promise<void> {
  menuOpen.value = false
  await logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="shell">
    <a class="skip-link" href="#main">{{ t('a11y.skipToContent') }}</a>

    <header class="shell-header">
      <div class="shell-header__inner">
        <RouterLink :to="{ name: 'home' }" class="shell-brand">
          <strong>{{ t('app.courseName') }}</strong>
          <span class="shell-brand__subtitle">{{ t('app.title') }}</span>
        </RouterLink>

        <button
          type="button"
          class="shell-nav-toggle"
          :aria-expanded="navOpen"
          aria-label="Toggle navigation"
          @click="navOpen = !navOpen"
        >
          <span aria-hidden="true">☰</span>
        </button>

        <nav class="shell-nav" :class="{ 'shell-nav--open': navOpen }" :aria-label="t('nav.courses')">
          <RouterLink :to="{ name: 'home' }" class="shell-nav__link" @click="navOpen = false">
            {{ t('nav.myLearning') }}
          </RouterLink>
          <RouterLink :to="{ name: 'certificates' }" class="shell-nav__link" @click="navOpen = false">
            {{ t('nav.certificates') }}
          </RouterLink>
          <RouterLink
            v-if="isAdmin || isObserver"
            :to="{ name: 'admin-dashboard' }"
            class="shell-nav__link shell-nav__link--admin"
            @click="navOpen = false"
          >
            {{ t('nav.admin') }}
          </RouterLink>
        </nav>

        <div class="shell-header__actions">
          <LanguageSwitcher compact />

          <div class="shell-user">
            <button
              type="button"
              class="shell-user__trigger"
              :aria-expanded="menuOpen"
              @click="menuOpen = !menuOpen"
            >
              <span class="shell-user__avatar">{{ initials(user?.fullName) }}</span>
            </button>

            <div v-if="menuOpen" class="shell-user__menu" @mouseleave="menuOpen = false">
              <div class="shell-user__info">
                <strong>{{ user?.fullName }}</strong>
                <span>{{ user?.email }}</span>
              </div>
              <RouterLink :to="{ name: 'profile' }" class="shell-user__item" @click="menuOpen = false">
                {{ t('profile.title') }}
              </RouterLink>
              <button type="button" class="shell-user__item shell-user__item--danger" @click="handleLogout">
                {{ t('nav.signOut') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main id="main" class="shell-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-surface-alt);
}

.shell-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.shell-header__inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-3) var(--space-6);
}

.shell-brand {
  display: flex;
  flex-direction: column;
  color: var(--color-text);
  text-decoration: none;
  flex-shrink: 0;
}

.shell-brand__subtitle {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 400;
}

.shell-nav-toggle {
  display: none;
  margin-left: auto;
  border: 1px solid var(--color-border);
  background: transparent;
  border-radius: var(--radius-md);
  width: 40px;
  height: 40px;
}

.shell-nav {
  display: flex;
  gap: var(--space-2);
  flex: 1;
}

.shell-nav__link {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.875rem;
}

.shell-nav__link:hover {
  background: var(--color-surface-alt);
  color: var(--color-text);
}

.shell-nav__link.router-link-active {
  color: var(--module-1-accessible);
  background: var(--module-1-bg);
}

.shell-nav__link--admin {
  margin-left: auto;
}

.shell-header__actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-shrink: 0;
}

.shell-user {
  position: relative;
}

.shell-user__trigger {
  border: none;
  background: transparent;
  padding: 0;
  border-radius: 50%;
}

.shell-user__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--module-1);
  color: #fff;
  font-weight: 700;
  font-size: 0.875rem;
}

.shell-user__menu {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  min-width: 220px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 50;
}

.shell-user__info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  font-size: 0.8125rem;
}

.shell-user__info span {
  color: var(--color-text-muted);
  word-break: break-all;
}

.shell-user__item {
  display: block;
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: none;
  background: transparent;
  text-align: left;
  color: var(--color-text);
  text-decoration: none;
  font-size: 0.875rem;
  cursor: pointer;
}

.shell-user__item:hover {
  background: var(--color-surface-alt);
}

.shell-user__item--danger {
  color: var(--color-error);
}

.shell-main {
  flex: 1;
}

@media (max-width: 900px) {
  .shell-nav-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    order: 2;
  }

  .shell-header__actions {
    order: 3;
  }

  .shell-nav {
    order: 4;
    flex-basis: 100%;
    display: none;
    flex-direction: column;
    padding-top: var(--space-2);
    border-top: 1px solid var(--color-border);
    margin-top: var(--space-2);
  }

  .shell-nav--open {
    display: flex;
  }

  .shell-nav__link--admin {
    margin-left: 0;
  }

  .shell-header__inner {
    flex-wrap: wrap;
    padding: var(--space-3) var(--space-4);
  }
}
</style>
