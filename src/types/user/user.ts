import type { MediaImage } from '@/types/media/media'

export interface User {
  id: number
  name: string
  email: string
  media?: MediaImage | null
  /** @deprecated Prefer media.public_id */
  profile_public_id?: string | null
  created_at: string | null
  updated_at: string | null
}

export interface UpdateProfilePayload {
  name: string
}
