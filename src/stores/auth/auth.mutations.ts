import { defineMutation } from '@pinia/colada'
import * as authService from '@services/auth.service'
import type { LoginPayload } from '@/types/auth/auth'

export const useLoginMutation = defineMutation({
  mutation: (payload: LoginPayload) => authService.login(payload),
})

export const useLogoutMutation = defineMutation({
  mutation: () => authService.logout(),
})

export const useRefreshMutation = defineMutation({
  mutation: () => authService.refresh(),
})

export const useRevokeSessionMutation = defineMutation({
  mutation: (tokenId: number) => authService.revokeSession(tokenId),
})

export const useLogoutAllMutation = defineMutation({
  mutation: () => authService.logoutAll(),
})
