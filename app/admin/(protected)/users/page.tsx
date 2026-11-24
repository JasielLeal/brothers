import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { formatDate } from '@/utils/formatDate'
import { PageHeader } from '@/components/layout/PageHeader'

export const metadata: Metadata = { title: 'Usuários' }

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div className="space-y-5">
      <PageHeader title="Usuários" subtitle={`${users.length} usuário(s) cadastrado(s)`} />

      <div className="rounded-3xl bg-[#141414] p-5 ring-1 ring-white/6">
        <h2 className="mb-3 text-sm font-medium text-neutral-400">Todos os usuários</h2>
        <div className="overflow-x-auto">
          <div className="min-w-130 space-y-2">
            <div className="grid grid-cols-[1.2fr_1.6fr_6rem_6rem] gap-3 px-3 pb-1 text-[11px] tracking-wide text-neutral-600 uppercase">
              <span>Nome</span>
              <span>E-mail</span>
              <span>Função</span>
              <span>Cadastro</span>
            </div>
            {users.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-[1.2fr_1.6fr_6rem_6rem] items-center gap-3 rounded-2xl bg-white/4 px-3 py-2.5"
              >
                <span className="truncate text-sm font-medium text-white">{user.name}</span>
                <span className="truncate text-xs text-neutral-400">{user.email}</span>
                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-white text-black' : 'bg-white/10 text-neutral-300'}`}
                >
                  {user.role === 'ADMIN' ? 'Admin' : 'Cliente'}
                </span>
                <span className="text-xs text-neutral-400">
                  {formatDate(user.createdAt.toISOString())}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
