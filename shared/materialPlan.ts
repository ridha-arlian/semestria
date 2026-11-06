// Server-safe copy of the type-change policy. Kept in sync with
// app/utils/materialContent.ts; the client stays the source of truth for UI
// while this guards the API.
import type { MaterialType } from '~/types'

export interface TypeChangeInput {
  type: MaterialType
  url?: string
  source?: 'file' | 'link'
  fileName?: string
  fileSize?: number
}

export interface TypeChangePlan {
  url?: string
  source?: 'file' | 'link'
  fileName?: string
  fileSize?: number
  lost: boolean
}

const DOC_EXTS: Record<string, string[]> = {
  PDF: ['pdf'],
  Slides: ['ppt', 'pptx', 'pdf', 'key'],
  Book: ['pdf', 'epub'],
  Video: ['mp4', 'webm', 'mov'],
}

function extOf(name?: string): string {
  if (!name) return ''
  const last = name.split('/').filter(Boolean).pop() ?? ''
  const dot = last.lastIndexOf('.')
  return dot >= 0 ? last.slice(dot + 1).toLowerCase() : ''
}

function isFileForType(url: string | undefined, type: string, fileName?: string): boolean {
  if (!url) return false
  const ext = fileName ? extOf(fileName) : extOf(url)
  return (DOC_EXTS[type] ?? []).includes(ext)
}

export function planTypeChange(input: TypeChangeInput, prevType: MaterialType, nextType: MaterialType): TypeChangePlan {
  if (prevType === nextType) return { url: input.url, source: input.source, fileName: input.fileName, fileSize: input.fileSize, lost: false }

  const { url, source, fileName, fileSize } = input
  const hasContent = !!url

  if (nextType === 'Notes') return { lost: hasContent }
  if (nextType === 'Collection') {
    if ((prevType === 'Link' || (prevType === 'Video' && source === 'link')) && url) return { url: undefined, source: undefined, lost: false }
    return { lost: hasContent }
  }
  if (nextType === 'Link' || nextType === 'Video') {
    if (prevType === 'Collection') {
      return { url, source: url ? 'link' : undefined, lost: false }
    }
    if (prevType === 'PDF' || prevType === 'Slides' || prevType === 'Book' || (prevType === 'Video' && source === 'file')) {
      const compatible = nextType === 'Video' && isFileForType(url, 'Video', fileName)
      return {
        url: compatible ? url : undefined,
        source: compatible ? 'file' : undefined,
        fileName: compatible ? fileName : undefined,
        fileSize: compatible ? fileSize : undefined,
        lost: !!url && !compatible,
      }
    }
    if (url && (prevType === 'Link' || (prevType === 'Video' && source === 'link'))) {
      return { url, source: 'link', lost: false }
    }
    return { lost: false }
  }
  if (nextType === 'PDF' || nextType === 'Slides' || nextType === 'Book') {
    if (prevType === 'PDF' || prevType === 'Slides' || prevType === 'Book' || (prevType === 'Video' && source === 'file')) {
      const compatible = isFileForType(url, nextType, fileName)
      return {
        url: compatible ? url : undefined,
        source: compatible ? 'file' : undefined,
        fileName: compatible ? fileName : undefined,
        fileSize: compatible ? fileSize : undefined,
        lost: !!url && !compatible,
      }
    }
    return { lost: hasContent }
  }
  return { lost: hasContent }
}
