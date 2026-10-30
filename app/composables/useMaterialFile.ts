import { computed, onUnmounted, ref, toValue } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import type { Material } from '~/types'
import type { MaterialDetailContext } from '~/components/workspaces/material-detail/materialDetailContext'
import { fileExtension, fileNameFromUrl } from '~/utils/materialContent'

export interface MaterialFileRules {
  label: string
  extensions: string[]
  maxMb: number
}

/**
 * Shared upload state for material files. Uploads stay in memory: the object
 * URL is stored on the material and intentionally survives component unmount,
 * so it keeps working while the user moves around the workspace.
 */
export function useMaterialFile(
  material: Ref<Material>,
  ctx: MaterialDetailContext,
  rules: MaybeRefOrGetter<MaterialFileRules>,
) {
  const fileInput = ref<HTMLInputElement | null>(null)
  const isDragging = ref(false)
  const progress = ref<number | null>(null)
  const uploadError = ref<string | null>(null)
  const pendingFileName = ref<string | null>(null)
  let pendingFile: File | null = null
  let progressTimer: ReturnType<typeof setInterval> | undefined

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

  function startUpload(file: File) {
    pendingFile = file
    pendingFileName.value = file.name
    uploadError.value = null
    progress.value = 0
    if (progressTimer)
      clearInterval(progressTimer)
    progressTimer = setInterval(() => {
      if (progress.value === null)
        return
      progress.value = Math.min(100, progress.value + Math.ceil(Math.random() * 18))
      if (progress.value >= 100) {
        if (progressTimer)
          clearInterval(progressTimer)
        progressTimer = undefined
        finishUpload(file)
      }
    }, 160)
  }

  function finishUpload(file: File) {
    progress.value = null
    pendingFileName.value = null
    const url = URL.createObjectURL(file)
    ctx.setMaterialContent(material.value.id, {
      url,
      source: 'file',
      fileName: file.name,
      fileSize: file.size,
    })
    pendingFile = null
  }

  function cancelUpload() {
    if (progressTimer)
      clearInterval(progressTimer)
    progressTimer = undefined
    progress.value = null
    pendingFileName.value = null
    pendingFile = null
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

  onUnmounted(() => {
    if (progressTimer)
      clearInterval(progressTimer)
  })

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
