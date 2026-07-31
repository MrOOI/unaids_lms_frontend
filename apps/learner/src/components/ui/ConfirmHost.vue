<script setup lang="ts">
import Modal from './Modal.vue'
import Button from './Button.vue'
import { useConfirm } from '../../composables/useConfirm'

const { state, respond } = useConfirm()
</script>

<template>
  <Modal :model-value="state.isOpen" :title="state.title" size="sm" @update:model-value="respond(false)">
    <p v-if="state.message" class="text-sm leading-relaxed text-gray-600">{{ state.message }}</p>
    <template #footer>
      <Button variant="secondary" @click="respond(false)">{{ state.cancelLabel }}</Button>
      <Button :variant="state.danger ? 'danger' : 'primary'" @click="respond(true)">
        {{ state.confirmLabel }}
      </Button>
    </template>
  </Modal>
</template>
