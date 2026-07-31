/**
 * Admin sidebar state — collapsible on desktop (with hover-to-peek), a
 * slide-in drawer on mobile. Module-level singleton (single admin shell
 * per app instance), following the same pattern as useToast/useConfirm.
 */
import { computed, reactive } from 'vue'

const MOBILE_BREAKPOINT = 1024

const state = reactive({
  isExpanded: true,
  isMobileOpen: false,
  isHovered: false,
})

function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
}

export function useSidebar() {
  const isExpanded = computed(() => (isMobile() ? false : state.isExpanded))

  function toggleSidebar(): void {
    if (isMobile()) {
      state.isMobileOpen = !state.isMobileOpen
    } else {
      state.isExpanded = !state.isExpanded
    }
  }

  function toggleMobileSidebar(): void {
    state.isMobileOpen = !state.isMobileOpen
  }

  function closeMobileSidebar(): void {
    state.isMobileOpen = false
  }

  function setHovered(value: boolean): void {
    if (!state.isExpanded) state.isHovered = value
  }

  return {
    isExpanded,
    isMobileOpen: computed(() => state.isMobileOpen),
    isHovered: computed(() => state.isHovered),
    toggleSidebar,
    toggleMobileSidebar,
    closeMobileSidebar,
    setHovered,
  }
}
