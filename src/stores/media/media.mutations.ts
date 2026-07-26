import { defineMutation } from '@pinia/colada'
import * as mediaService from '@services/media.service'
import type {
  MediaAttachPayload,
  MediaFromUrlPayload,
  MediaUploadOptions,
} from '@/types/media/media'

export const useMediaUploadMutation = defineMutation({
  mutation: (vars: { file: File; options: MediaUploadOptions }) =>
    mediaService.uploadMedia(vars.file, vars.options),
})

export const useMediaFromUrlMutation = defineMutation({
  mutation: (payload: MediaFromUrlPayload) =>
    mediaService.importFromUrl(payload),
})

export const useMediaDeleteMutation = defineMutation({
  mutation: (vars: { id: number; force?: boolean }) =>
    mediaService.deleteMedia(vars.id, vars.force ?? false),
})

export const useMediaAttachMutation = defineMutation({
  mutation: (vars: { id: number; payload: MediaAttachPayload }) =>
    mediaService.attachMedia(vars.id, vars.payload),
})

export const useMediaDetachMutation = defineMutation({
  mutation: (vars: { id: number; payload: MediaAttachPayload }) =>
    mediaService.detachMedia(vars.id, vars.payload),
})

export const useMediaReconcileMutation = defineMutation({
  mutation: () => mediaService.reconcileMedia(),
})

export const useMediaUsageRefreshMutation = defineMutation({
  mutation: () => mediaService.getUsage(true),
})
