import http from '@lib/http'
import {
  AUTH_DEVICE_NAME,
  type AuthTokenResponse,
  type LoginPayload,
} from '@/types/auth/auth'
import type { DeviceSession } from '@/types/auth/device-session'
import type { User } from '@/types/user/user'

const AUTH_BASE = '/api/v1/auth'

export async function login(payload: LoginPayload): Promise<AuthTokenResponse> {
  const { data } = await http.post<AuthTokenResponse>(`${AUTH_BASE}/login`, {
    email: payload.email,
    password: payload.password,
    remember: payload.remember ?? false,
    device_name: payload.device_name ?? AUTH_DEVICE_NAME,
  })
  return data
}

export async function me(): Promise<User> {
  const { data } = await http.get<User>(`${AUTH_BASE}/me`)
  return data
}

export async function refresh(): Promise<AuthTokenResponse> {
  const { data } = await http.post<AuthTokenResponse>(`${AUTH_BASE}/refresh`)
  return data
}

export async function logout(): Promise<void> {
  await http.post(`${AUTH_BASE}/logout`)
}

export async function logoutAll(): Promise<void> {
  await http.post(`${AUTH_BASE}/logout-all`)
}

export async function listSessions(): Promise<DeviceSession[]> {
  const { data } = await http.get<DeviceSession[]>(`${AUTH_BASE}/sessions`)
  return data
}

export async function revokeSession(tokenId: number): Promise<void> {
  await http.delete(`${AUTH_BASE}/sessions/${tokenId}`)
}
