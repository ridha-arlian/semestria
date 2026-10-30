import type { ThemePresetId } from '~/types'

export interface ThemePreset {
  id: Exclude<ThemePresetId, 'custom'>
  name: string
  /** Accent for light mode; null means the built-in monochrome theme. */
  light: string | null
  /** Accent tuned for dark mode. */
  dark: string | null
}

export const themePresets: ThemePreset[] = [
  { id: 'mono', name: 'Mono', light: null, dark: null },
  { id: 'ocean', name: 'Ocean', light: '#2563eb', dark: '#60a5fa' },
  { id: 'forest', name: 'Forest', light: '#059669', dark: '#34d399' },
  { id: 'rose', name: 'Rose', light: '#e11d48', dark: '#fb7185' },
  { id: 'amber', name: 'Amber', light: '#d97706', dark: '#fbbf24' },
  { id: 'violet', name: 'Violet', light: '#7c3aed', dark: '#a78bfa' },
]

interface SurfaceToken {
  base: string
  tint: number
}

type SurfacePalette = Record<string, SurfaceToken>

interface ContrastCheck {
  foreground: string
  background: string
  minimum: number
}

const lightSurfaces: SurfacePalette = {
  'background': { base: '#fafaf9', tint: 0.14 },
  'paper': { base: '#ffffff', tint: 0.12 },
  'card': { base: '#ffffff', tint: 0.12 },
  'popover': { base: '#ffffff', tint: 0.12 },
  'soft': { base: '#f4f4f5', tint: 0.16 },
  'secondary': { base: '#f4f4f5', tint: 0.16 },
  'muted': { base: '#f4f4f5', tint: 0.16 },
  'accent': { base: '#f4f4f5', tint: 0.16 },
  'hover': { base: '#f4f4f5', tint: 0.16 },
  'input': { base: '#e4e4e7', tint: 0.14 },
  'line': { base: '#e4e4e7', tint: 0.24 },
  'line-strong': { base: '#a1a1aa', tint: 0.18 },
  'border': { base: '#e4e4e7', tint: 0.24 },
  'sidebar-background': { base: '#eeede8', tint: 0.18 },
  'sidebar-accent': { base: '#e3e2db', tint: 0.26 },
  'sidebar-border': { base: '#ddddd5', tint: 0.26 },
}

const darkSurfaces: SurfacePalette = {
  'background': { base: '#232326', tint: 0.10 },
  'paper': { base: '#1c1c20', tint: 0.15 },
  'card': { base: '#28282c', tint: 0.15 },
  'popover': { base: '#28282c', tint: 0.15 },
  'soft': { base: '#2b2b2f', tint: 0.18 },
  'secondary': { base: '#2b2b2f', tint: 0.18 },
  'muted': { base: '#2b2b2f', tint: 0.18 },
  'accent': { base: '#2b2b2f', tint: 0.18 },
  'hover': { base: '#2b2b2f', tint: 0.18 },
  'input': { base: '#38383d', tint: 0.18 },
  'line': { base: '#38383d', tint: 0.26 },
  'line-strong': { base: '#55555c', tint: 0.22 },
  'border': { base: '#38383d', tint: 0.26 },
  'sidebar-background': { base: '#17171a', tint: 0.22 },
  'sidebar-accent': { base: '#202024', tint: 0.30 },
  'sidebar-border': { base: '#2c2c30', tint: 0.30 },
}

const LIGHT_INK = '#18181b'
const LIGHT_SUBLINE = '#52525b'
const DARK_INK = '#f2f2f0'
const DARK_SUBLINE = '#b8b8bd'

const lightContrastChecks: ContrastCheck[] = [
  { foreground: LIGHT_INK, background: 'paper', minimum: 7 },
  { foreground: LIGHT_SUBLINE, background: 'paper', minimum: 4.5 },
  { foreground: LIGHT_INK, background: 'background', minimum: 7 },
  { foreground: LIGHT_SUBLINE, background: 'background', minimum: 4.5 },
  { foreground: LIGHT_INK, background: 'card', minimum: 7 },
  { foreground: LIGHT_SUBLINE, background: 'card', minimum: 4.5 },
  { foreground: LIGHT_INK, background: 'popover', minimum: 4.5 },
  { foreground: LIGHT_SUBLINE, background: 'popover', minimum: 4.5 },
  { foreground: LIGHT_INK, background: 'soft', minimum: 4.5 },
  { foreground: LIGHT_SUBLINE, background: 'soft', minimum: 4.5 },
  { foreground: LIGHT_INK, background: 'secondary', minimum: 4.5 },
  { foreground: LIGHT_INK, background: 'accent', minimum: 4.5 },
  { foreground: LIGHT_INK, background: 'sidebar-background', minimum: 4.5 },
  { foreground: LIGHT_SUBLINE, background: 'sidebar-background', minimum: 4.5 },
  { foreground: LIGHT_INK, background: 'sidebar-accent', minimum: 4.5 },
]

const darkContrastChecks: ContrastCheck[] = [
  { foreground: DARK_INK, background: 'paper', minimum: 7 },
  { foreground: DARK_SUBLINE, background: 'paper', minimum: 4.5 },
  { foreground: DARK_INK, background: 'background', minimum: 7 },
  { foreground: DARK_SUBLINE, background: 'background', minimum: 4.5 },
  { foreground: DARK_INK, background: 'card', minimum: 7 },
  { foreground: DARK_SUBLINE, background: 'card', minimum: 4.5 },
  { foreground: DARK_INK, background: 'popover', minimum: 4.5 },
  { foreground: DARK_SUBLINE, background: 'popover', minimum: 4.5 },
  { foreground: DARK_INK, background: 'soft', minimum: 4.5 },
  { foreground: DARK_SUBLINE, background: 'soft', minimum: 4.5 },
  { foreground: DARK_INK, background: 'secondary', minimum: 4.5 },
  { foreground: DARK_INK, background: 'accent', minimum: 4.5 },
  { foreground: DARK_INK, background: 'sidebar-background', minimum: 4.5 },
  { foreground: DARK_SUBLINE, background: 'sidebar-background', minimum: 4.5 },
  { foreground: DARK_INK, background: 'sidebar-accent', minimum: 4.5 },
]

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

export function normalizeHex(input: string): string | null {
  const value = input.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(value)) {
    return `#${value.split('').map(char => char + char).join('').toLowerCase()}`
  }
  if (/^[0-9a-f]{6}$/i.test(value)) {
    return `#${value.toLowerCase()}`
  }
  return null
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map(channel => clampChannel(channel).toString(16).padStart(2, '0')).join('')}`
}

/** Blend `overlay` into `base` by `amount` (0–1). */
export function mixHex(base: string, overlay: string, amount: number) {
  const [br, bg, bb] = hexToRgb(base)
  const [or, og, ob] = hexToRgb(overlay)
  return rgbToHex(
    br + (or - br) * amount,
    bg + (og - bg) * amount,
    bb + (ob - bb) * amount,
  )
}

export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0)
}

export function contrastOn(hex: string) {
  return contrastRatio('#18181b', hex) >= contrastRatio('#ffffff', hex) ? '#18181b' : '#ffffff'
}

function darkAccentFor(lightAccent: string) {
  const lum = luminance(lightAccent)
  if (lum < 0.3)
    return mixHex(lightAccent, '#ffffff', 0.4)
  if (lum > 0.82)
    return mixHex(lightAccent, '#000000', 0.15)
  return lightAccent
}

export function presetAccent(preset: ThemePresetId, customColor: string) {
  if (preset === 'custom')
    return normalizeHex(customColor) ?? '#2563eb'
  return themePresets.find(item => item.id === preset)?.light ?? '#18181b'
}

function contrastRatio(foreground: string, background: string) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05)
}

function tintSurfaces(accent: string, surfaces: SurfacePalette, scale: number) {
  const colors: Record<string, string> = {}
  for (const [token, { base, tint }] of Object.entries(surfaces))
    colors[token] = mixHex(base, accent, tint * scale)
  return colors
}

function surfacesPass(colors: Record<string, string>, checks: ContrastCheck[]) {
  return checks.every((check) => {
    const background = colors[check.background]
    if (!background)
      return true
    return contrastRatio(check.foreground, background) >= check.minimum
  })
}

/** Largest tint multiplier that keeps every text pair above its contrast floor. */
function resolveTintScale(accent: string, surfaces: SurfacePalette, checks: ContrastCheck[]) {
  if (surfacesPass(tintSurfaces(accent, surfaces, 1), checks))
    return 1

  let low = 0
  let high = 1
  for (let index = 0; index < 12; index++) {
    const middle = (low + high) / 2
    if (surfacesPass(tintSurfaces(accent, surfaces, middle), checks))
      low = middle
    else
      high = middle
  }
  return low
}

function buildVars(accent: string, surfaces: SurfacePalette, checks: ContrastCheck[]) {
  const foreground = contrastOn(accent)
  const colors = tintSurfaces(accent, surfaces, resolveTintScale(accent, surfaces, checks))
  return [
    `--primary:${accent}`,
    `--primary-foreground:${foreground}`,
    `--ring:${accent}`,
    `--sidebar-primary:${accent}`,
    `--sidebar-primary-foreground:${foreground}`,
    `--sidebar-ring:${accent}`,
    ...Object.entries(colors).map(([token, color]) => `--${token}:${color}`),
  ].join(';')
}

export interface ThemePreview {
  background: string
  card: string
  sidebar: string
  primary: string
  primaryForeground: string
}

export function buildThemePreview(customColor: string, dark: boolean): ThemePreview {
  const normalized = normalizeHex(customColor) ?? '#2563eb'
  const accent = dark ? darkAccentFor(normalized) : normalized
  const surfaces = dark ? darkSurfaces : lightSurfaces
  const checks = dark ? darkContrastChecks : lightContrastChecks
  const colors = tintSurfaces(accent, surfaces, resolveTintScale(accent, surfaces, checks))

  return {
    background: colors.background ?? normalized,
    card: colors.card ?? normalized,
    sidebar: colors['sidebar-background'] ?? normalized,
    primary: accent,
    primaryForeground: contrastOn(accent),
  }
}

/**
 * CSS overrides for the selected theme. Selectors are doubled so they win over
 * the `:root`/`.dark` blocks in tailwind.css regardless of insertion order.
 * Empty string means "no override" (Mono).
 */
export function buildThemeCss(preset: ThemePresetId, customColor: string) {
  if (preset === 'mono')
    return ''

  const custom = normalizeHex(customColor)
  const definition = themePresets.find(item => item.id === preset)
  const light = preset === 'custom' ? custom : definition?.light ?? null
  const dark = preset === 'custom'
    ? (custom ? darkAccentFor(custom) : null)
    : definition?.dark ?? null

  if (!light || !dark)
    return ''

  return [
    `:root:root{${buildVars(light, lightSurfaces, lightContrastChecks)}}`,
    `.dark.dark{${buildVars(dark, darkSurfaces, darkContrastChecks)}}`,
  ].join('\n')
}
