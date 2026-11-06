import { computed, ref, toValue } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import type { Material } from '~/types'
import type { MaterialDetailContext } from '~/components/workspaces/material-detail/materialDetailContext'
import { fileExtension, fileNameFromUrl } from '~/utils/materialContent'

export interface MaterialFileRules {
  label: string
  extensions: string[]
  maxMb: number
}

interface UploadTicket {
  url: string
  method: 'PUT'
  contentType: string
  key: string
}

// Browsers report an empty `file.type` for some office documents and ebooks,
// but the server validates MIME types, so derive one from the extension.
const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  key: 'application/x-iwork-keynote-sffkey',
  epub: 'application/epub+zip',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
}

function contentTypeFor(file: File) {
  if (file.type)
    return file.type
  return MIME_BY_EXT[fileExtension(file.name)] ?? 'application/octet-stream'
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message)
    return error.message
  return fallback
}

/**
 * Shared upload state for material files. The browser PUTs straight to R2 with
 * a presigned ticket, then the server commits the object key to the material.
 */
export function useMaterialFile(
  material: Ref<Material>,
  ctx: MaterialDetailContext,
  rules: MaybeRefOrGetter<MaterialFileRules>,
) {
  const api = useApi()
  const fileInput = ref<HTMLInputElement | null>(null)
  const isDragging = ref(false)
  const progress = ref<number | null>(null)
  const uploadError = ref<string | null>(null)
  const pendingFileName = ref<string | null>(null)
  let pendingFile: File | null = null
  let request: XMLHttpRequest | null = null

  const hasFile = computed(() => !!material.value.url)
  const fileName = computed(() =>
    material.value.fileName
    ?? fileNameFromUrl(material.value.url)
    ?? material.value.title,
  )
  const fileSize = computed(() => material.value.fileSize)
  const uploadingName = computed(() => pendingFileName.value ?? fileName.value)
  const accept = computed(() => toValue(rules).extensions.map(ext => `.${ext}`).join(','))

  function pickFile() {
    uploadError.value = null
    fileInput.value?.click()
  }

  function openFile() {
    const url = material.value.url
    if (!url)
      return
    ctx.markMaterialOpened(material.value.id)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function validate(file: File): string | null {
    const r = toValue(rules)
    if (!r.extensions.includes(fileExtension(file.name)))
      return `\u201c${file.name}\u201d isn't supported. Choose a ${r.label} file.`
    if (file.size > r.maxMb * 1024 * 1024)
      return `\u201c${file.name}\u201d is larger than ${r.maxMb} MB.`
    return null
  }

  function fail(file: File, message: string) {
    pendingFile = file
    pendingFileName.value = file.name
    uploadError.value = message
    progress.value = null
  }

  /** Resolves with the bucket response; `progress` null means the user cancelled. */
  function putObject(ticket: UploadTicket, file: File): Promise<{ ok: true } | { ok: false, message: string }> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()
      request = xhr
      xhr.open(ticket.method, ticket.url)
      xhr.setRequestHeader('Content-Type', ticket.contentType)
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable)
          progress.value = Math.round((event.loaded / event.total) * 100)
      }
      xhr.onload = () => {
        request = null
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ ok: true })
          return
        }
        resolve({ ok: false, message: `Upload failed (${xhr.status}). Check the storage bucket CORS settings.` })
      }
      xhr.onerror = () => {
        request = null
        resolve({ ok: false, message: 'Upload failed. Check your connection and the storage bucket CORS settings.' })
      }
      xhr.onabort = () => {
        request = null
        resolve({ ok: false, message: 'Upload cancelled.' })
      }
      xhr.send(file)
    })
  }

  async function runUpload(file: File) {
    const problem = validate(file)
    if (problem) {
      fail(file, problem)
      return
    }

    pendingFile = file
    pendingFileName.value = file.name
    uploadError.value = null
    progress.value = 0

    const id = material.value.id
    let ticket: UploadTicket
    try {
      ticket = await api.request<UploadTicket>(`/api/materials/${id}/upload-url`, {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          contentType: contentTypeFor(file),
        }),
      })
    }
    catch (error) {
      if (progress.value !== null)
        fail(file, errorMessage(error, 'Could not start the upload.'))
      return
    }
    if (progress.value === null)
      return

    const result = await putObject(ticket, file)
    if (progress.value === null)
      return
    if (!result.ok) {
      fail(file, result.message)
      return
    }

    try {
      await ctx.setMaterialContent(id, {
        url: ticket.key,
        source: 'file',
        fileName: file.name,
        fileSize: file.size,
      })
    }
    catch (error) {
      fail(file, errorMessage(error, 'Could not save the uploaded file.'))
      return
    }

    progress.value = null
    pendingFileName.value = null
    pendingFile = null
  }

  function startUpload(file: File) {
    if (progress.value !== null)
      return
    void runUpload(file)
  }

  function cancelUpload() {
    progress.value = null
    pendingFileName.value = null
    pendingFile = null
    const active = request
    request = null
    active?.abort()
  }

  function clearError() {
    uploadError.value = null
    pendingFile = null
    pendingFileName.value = null
  }

  function retryUpload() {
    if (!pendingFile)
      return
    const problem = validate(pendingFile)
    if (problem) {
      fail(pendingFile, problem)
      return
    }
    startUpload(pendingFile)
  }

  function checkFile(file: File): boolean {
    const problem = validate(file)
    if (problem) {
      fail(file, problem)
      return false
    }
    return true
  }

  return {
    fileInput,
    isDragging,
    progress,
    uploadError,
    hasFile,
    fileName,
    fileSize,
    uploadingName,
    accept,
    pickFile,
    openFile,
    validate,
    fail,
    startUpload,
    cancelUpload,
    clearError,
    retryUpload,
    checkFile,
  }
}
