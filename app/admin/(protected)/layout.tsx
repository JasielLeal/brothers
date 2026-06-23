import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AdminSidebar } from '@/components/layout/AdminSidebar'

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-4">{children}</main>
    </div>
  )
}
