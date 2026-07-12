import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import * as authService from '@services/auth.service'
import {
  readStoredSession,
  writeStoredSession,
} from '@lib/http'
import {
  useLoginMutation,
  useLogoutAllMutation,
  useLogoutMutation,
  useRefreshMutation,
  useRevokeSessionMutation,
} from '@stores/auth/auth.mutations'
import type { LoginPayload } from '@/types/auth/auth'
import type { DeviceSession } from '@/types/auth/device-session'
import type { User } from '@/types/user/user'
import { Status } from '@/types/status'
import { isAxiosError } from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const authed = ref(false)
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const expiresAt = ref<string | null>(null)
  const status = ref<Status>(Status.UNINITIALIZED)
  const message = ref('')
  const sessions = ref<DeviceSession[]>([])
  const sessionsStatus = ref<Status>(Status.UNINITIALIZED)

  const toast = useToast()
  const loginMutation = useLoginMutation()
  const logoutMutation = useLogoutMutation()
  const refreshMutation = useRefreshMutation()
  const revokeSessionMutation = useRevokeSessionMutation()
  const logoutAllMutation = useLogoutAllMutation()

  function persistSession(nextToken: string, nextExpiresAt: string): void {
    token.value = nextToken
    expiresAt.value = nextExpiresAt
    writeStoredSession({ token: nextToken, expiresAt: nextExpiresAt })
  }

  function clearSession(): void {
    authed.value = false
    user.value = null
    token.value = null
    expiresAt.value = null
    sessions.value = []
    sessionsStatus.value = Status.UNINITIALIZED
    writeStoredSession(null)
  }

  function setUser(next: User): void {
    user.value = next
  }

  function applyTokenResponse(response: {
    token: string
    expires_at: string
    user: User
  }): void {
    persistSession(response.token, response.expires_at)
    user.value = response.user
    authed.value = true
    status.value = Status.OK
    message.value = ''
  }

  async function initialise(): Promise<void> {
    status.value = Status.LOADING
    const session = readStoredSession()

    if (!session?.token) {
      clearSession()
      status.value = Status.UNAUTHENTICATED
      return
    }

    token.value = session.token
    expiresAt.value = session.expiresAt

    try {
      const me = await authService.me()
      user.value = me
      authed.value = true
      status.value = Status.OK
    } catch {
      clearSession()
      status.value = Status.UNAUTHENTICATED
    }
  }

  async function login(payload: LoginPayload): Promise<boolean> {
    status.value = Status.LOADING
    message.value = ''

    try {
      const response = await loginMutation.mutateAsync(payload)
      applyTokenResponse(response)
      toast.add({
        severity: 'success',
        summary: 'Access granted',
        detail: 'Terminal session authorized',
        life: 2000,
      })
      return true
    } catch (error) {
      clearSession()
      status.value = Status.ERROR
      message.value = extractErrorMessage(error, 'Authentication failed')
      toast.add({
        severity: 'error',
        summary: 'Access denied',
        detail: message.value,
        life: 3000,
      })
      return false
    }
  }

  async function logout(): Promise<boolean> {
    status.value = Status.LOADING
    try {
      await logoutMutation.mutateAsync()
    } catch {
      // Always clear local session even if the API call fails
    } finally {
      clearSession()
      status.value = Status.UNAUTHENTICATED
    }
    return true
  }

  async function refresh(): Promise<boolean> {
    try {
      const response = await refreshMutation.mutateAsync()
      applyTokenResponse(response)
      return true
    } catch {
      clearSession()
      status.value = Status.UNAUTHENTICATED
      return false
    }
  }

  async function fetchSessions(): Promise<boolean> {
    sessionsStatus.value = Status.LOADING
    try {
      sessions.value = await authService.listSessions()
      sessionsStatus.value = Status.OK
      return true
    } catch (error) {
      sessionsStatus.value = Status.ERROR
      toast.add({
        severity: 'error',
        summary: 'Sessions unavailable',
        detail: extractErrorMessage(error, 'Unable to load active sessions'),
        life: 3000,
      })
      return false
    }
  }

  /**
   * Revoke a device session.
   * @returns `'signed-out'` when the current session was revoked; `true` otherwise on success; `false` on failure.
   */
  async function revokeSession(
    tokenId: number,
  ): Promise<'signed-out' | boolean> {
    const target = sessions.value.find((s) => s.id === tokenId)
    const wasCurrent = target?.is_current === true

    try {
      await revokeSessionMutation.mutateAsync(tokenId)

      if (wasCurrent) {
        clearSession()
        status.value = Status.UNAUTHENTICATED
        toast.add({
          severity: 'info',
          summary: 'Session ended',
          detail: 'You signed out of this device',
          life: 2000,
        })
        return 'signed-out'
      }

      await fetchSessions()
      toast.add({
        severity: 'success',
        summary: 'Session revoked',
        detail: 'That device is no longer signed in',
        life: 2000,
      })
      return true
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Revoke failed',
        detail: extractErrorMessage(error, 'Unable to revoke session'),
        life: 3000,
      })
      return false
    }
  }

  async function revokeOtherSessions(): Promise<boolean> {
    const others = sessions.value.filter((s) => !s.is_current)
    if (others.length === 0) {
      toast.add({
        severity: 'info',
        summary: 'No other sessions',
        detail: 'Only this device is signed in',
        life: 2000,
      })
      return true
    }

    try {
      await Promise.all(
        others.map((session) => revokeSessionMutation.mutateAsync(session.id)),
      )
      await fetchSessions()
      toast.add({
        severity: 'success',
        summary: 'Other sessions ended',
        detail: `Signed out ${others.length} other device${others.length === 1 ? '' : 's'}`,
        life: 2500,
      })
      return true
    } catch (error) {
      await fetchSessions()
      toast.add({
        severity: 'error',
        summary: 'Partial failure',
        detail: extractErrorMessage(error, 'Could not revoke all other sessions'),
        life: 3000,
      })
      return false
    }
  }

  async function logoutAllSessions(): Promise<boolean> {
    try {
      await logoutAllMutation.mutateAsync()
    } catch {
      // Still clear locally
    } finally {
      clearSession()
      status.value = Status.UNAUTHENTICATED
    }
    return true
  }

  return {
    authed,
    user,
    token,
    expiresAt,
    status,
    message,
    sessions,
    sessionsStatus,
    initialise,
    login,
    logout,
    refresh,
    clearSession,
    setUser,
    fetchSessions,
    revokeSession,
    revokeOtherSessions,
    logoutAllSessions,
  }
})

function extractErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback

  const data = error.response?.data as
    | { message?: string; errors?: Record<string, string[]> }
    | undefined

  if (data?.errors?.email?.[0]) return data.errors.email[0]
  if (data?.message) return data.message
  if (error.response?.status === 429) return 'Too many attempts. Try again shortly.'
  return fallback
}
