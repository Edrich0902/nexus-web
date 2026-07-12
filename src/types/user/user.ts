export interface User {
  id: number
  name: string
  email: string
  profile_public_id?: string | null
  created_at: string | null
  updated_at: string | null
}

export interface UpdateProfilePayload {
  name: string
}
