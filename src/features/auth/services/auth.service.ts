import type { LoginCredentials } from '@/features/auth/types/auth.types'
import { signIn, signOut } from '@/auth'

export const authService = {
  async login(credentials: LoginCredentials) {
    return signIn('credentials', { ...credentials, redirect: false })
  },

  async logout() {
    return signOut({ redirect: false })
  },
}
