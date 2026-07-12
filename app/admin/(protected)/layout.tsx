import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { AdminThemeShell } from '@/components/layout/AdminThemeShell'

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  return (
    <AdminThemeShell>
      <div className="flex min-h-screen bg-gray-50 dark:bg-neutral-950">
        <AdminSidebar />
        <main className="flex-1 overflow-auto p-4">{children}</main>
      </div>
    </AdminThemeShell>
  )
}
