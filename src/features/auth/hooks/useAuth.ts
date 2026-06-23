'use client'

import { signOut } from 'next-auth/react'

export function useLogout() {
  function handleLogout() {
    signOut({ callbackUrl: '/admin/login' })
  }
  return { logout: handleLogout }
}
