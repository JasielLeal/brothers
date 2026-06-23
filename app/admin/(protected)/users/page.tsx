import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { mockUsers } from '@/mock/users'
import { formatDate } from '@/utils/formatDate'
import { MobileMenuButton } from '@/components/layout/MobileMenuButton'

export const metadata: Metadata = { title: 'Usuários' }

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center">
          <MobileMenuButton />
          <h1 className="text-2xl font-bold">Usuários</h1>
        </div>
        <p className="text-muted-foreground">{mockUsers.length} usuário(s) cadastrado(s)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todos os usuários</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-muted-foreground p-4 text-left font-medium">Nome</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">E-mail</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Função</th>
                  <th className="text-muted-foreground p-4 text-left font-medium">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 border-b last:border-0">
                    <td className="p-4 font-medium">{user.name}</td>
                    <td className="text-muted-foreground p-4">{user.email}</td>
                    <td className="p-4">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'Admin' : 'Cliente'}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground p-4">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
