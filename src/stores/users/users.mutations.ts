import { defineMutation } from '@pinia/colada'
import * as usersService from '@services/users.service'
import type { UpdateProfilePayload } from '@/types/user/user'

export const useUpdateProfileMutation = defineMutation({
  mutation: (payload: UpdateProfilePayload) =>
    usersService.updateProfile(payload),
})
