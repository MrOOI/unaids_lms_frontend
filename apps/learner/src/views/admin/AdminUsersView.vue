<script setup lang="ts">
/** SysAdmin: search users, toggle roles, deactivate/reactivate accounts (§5.3). */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdminUsers } from '../../composables/useAdminUsers'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import { ROLE_LEARNER, ROLE_COURSE_ADMIN, ROLE_SYS_ADMIN, ROLE_OBSERVER, type AdminUserListItemDto } from '../../lib/api-types'
import Card from '../../components/ui/Card.vue'
import Button from '../../components/ui/Button.vue'
import Badge from '../../components/ui/Badge.vue'
import Spinner from '../../components/ui/Spinner.vue'

const { t, locale } = useI18n()
const adminUsers = useAdminUsers()
const { user: currentUser } = useAuth()
const toast = useToast()
const { confirm } = useConfirm()

const PAGE_SIZE = 50
const ALL_ROLES = [ROLE_LEARNER, ROLE_COURSE_ADMIN, ROLE_SYS_ADMIN, ROLE_OBSERVER]

const users = ref<AdminUserListItemDto[]>([])
const totalCount = ref(0)
const page = ref(1)
const search = ref('')
const isFetching = ref(true)
const busyUserId = ref<string | null>(null)

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)))

onMounted(load)

async function load(): Promise<void> {
  isFetching.value = true
  try {
    const result = await adminUsers.list(search.value.trim(), page.value, PAGE_SIZE)
    users.value = result.users
    totalCount.value = result.totalCount
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.loadFailed'))
  } finally {
    isFetching.value = false
  }
}

async function applySearch(): Promise<void> {
  page.value = 1
  await load()
}

async function goToPage(next: number): Promise<void> {
  if (next < 1 || next > totalPages.value) return
  page.value = next
  await load()
}

function isSelf(row: AdminUserListItemDto): boolean {
  return row.id === currentUser.value?.id
}

async function toggleRole(row: AdminUserListItemDto, role: string): Promise<void> {
  busyUserId.value = row.id
  try {
    if (row.roles.includes(role)) {
      await adminUsers.removeRole(row.id, role)
      row.roles = row.roles.filter((r) => r !== role)
    } else {
      await adminUsers.addRole(row.id, role)
      row.roles = [...row.roles, role]
    }
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  } finally {
    busyUserId.value = null
  }
}

async function toggleLock(row: AdminUserListItemDto): Promise<void> {
  if (!row.isLocked) {
    const confirmed = await confirm({
      title: t('admin.users.deactivateConfirmTitle'),
      message: t('admin.users.deactivateConfirmMessage'),
      confirmLabel: t('admin.users.deactivate'),
      danger: true,
    })
    if (!confirmed) return
  }

  busyUserId.value = row.id
  try {
    if (row.isLocked) {
      await adminUsers.reactivate(row.id)
    } else {
      await adminUsers.deactivate(row.id)
    }
    row.isLocked = !row.isLocked
  } catch (err) {
    toast.error(err instanceof Error ? err.message : t('admin.errors.saveFailed'))
  } finally {
    busyUserId.value = null
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(locale.value, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="admin-users">
    <div class="admin-page-header">
      <h1>{{ t('admin.users.title') }}</h1>
    </div>

    <Card>
      <form class="users-search" @submit.prevent="applySearch">
        <input v-model="search" type="text" class="admin-input" :placeholder="t('admin.users.searchPlaceholder')" />
        <Button type="submit" variant="secondary" :loading="isFetching">{{ t('common.search') }}</Button>
      </form>

      <div v-if="isFetching" class="users-loading"><Spinner :label="t('common.loading')" /></div>
      <p v-else-if="users.length === 0" class="users-empty">{{ t('admin.users.empty') }}</p>

      <div v-else class="users-table" role="table">
        <div class="users-row users-row--head" role="row">
          <span role="columnheader">{{ t('admin.users.columns.user') }}</span>
          <span role="columnheader">{{ t('admin.users.columns.roles') }}</span>
          <span role="columnheader">{{ t('admin.users.columns.registered') }}</span>
          <span role="columnheader">{{ t('admin.users.columns.status') }}</span>
          <span role="columnheader">{{ t('admin.users.columns.actions') }}</span>
        </div>

        <div v-for="row in users" :key="row.id" class="users-row" role="row">
          <div class="users-identity">
            <strong>{{ row.fullName }}</strong>
            <span class="users-email">{{ row.email }}</span>
          </div>

          <div class="users-roles">
            <button
              v-for="role in ALL_ROLES"
              :key="role"
              type="button"
              class="role-chip"
              :class="{ 'role-chip--active': row.roles.includes(role) }"
              :disabled="busyUserId === row.id || (isSelf(row) && role === ROLE_SYS_ADMIN && row.roles.includes(role))"
              :aria-pressed="row.roles.includes(role)"
              @click="toggleRole(row, role)"
            >
              {{ role }}
            </button>
          </div>

          <span>{{ formatDate(row.registeredAt) }}</span>

          <span>
            <Badge :tone="row.isLocked ? 'error' : 'success'">
              {{ row.isLocked ? t('admin.users.locked') : t('admin.users.active') }}
            </Badge>
          </span>

          <div>
            <Button
              size="sm"
              :variant="row.isLocked ? 'secondary' : 'danger'"
              :loading="busyUserId === row.id"
              :disabled="isSelf(row) && !row.isLocked"
              :title="isSelf(row) && !row.isLocked ? t('admin.users.cannotModifySelf') : undefined"
              @click="toggleLock(row)"
            >
              {{ row.isLocked ? t('admin.users.reactivate') : t('admin.users.deactivate') }}
            </Button>
          </div>
        </div>
      </div>

      <div v-if="!isFetching && users.length > 0" class="users-pagination">
        <Button variant="secondary" size="sm" :disabled="page <= 1" @click="goToPage(page - 1)">
          {{ t('common.back') }}
        </Button>
        <span class="users-pagination__label">{{ t('admin.auditLog.pageOf', { page, totalPages }) }}</span>
        <Button variant="secondary" size="sm" :disabled="page >= totalPages" @click="goToPage(page + 1)">
          {{ t('common.continue') }}
        </Button>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.admin-page-header {
  margin-bottom: var(--space-6);
}

.admin-page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.users-search {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.users-search .admin-input {
  flex: 1;
  max-width: 320px;
}

.admin-input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: inherit;
}

.users-loading {
  display: flex;
  justify-content: center;
  padding: var(--space-6);
}

.users-empty {
  color: var(--color-text-muted);
  padding: var(--space-4) 0;
}

.users-table {
  display: flex;
  flex-direction: column;
  overflow-x: auto;
}

.users-row {
  display: grid;
  grid-template-columns: 1.6fr 1.8fr 1fr 0.8fr 1fr;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
  min-width: 760px;
}

.users-row--head {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  border-bottom-width: 2px;
}

.users-identity {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.users-email {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.users-roles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
}

.role-chip {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  min-height: 24px;
}

.role-chip--active {
  background: var(--module-primary, var(--module-1));
  border-color: transparent;
  color: white;
}

.role-chip:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.users-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.users-pagination__label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
</style>
