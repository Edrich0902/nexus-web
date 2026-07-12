import http from '@lib/http'
import type { UpdateProfilePayload, User } from '@/types/user/user'

const AUTH_BASE = '/api/v1/auth'

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<User> {
  const { data } = await http.patch<User>(`${AUTH_BASE}/profile`, payload)
  return data
}
