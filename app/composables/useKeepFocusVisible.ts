// Scrolls the focused field back into view when the on-screen keyboard opens.
// Mobile Safari and Android do not do this for content inside a drawer, so the
// field the user just tapped can end up hidden behind the keyboard.
export function useKeepFocusVisible(enabled: () => boolean = () => true) {
  function onViewportResize() {
    if (!enabled())
      return
    const active = document.activeElement
    if (active instanceof HTMLElement)
      active.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  onMounted(() => {
    window.visualViewport?.addEventListener('resize', onViewportResize)
  })

  onBeforeUnmount(() => {
    window.visualViewport?.removeEventListener('resize', onViewportResize)
  })
}
