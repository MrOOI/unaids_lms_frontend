/**
 * Promise-based confirmation dialog. `ConfirmHost.vue` (mounted once in
 * App.vue) renders the shared state; any component calls
 * `await useConfirm().confirm({ title, message })`.
 */
import { reactive } from 'vue'

interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean
  resolve: ((value: boolean) => void) | null
}

const state = reactive<ConfirmState>({
  isOpen: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  danger: false,
  resolve: null,
})

export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    state.title = options.title
    state.message = options.message ?? ''
    state.confirmLabel = options.confirmLabel ?? 'Confirm'
    state.cancelLabel = options.cancelLabel ?? 'Cancel'
    state.danger = options.danger ?? false
    state.isOpen = true

    return new Promise((resolve) => {
      state.resolve = resolve
    })
  }

  function respond(value: boolean): void {
    state.isOpen = false
    state.resolve?.(value)
    state.resolve = null
  }

  return { state, confirm, respond }
}
