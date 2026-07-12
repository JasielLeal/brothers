import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

type AdminThemeStore = {
  theme: Theme
  toggleTheme: () => void
}

export const useAdminThemeStore = create<AdminThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    { name: 'admin-theme' }
  )
)
