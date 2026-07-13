import { useEffect, useState } from 'react'
import { Users, Activity, Plus, Mail, Save } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

type UserRow = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  codigo?: number | null
}

export default function AdminPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserRow[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [emailConfigs, setEmailConfigs] = useState<any[]>([])
  const [codigoDrafts, setCodigoDrafts] = useState<Record<string, string>>({})
  const [savingCodigo, setSavingCodigo] = useState<Record<string, boolean>>({})

  const loadData = async () => {
    try {
      const usersData = await pb.collection('users').getFullList({ sort: '-created' })
      setUsers(usersData as UserRow[])
      const drafts: Record<string, string> = {}
      for (const u of usersData as UserRow[]) {
        drafts[u.id] = u.codigo != null ? String(u.codigo) : ''
      }
      setCodigoDrafts(drafts)
      const logsData = await pb.collection('audit_logs').getList(1, 20, { sort: '-timestamp' })
      setLogs(logsData.items)
      const emailData = await pb.collection('email_config').getList(1, 5)
      setEmailConfigs(emailData.items)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData()
    }
  }, [user?.role])

  const toggleStatus = async (targetUser: UserRow) => {
    try {
      await pb.collection('users').update(targetUser.id, { active: !targetUser.active })
      toast({ title: 'Usuário atualizado com sucesso' })
      loadData()
    } catch {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    }
  }

  const handleCodigoChange = (userId: string, value: string) => {
    setCodigoDrafts((prev) => ({ ...prev, [userId]: value }))
  }

  const saveCodigo = async (targetUser: UserRow) => {
    const raw = codigoDrafts[targetUser.id] ?? ''
    const trimmed = raw.trim()
    const parsed = trimmed === '' ? null : Number(trimmed)
    if (trimmed !== '' && (!Number.isFinite(parsed) || !Number.isInteger(parsed))) {
      toast({
        title: 'Código inválido',
        description: 'Informe um número inteiro.',
        variant: 'destructive',
      })
      return
    }
    setSavingCodigo((prev) => ({ ...prev, [targetUser.id]: true }))
    try {
      await pb.collection('users').update(targetUser.id, { codigo: parsed })
      toast({ title: 'Código atualizado com sucesso' })
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, codigo: parsed } : u)))
    } catch {
      toast({ title: 'Erro ao atualizar código', variant: 'destructive' })
    } finally {
      setSavingCodigo((prev) => ({ ...prev, [targetUser.id]: false }))
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

      <div className="grid md:grid-cols-2 gap-6 mb-6">
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
                  <TableHead>Código</TableHead>
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
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          inputMode="numeric"
                          step="1"
                          className="h-8 w-24"
                          value={codigoDrafts[u.id] ?? ''}
                          onChange={(e) => handleCodigoChange(u.id, e.target.value)}
                          placeholder="—"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 h-8"
                          disabled={savingCodigo[u.id]}
                          onClick={() => saveCodigo(u)}
                        >
                          <Save className="h-3.5 w-3.5" />
                          Salvar
                        </Button>
                      </div>
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Mail className="h-5 w-5" /> Configurações de E-mail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provedor</TableHead>
                <TableHead>Remetente</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailConfigs.map((cfg) => (
                <TableRow key={cfg.id}>
                  <TableCell className="font-medium">
                    {cfg.api_provider || 'Não definido'}
                  </TableCell>
                  <TableCell>{cfg.email_remetente}</TableCell>
                  <TableCell>
                    <Badge variant={cfg.status ? 'default' : 'secondary'}>
                      {cfg.status ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {emailConfigs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Nenhuma configuração encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
