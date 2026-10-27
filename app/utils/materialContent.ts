import type { Material, MaterialLink, MaterialType } from '~/types'

export const MATERIAL_TYPE_DESCRIPTIONS: Record<MaterialType, string> = {
  Notes: 'Freeform notes for this material.',
  Book: 'An ebook or reading reference; keep your notes here.',
  Slides: 'A slide deck — PPT, PPTX, PDF, or KEY.',
  Collection: 'A set of reference links.',
  Link: 'One external link.',
  PDF: 'A PDF document.',
  Video: 'A video file or an external link.',
}

export const DOCUMENT_RULES: Record<'PDF' | 'Slides', { label: string, extensions: string[], maxMb: number }> = {
  PDF: { label: 'PDF', extensions: ['pdf'], maxMb: 20 },
  Slides: { label: 'slide deck', extensions: ['ppt', 'pptx', 'pdf', 'key'], maxMb: 20 },
}

export const BOOK_RULES: { label: string, extensions: string[], maxMb: number } = {
  label: 'ebook',
  extensions: ['pdf', 'epub'],
  maxMb: 50,
}

export const VIDEO_RULES: { label: string, extensions: string[], maxMb: number } = {
  label: 'video',
  extensions: ['mp4', 'webm', 'mov'],
  maxMb: 200,
}

export interface MaterialContentPlan {
  url?: string
  source?: 'file' | 'link'
  links: MaterialLink[]
  fileName?: string
  fileSize?: number
  lost: boolean
}

export function fileNameFromUrl(url?: string): string | undefined {
  if (!url)
    return undefined
  try {
    const path = new URL(url, 'https://local.invalid').pathname
    const last = path.split('/').filter(Boolean).pop()
    return last ? decodeURIComponent(last) : undefined
  }
  catch {
    return undefined
  }
}

export function fileExtension(value?: string): string {
  if (!value)
    return ''
  try {
    const path = new URL(value, 'https://local.invalid').pathname
    const name = path.split('/').filter(Boolean).pop() ?? ''
    const dot = name.lastIndexOf('.')
    return dot >= 0 ? name.slice(dot + 1).toLowerCase() : ''
  }
  catch {
    return ''
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function isExternalLink(url?: string): boolean {
  return !!url && /^https?:\/\//i.test(url)
}

export function isFileForType(url: string | undefined, type: MaterialType, fileName?: string): boolean {
  if (!url)
    return false
  const extension = fileName ? fileExtension(fileName) : fileExtension(url)
  if (type === 'PDF' || type === 'Slides')
    return DOCUMENT_RULES[type].extensions.includes(extension)
  if (type === 'Book')
    return BOOK_RULES.extensions.includes(extension)
  if (type === 'Video')
    return VIDEO_RULES.extensions.includes(extension)
  return false
}

/** A missing source means the type itself decides; Video defaults to a file. */
export function materialContentSource(material: Material): 'file' | 'link' {
  if (material.contentSource)
    return material.contentSource
  if (isExternalLink(material.url))
    return 'link'
  return 'file'
}

export function normalizeUrl(raw: string): { url: string } | { error: string } {
  const value = raw.trim()
  if (!value)
    return { error: 'Enter a link.' }
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`
  try {
    const parsed = new URL(withScheme)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
      return { error: 'Use an http or https link.' }
    return { url: parsed.toString() }
  }
  catch {
    return { error: 'Enter a valid URL.' }
  }
}

export function comparableUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.replace(/\/+$/, '')
    return `${parsed.protocol}//${parsed.host}${path}${parsed.search}`
  }
  catch {
    return url.trim()
  }
}

function snapshot(material: Material): MaterialContentPlan {
  return {
    url: material.url,
    source: material.contentSource,
    links: material.links ?? [],
    fileName: material.fileName,
    fileSize: material.fileSize,
    lost: false,
  }
}

function empty(lost: boolean): MaterialContentPlan {
  return {
    url: undefined,
    source: undefined,
    links: [],
    fileName: undefined,
    fileSize: undefined,
    lost,
  }
}

/**
 * Decides what happens to the current content when a material's type changes.
 * Compatible content is migrated; incompatible content is reported as lost.
 */
export function planTypeChange(material: Material, nextType: MaterialType): MaterialContentPlan {
  const prevType = material.type
  if (prevType === nextType)
    return snapshot(material)

  const url = material.url
  const links = material.links ?? []
  const source = materialContentSource(material)
  const hasUrl = !!url
  const hasLinks = links.length > 0
  const hasContent = hasUrl || hasLinks

  if (nextType === 'Notes')
    return empty(hasContent)

  if (nextType === 'Collection') {
    if ((prevType === 'Link' || (prevType === 'Video' && source === 'link')) && url) {
      if (!hasLinks)
        return { ...empty(false), links: [{ id: 0, url }] }
      return { ...empty(true) }
    }
    return empty(hasContent)
  }

  if (nextType === 'Link' || nextType === 'Video') {
    if (prevType === 'Collection') {
      const [first, ...rest] = links
      return {
        ...empty(rest.length > 0),
        url: first?.url,
        source: first ? 'link' : undefined,
      }
    }

    if (prevType === 'PDF' || prevType === 'Slides' || prevType === 'Book' || (prevType === 'Video' && source === 'file')) {
      const compatible = nextType === 'Video' && isFileForType(url, 'Video', material.fileName)
      return {
        ...empty(hasUrl && !compatible),
        url: compatible ? url : undefined,
        source: compatible ? 'file' : undefined,
        fileName: compatible ? material.fileName : undefined,
        fileSize: compatible ? material.fileSize : undefined,
      }
    }

    if (url && (prevType === 'Link' || (prevType === 'Video' && source === 'link')))
      return { ...empty(false), url, source: 'link' }

    return empty(false)
  }

  if (nextType === 'PDF' || nextType === 'Slides' || nextType === 'Book') {
    if (prevType === 'PDF' || prevType === 'Slides' || prevType === 'Book' || (prevType === 'Video' && source === 'file')) {
      const compatible = isFileForType(url, nextType, material.fileName)
      return {
        ...empty(hasUrl && !compatible),
        url: compatible ? url : undefined,
        source: compatible ? 'file' : undefined,
        fileName: compatible ? material.fileName : undefined,
        fileSize: compatible ? material.fileSize : undefined,
      }
    }

    return empty(hasContent)
  }

  return empty(hasContent)
}
