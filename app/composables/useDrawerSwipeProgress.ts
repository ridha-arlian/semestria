// Mirrors the drawer drag offset onto its scrim so the overlay fades in step
// with the sheet. Reka only publishes `--drawer-swipe-progress` for nested
// drawers, so without this bridge the overlay stays fully dark while the
// panel is dragged away.
//
// Writes go straight to the overlay node. A CSS variable on a parent would
// invalidate styles for every descendant on each pointermove.

const PROGRESS_VAR = '--drawer-drag-progress'
// Same curve and duration as the panel snap-back, so the two never drift.
const RELEASE_TRANSITION = 'opacity 500ms cubic-bezier(0.32, 0.72, 0, 1)'

// Reka starts a drag from these same elements, so a tap on a control never
// fades the scrim.
const IGNORE_SELECTOR = 'button,a,input,select,textarea,label,[role="button"]'

export function useDrawerSwipeProgress() {
  let startY = 0
  let height = 0
  let overlay: HTMLElement | null = null
  let dragging = false
  let releaseTimer: ReturnType<typeof setTimeout> | null = null

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0)
      return
    if (event.target instanceof Element && event.target.closest(IGNORE_SELECTOR))
      return

    const panel = event.currentTarget as HTMLElement | null
    if (!panel)
      return

    // The most recently mounted portal belongs to the frontmost drawer.
    const overlays = document.querySelectorAll<HTMLElement>('[data-slot="drawer-overlay"]')
    overlay = overlays[overlays.length - 1] ?? null
    if (!overlay)
      return

    if (releaseTimer) {
      clearTimeout(releaseTimer)
      releaseTimer = null
    }

    startY = event.clientY
    height = panel.offsetHeight
    dragging = true

    // The finger drives the value: no easing while it is down.
    overlay.style.transition = 'none'
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerup', onPointerEnd, { once: true })
    window.addEventListener('pointercancel', onPointerEnd, { once: true })
  }

  function onPointerMove(event: PointerEvent) {
    if (!dragging || !overlay || height <= 0)
      return
    const progress = Math.min(1, Math.max(0, (event.clientY - startY) / height))
    overlay.style.setProperty(PROGRESS_VAR, `${progress}`)
  }

  function onPointerEnd() {
    dragging = false
    window.removeEventListener('pointermove', onPointerMove)

    const target = overlay
    overlay = null
    if (!target)
      return

    // Snap-back needs a transition here; a dismissing drag is already handled
    // by the drawer's exit animation.
    target.style.transition = RELEASE_TRANSITION
    target.style.removeProperty(PROGRESS_VAR)
    releaseTimer = setTimeout(() => {
      target.style.transition = ''
      releaseTimer = null
    }, 520)
  }

  onBeforeUnmount(() => {
    window.removeEventListener('pointermove', onPointerMove)
    if (releaseTimer)
      clearTimeout(releaseTimer)
  })

  return { onPointerDown }
}
