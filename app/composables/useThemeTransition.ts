export interface ThemeTransitionOrigin {
  x: number
  y: number
}

// Shared light/dark switch animation: the circular reveal is defined on
// ::view-transition-new(root) in assets/css/tailwind.css, so callers only need
// to apply the mutation and optionally pass the click position.
export function useThemeTransition() {
  function run(apply: () => void, origin?: ThemeTransitionOrigin) {
    if (!import.meta.client) {
      apply()
      return
    }

    if (origin) {
      document.documentElement.style.setProperty('--x', `${origin.x}px`)
      document.documentElement.style.setProperty('--y', `${origin.y}px`)
    }

    if (typeof document.startViewTransition !== 'function') {
      apply()
      return
    }

    document.startViewTransition(async () => {
      apply()
      // Let Vue apply the class change before the new snapshot is captured.
      await nextTick()
    })
  }

  return { run }
}
