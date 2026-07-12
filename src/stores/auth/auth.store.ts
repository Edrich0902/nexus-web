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
  useLogoutMutation,
  useRefreshMutation,
} from '@stores/auth/auth.mutations'
import type { LoginPayload } from '@/types/auth/auth'
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

  const toast = useToast()
  const loginMutation = useLoginMutation()
  const logoutMutation = useLogoutMutation()
  const refreshMutation = useRefreshMutation()

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
    writeStoredSession(null)
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

  return {
    authed,
    user,
    token,
    expiresAt,
    status,
    message,
    initialise,
    login,
    logout,
    refresh,
    clearSession,
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
