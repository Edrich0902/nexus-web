import type { User } from '@/types/user/user'

export interface LoginPayload {
  email: string
  password: string
  remember?: boolean
  device_name?: string
}

export interface AuthTokenResponse {
  token: string
  token_type: 'Bearer'
  expires_at: string
  user: User
}

export interface AuthSession {
  token: string
  expiresAt: string
}

export const AUTH_STORAGE_KEY = 'nexus-auth'
export const AUTH_DEVICE_NAME = 'nexus-web'
