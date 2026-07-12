import { isAxiosError } from 'axios'
import {
  getRateLimitCooldownRemainingMs,
  isRateLimited,
} from '@lib/http'

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback

  const data = error.response?.data as
    | { message?: string; errors?: Record<string, string[]> }
    | undefined

  if (data?.message) {
    return data.message.replace(/^\[spotify\]\s*/i, '')
  }

  if (error.response?.status === 429) {
    return 'Too many requests. Try again shortly.'
  }

  return fallback
}

export function isReauthError(error: unknown): boolean {
  if (!isAxiosError(error)) return false
  const status = error.response?.status
  if (status === 409) return true
  if (status !== 401) return false
  const message = String(
    (error.response?.data as { message?: string } | undefined)?.message ?? '',
  ).toLowerCase()
  return (
    message.includes('re-authorization') ||
    message.includes('[github]') ||
    message.includes('[spotify]')
  )
}

export function isRateLimitError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 429
}

export function isNotConnectedError(error: unknown): boolean {
  if (!isAxiosError(error)) return false
  if (error.response?.status !== 404) return false
  const message = String(
    (error.response?.data as { message?: string } | undefined)?.message ?? '',
  ).toLowerCase()
  return message.includes('not connected')
}

export { getRateLimitCooldownRemainingMs, isRateLimited }
