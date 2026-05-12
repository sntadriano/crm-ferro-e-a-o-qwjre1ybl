import { useEffect, useState } from 'react'
import { Users, Activity, Plus } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'

export default function AdminPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])

  const loadData = async () => {
    try {
      const usersData = await pb.collection('users').getFullList({ sort: '-created' })
      setUsers(usersData)
      const logsData = await pb.collection('audit_logs').getList(1, 20, { sort: '-timestamp' })
      setLogs(logsData.items)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData()
    }
  }, [user?.role])

  const toggleStatus = async (targetUser: any) => {
    try {
      await pb.collection('users').update(targetUser.id, { active: !targetUser.active })
      toast({ title: 'Usuário atualizado com sucesso' })
      loadData()
    } catch {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administração</h1>
          <p className="text-muted-foreground mt-1">Gestão de usuários e auditoria do sistema.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5" /> Usuários do Sistema
            </CardTitle>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Novo Usuário
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome / Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.active ? 'default' : 'destructive'}>
                        {u.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => toggleStatus(u)}>
                        {u.active ? 'Desativar' : 'Ativar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Activity className="h-5 w-5" /> Logs de Auditoria (Últimos 20)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="text-sm border-b pb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">{log.usuario_nome}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={log.acao === 'DELETE' ? 'destructive' : 'outline'}>
                      {log.acao}
                    </Badge>
                    <span className="text-muted-foreground truncate max-w-[200px]">
                      {log.detalhes?.collection} {log.detalhes?.recordId}
                    </span>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-muted-foreground text-sm">Nenhum log encontrado.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
