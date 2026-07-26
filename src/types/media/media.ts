export type MediaCollection =
  | 'avatar'
  | 'cellar'
  | 'kitchen'
  | 'beer'
  | 'library'
  | 'vault'
  | 'mirror'

export type MediaSource = 'upload' | 'unsplash' | 'mirror'

export type MediaVariant = 'thumb' | 'card' | 'hero' | 'avatar'

/** Compact image payload for NexusImage / denormalised cover columns. */
export interface MediaImage {
  id: number
  public_id: string
  url: string
}

export interface MediaAttachment {
  type: string
  id: number
  role: string
  position?: number
}

export interface MediaAsset {
  id: number
  public_id: string
  asset_id: string | null
  folder: string | null
  collection: MediaCollection | string
  url: string
  secure_url: string
  format: string | null
  resource_type: string
  bytes: number
  width: number | null
  height: number | null
  version: number | null
  alt_text: string | null
  source: MediaSource | string
  source_provider: string | null
  source_ref: string | null
  source_meta: Record<string, unknown> | null
  tags: string[]
  attachments_count?: number
  attachments?: MediaAttachment[]
  media: MediaImage
  created_at: string | null
  updated_at: string | null
}

export interface MediaListParams {
  collection?: string
  source?: string
  attached?: 'orphan' | 'attached' | string
  tag?: string
  q?: string
  per_page?: number
  page?: number
}

export interface MediaListResponse {
  data: MediaAsset[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  links?: Record<string, string | null>
}

export interface MediaAttachPayload {
  type: string
  id: number
  role?: string
}

export interface MediaUploadOptions {
  collection: MediaCollection | string
  alt_text?: string
  tags?: string[]
  attach_to?: MediaAttachPayload
  role?: string
  onProgress?: (percent: number) => void
}

export interface MediaFromUrlPayload {
  url: string
  collection: MediaCollection | string
  source?: MediaSource
  source_provider?: string
  source_ref?: string
  source_meta?: Record<string, unknown>
  alt_text?: string
  tags?: string[]
  attach_to?: MediaAttachPayload
  role?: string
  unsplash_download_location?: string
}

export interface MediaUsageMeter {
  usage: number
  limit?: number | null
  used_percent?: number | null
  credits_usage?: number | null
}

export interface MediaUsage {
  plan: string | null
  last_updated: string | null
  credits: MediaUsageMeter
  storage: MediaUsageMeter
  bandwidth: MediaUsageMeter
  transformations: MediaUsageMeter
  /** Original uploaded assets (Cloudinary `resources`). */
  resources: number
  /** Generated transform variants (Cloudinary `derived_resources`). */
  derived_resources: number
  /** Total originals + derived (Cloudinary `objects.usage`). */
  objects: number
  requests: number
  fetched_at: string
}

/** Unsplash delivery sizes (excluding raw). Default: regular. */
export type UnsplashQuality = 'thumb' | 'small' | 'regular' | 'full'

export interface UnsplashPhoto {
  id: string
  description: string | null
  width: number | null
  height: number | null
  color: string | null
  urls: {
    thumb: string | null
    small: string | null
    regular: string | null
    full: string | null
    raw: string | null
  }
  links: {
    html: string | null
    download: string | null
    download_location: string | null
  }
  user: {
    name: string | null
    username: string | null
    profile_url: string | null
  }
}

export interface UnsplashSearchResponse {
  results: UnsplashPhoto[]
  total: number
  total_pages: number
}
