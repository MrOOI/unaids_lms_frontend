/**
 * Global toast notifications. `ToastHost.vue` (mounted once in App.vue) reads
 * this shared queue; any component calls `useToast().push(...)`.
 */
import { reactive } from 'vue'

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  tone: ToastTone
  message: string
}

let nextId = 1
const toasts = reactive<ToastItem[]>([])

export function useToast() {
  function push(message: string, tone: ToastTone = 'info', durationMs = 4000): void {
    const id = nextId++
    toasts.push({ id, tone, message })
    setTimeout(() => dismiss(id), durationMs)
  }

  function dismiss(id: number): void {
    const index = toasts.findIndex((t) => t.id === id)
    if (index !== -1) toasts.splice(index, 1)
  }

  return {
    toasts,
    success: (message: string) => push(message, 'success'),
    error: (message: string) => push(message, 'error'),
    info: (message: string) => push(message, 'info'),
    dismiss,
  }
}
