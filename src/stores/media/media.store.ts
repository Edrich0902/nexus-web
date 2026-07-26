import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { extractApiErrorMessage } from '@lib/api-error'
import * as mediaService from '@services/media.service'
import {
  useMediaAttachMutation,
  useMediaDeleteMutation,
  useMediaFromUrlMutation,
  useMediaReconcileMutation,
  useMediaUploadMutation,
  useMediaUsageRefreshMutation,
} from '@stores/media/media.mutations'
import type {
  MediaAsset,
  MediaAttachPayload,
  MediaCollection,
  MediaFromUrlPayload,
  MediaImage,
  MediaListParams,
  MediaUploadOptions,
  MediaUsage,
  UnsplashPhoto,
  UnsplashQuality,
  UnsplashSearchResponse,
} from '@/types/media/media'

export const useMediaStore = defineStore('media', () => {
  const toast = useToast()

  const listParams = ref<MediaListParams>({ per_page: 24, page: 1 })
  const assets = ref<MediaAsset[]>([])
  const listMeta = ref<MediaListResponseMeta | null>(null)
  const listLoading = ref(false)
  const usage = ref<MediaUsage | null>(null)
  const usageLoading = ref(false)
  const unsplashResults = ref<UnsplashPhoto[]>([])
  const unsplashLoading = ref(false)

  const uploadMutation = useMediaUploadMutation()
  const fromUrlMutation = useMediaFromUrlMutation()
  const deleteMutation = useMediaDeleteMutation()
  const attachMutation = useMediaAttachMutation()
  const reconcileMutation = useMediaReconcileMutation()
  const usageRefreshMutation = useMediaUsageRefreshMutation()

  const uploading = computed(
    () => uploadMutation.asyncStatus.value === 'loading',
  )

  function toastError(error: unknown, fallback: string): void {
    toast.add({
      severity: 'error',
      summary: 'Media',
      detail: extractApiErrorMessage(error, fallback),
      life: 4500,
    })
  }

  function setListParams(params: MediaListParams): void {
    listParams.value = { ...listParams.value, ...params }
  }

  async function fetchList(): Promise<void> {
    listLoading.value = true
    try {
      const response = await mediaService.listMedia(listParams.value)
      assets.value = response.data ?? []
      listMeta.value = response.meta ?? null
    } catch (error) {
      toastError(error, 'Could not load media vault.')
    } finally {
      listLoading.value = false
    }
  }

  async function fetchUsage(refresh = false): Promise<void> {
    usageLoading.value = true
    try {
      usage.value = refresh
        ? await usageRefreshMutation.mutateAsync()
        : await mediaService.getUsage(false)
    } catch (error) {
      toastError(error, 'Could not load Cloudinary usage.')
    } finally {
      usageLoading.value = false
    }
  }

  async function searchUnsplash(q: string, page = 1): Promise<UnsplashSearchResponse | null> {
    unsplashLoading.value = true
    try {
      const response = await mediaService.searchUnsplash(q, page)
      unsplashResults.value = response.results
      return response
    } catch (error) {
      toastError(error, 'Unsplash search failed.')
      return null
    } finally {
      unsplashLoading.value = false
    }
  }

  async function upload(
    file: File,
    options: MediaUploadOptions,
  ): Promise<MediaAsset | null> {
    try {
      const asset = await uploadMutation.mutateAsync({ file, options })
      await fetchList()
      toast.add({
        severity: 'success',
        summary: 'Uploaded',
        detail: 'Image saved to your media vault.',
        life: 2500,
      })
      return asset
    } catch (error) {
      toastError(error, 'Upload failed.')
      return null
    }
  }

  function resolveUnsplashUrl(
    photo: UnsplashPhoto,
    quality: UnsplashQuality = 'regular',
  ): string | null {
    const fallbacks: Record<UnsplashQuality, UnsplashQuality[]> = {
      thumb: ['thumb', 'small', 'regular', 'full'],
      small: ['small', 'regular', 'thumb', 'full'],
      regular: ['regular', 'small', 'full', 'thumb'],
      full: ['full', 'regular', 'small', 'thumb'],
    }

    for (const key of fallbacks[quality]) {
      const url = photo.urls[key]
      if (url) return url
    }

    return null
  }

  async function importUnsplash(
    photo: UnsplashPhoto,
    collection: MediaCollection | string,
    attachTo?: MediaAttachPayload,
    quality: UnsplashQuality = 'regular',
  ): Promise<MediaAsset | null> {
    const url = resolveUnsplashUrl(photo, quality)
    if (!url) {
      toastError(null, 'Unsplash photo has no usable URL.')
      return null
    }

    const payload: MediaFromUrlPayload = {
      url,
      collection,
      source: 'unsplash',
      source_provider: 'unsplash',
      source_ref: photo.id,
      source_meta: {
        photographer: photo.user.name,
        username: photo.user.username,
        profile_url: photo.user.profile_url,
        photo_url: photo.links.html,
      },
      alt_text: photo.description ?? undefined,
      unsplash_download_location: photo.links.download_location ?? undefined,
      attach_to: attachTo,
      role: 'cover',
    }

    try {
      const asset = await fromUrlMutation.mutateAsync(payload)
      await fetchList()
      toast.add({
        severity: 'success',
        summary: 'Imported',
        detail: 'Unsplash photo added to your vault.',
        life: 2500,
      })
      return asset
    } catch (error) {
      toastError(error, 'Unsplash import failed.')
      return null
    }
  }

  async function attachExisting(
    asset: MediaAsset,
    attachTo: MediaAttachPayload,
  ): Promise<MediaImage | null> {
    try {
      const updated = await attachMutation.mutateAsync({
        id: asset.id,
        payload: attachTo,
      })
      await fetchList()
      return updated.media
    } catch (error) {
      toastError(error, 'Could not attach media.')
      return null
    }
  }

  async function remove(
    id: number,
    force = false,
  ): Promise<'deleted' | 'conflict' | 'error'> {
    try {
      const result = await deleteMutation.mutateAsync({ id, force })
      if (result && 'attachments' in result) {
        return 'conflict'
      }
      await fetchList()
      return 'deleted'
    } catch (error) {
      toastError(error, 'Delete failed.')
      return 'error'
    }
  }

  async function reconcile(): Promise<void> {
    try {
      await reconcileMutation.mutateAsync()
      toast.add({
        severity: 'info',
        summary: 'Reconcile queued',
        detail: 'Orphan sweep is running in the background.',
        life: 3000,
      })
    } catch (error) {
      toastError(error, 'Could not queue reconcile.')
    }
  }

  return {
    listParams,
    assets,
    listMeta,
    listLoading,
    usage,
    usageLoading,
    unsplashResults,
    unsplashLoading,
    uploading,
    setListParams,
    fetchList,
    fetchUsage,
    searchUnsplash,
    upload,
    importUnsplash,
    attachExisting,
    remove,
    reconcile,
  }
})

interface MediaListResponseMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}
