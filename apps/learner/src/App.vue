<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from './components/layout/AppLayout.vue'
import AdminLayout from './components/layout/AdminLayout.vue'
import ToastHost from './components/ui/ToastHost.vue'
import ConfirmHost from './components/ui/ConfirmHost.vue'

const route = useRoute()
const layout = computed(() => (route.meta.layout as string | undefined) ?? 'app')
</script>

<template>
  <AdminLayout v-if="layout === 'admin'">
    <RouterView />
  </AdminLayout>
  <AppLayout v-else-if="layout === 'app'">
    <RouterView />
  </AppLayout>
  <RouterView v-else />

  <ToastHost />
  <ConfirmHost />
</template>
