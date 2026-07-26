import type { MediaImage, MediaVariant } from '@/types/media/media'

const VARIANT_TRANSFORM: Record<MediaVariant, string> = {
  thumb: 't_nexus_thumb',
  card: 't_nexus_card',
  hero: 't_nexus_hero',
  avatar: 't_nexus_avatar',
}

/**
 * Build a Cloudinary delivery URL for a public_id + named transformation.
 * Falls back to the stored secure URL when cloud name is missing.
 */
export function mediaDeliveryUrl(
  media: MediaImage | null | undefined,
  variant?: MediaVariant | null,
): string | null {
  if (!media?.public_id) {
    return media?.url || null
  }

  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
  if (!cloud) {
    return media.url || null
  }

  const transform = variant ? `${VARIANT_TRANSFORM[variant]}/` : ''
  return `https://res.cloudinary.com/${cloud}/image/upload/${transform}${media.public_id}`
}

/**
 * Downscale an image file in-browser before upload (longest edge + WebP).
 */
export async function downscaleImageFile(
  file: File,
  maxEdge = 2560,
  quality = 0.85,
): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file
  }

  // HEIC often cannot be decoded in-browser — pass through raw.
  if (file.type === 'image/heic' || file.type === 'image/heif') {
    return file
  }

  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file

  const { width, height } = bitmap
  const longest = Math.max(width, height)
  if (longest <= maxEdge && file.size <= 1.5 * 1024 * 1024) {
    bitmap.close()
    return file
  }

  const scale = Math.min(1, maxEdge / longest)
  const targetW = Math.max(1, Math.round(width * scale))
  const targetH = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }

  ctx.drawImage(bitmap, 0, 0, targetW, targetH)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/webp', quality)
  })

  if (!blob) return file

  const base = file.name.replace(/\.[^.]+$/, '') || 'upload'
  return new File([blob], `${base}.webp`, { type: 'image/webp' })
}
