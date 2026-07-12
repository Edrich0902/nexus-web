import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import {
  AUTH_STORAGE_KEY,
  type AuthSession,
} from '@/types/auth/auth'

let onUnauthorized: (() => void) | null = null

/** Shared Spotify/API cooldown after a 429 (ms since epoch). */
let rateLimitUntilMs = 0

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

export function readStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.token) return null
    return parsed
  } catch {
    return null
  }
}

export function writeStoredSession(session: AuthSession | null): void {
  if (!session) {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function getRateLimitCooldownRemainingMs(): number {
  return Math.max(0, rateLimitUntilMs - Date.now())
}

export function isRateLimited(): boolean {
  return getRateLimitCooldownRemainingMs() > 0
}

function armRateLimitCooldown(retryAfterHeader: string | undefined): void {
  const retryAfterSec = Number.parseInt(retryAfterHeader ?? '', 10)
  const waitMs = Number.isFinite(retryAfterSec) && retryAfterSec > 0
    ? retryAfterSec * 1000
    : 8000
  rateLimitUntilMs = Math.max(rateLimitUntilMs, Date.now() + waitMs)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

type RetriableConfig = InternalAxiosRequestConfig & {
  __rateLimitRetryCount?: number
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const remaining = getRateLimitCooldownRemainingMs()
  if (remaining > 0) {
    await sleep(Math.min(remaining, 15000))
  }

  const session = readStoredSession()
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? ''
      const isLoginRequest = url.includes('/auth/login')
      // Integration modules may historically return 401 for provider reauth;
      // never clear the Nexus Sanctum session for those paths.
      const isIntegrationRequest =
        url.includes('/api/v1/github') ||
        url.includes('/api/v1/spotify') ||
        url.includes('/github/') ||
        url.includes('/spotify/')
      if (!isLoginRequest && !isIntegrationRequest) {
        writeStoredSession(null)
        onUnauthorized?.()
      }
      return Promise.reject(error)
    }

    if (error.response?.status === 429 && error.config) {
      const config = error.config as RetriableConfig
      const retries = config.__rateLimitRetryCount ?? 0
      armRateLimitCooldown(error.response.headers?.['retry-after'])

      if (retries < 2) {
        config.__rateLimitRetryCount = retries + 1
        const wait = Math.min(
          getRateLimitCooldownRemainingMs() || 2000 * (retries + 1),
          15000,
        )
        await sleep(wait)
        return http.request(config as AxiosRequestConfig)
      }
    }

    return Promise.reject(error)
  },
)

export default http
