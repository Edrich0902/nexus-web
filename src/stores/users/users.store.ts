import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@stores/auth/auth.store'
import { useUpdateProfileMutation } from '@stores/users/users.mutations'
import type { UpdateProfilePayload } from '@/types/user/user'
import { Status } from '@/types/status'
import { isAxiosError } from 'axios'

export const useUsersStore = defineStore('users', () => {
  const status = ref<Status>(Status.UNINITIALIZED)
  const message = ref('')

  const toast = useToast()
  const auth = useAuthStore()
  const updateProfileMutation = useUpdateProfileMutation()

  async function updateProfile(payload: UpdateProfilePayload): Promise<boolean> {
    status.value = Status.LOADING
    message.value = ''

    try {
      const user = await updateProfileMutation.mutateAsync(payload)
      auth.setUser(user)
      status.value = Status.OK
      toast.add({
        severity: 'success',
        summary: 'Profile updated',
        detail: 'Your details have been saved',
        life: 2000,
      })
      return true
    } catch (error) {
      status.value = Status.ERROR
      message.value = extractErrorMessage(error, 'Unable to update profile')
      toast.add({
        severity: 'error',
        summary: 'Update failed',
        detail: message.value,
        life: 3000,
      })
      return false
    }
  }

  return {
    status,
    message,
    updateProfile,
  }
})

function extractErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback

  const data = error.response?.data as
    | { message?: string; errors?: Record<string, string[]> }
    | undefined

  if (data?.errors?.name?.[0]) return data.errors.name[0]
  if (data?.message) return data.message
  return fallback
}
