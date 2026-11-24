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
      <div className="flex min-h-screen gap-3 bg-[#050505] p-3 text-neutral-100">
        <AdminSidebar />
        <main className="min-w-0 flex-1 overflow-auto rounded-3xl bg-[radial-gradient(ellipse_at_top_right,#1d1d1d_0%,#0b0b0b_55%)] p-4 ring-1 ring-white/5 md:p-6">
          {children}
        </main>
      </div>
    </AdminThemeShell>
  )
}
