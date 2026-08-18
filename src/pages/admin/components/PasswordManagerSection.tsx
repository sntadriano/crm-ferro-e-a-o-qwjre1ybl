import { useEffect, useState } from 'react'
import { KeyRound, Save, Eye, EyeOff, RefreshCw } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type ManagedUser = {
  id: string
  name: string
  email: string
  username?: string
  role: string
}

// Mesma lógica de normalização de senha usada na tela de login:
// remove caracteres invisíveis, normaliza Unicode, apara espaços e
// converte para minúsculas antes de enviar ao backend.
const sanitizePassword = (raw: string): string =>
  String(raw)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()

export default function PasswordManagerSection() {
  const { toast } = useToast()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)

  // Rascunhos por usuário: username editável
  const [usernameDrafts, setUsernameDrafts] = useState<Record<string, string>>({})
  // Rascunhos por usuário: nova senha digitada
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({})
  // Estado "mostrar/ocultar senha" por usuário
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  // Flags de salvamento por usuário (username e senha independentes)
  const [savingUsername, setSavingUsername] = useState<Record<string, boolean>>({})
  const [savingPassword, setSavingPassword] = useState<Record<string, boolean>>({})

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await pb.collection('users').getFullList({
        sort: 'name',
        fields: 'id,name,email,username,role',
      })
      const rows = data as ManagedUser[]
      setUsers(rows)
      setUsernameDrafts(
        rows.reduce(
          (acc, u) => {
            acc[u.id] = u.username ?? ''
            return acc
          },
          {} as Record<string, string>,
        ),
      )
      setPasswordDrafts({})
      setShowPassword({})
    } catch (err) {
      console.error(err)
      toast({
        title: 'Erro ao carregar usuários',
        description: 'Não foi possível carregar a lista de usuários.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUsernameChange = (id: string, value: string) => {
    setUsernameDrafts((prev) => ({ ...prev, [id]: value }))
  }

  const handlePasswordChange = (id: string, value: string) => {
    setPasswordDrafts((prev) => ({ ...prev, [id]: value }))
  }

  const toggleShowPassword = (id: string) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const saveUsername = async (target: ManagedUser) => {
    const raw = (usernameDrafts[target.id] ?? '').trim().toLowerCase()
    if (!raw) {
      toast({
        title: 'Usuário inválido',
        description: 'O nome de login não pode ser vazio.',
        variant: 'destructive',
      })
      return
    }
    setSavingUsername((prev) => ({ ...prev, [target.id]: true }))
    try {
      await pb.collection('users').update(target.id, { username: raw })
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, username: raw } : u)))
      setUsernameDrafts((prev) => ({ ...prev, [target.id]: raw }))
      toast({
        title: 'Usuário atualizado',
        description: `Login de ${target.name} alterado para "${raw}".`,
      })
    } catch (err: any) {
      const data = err?.response?.data ?? err?.data
      const msg =
        data?.username?.message || err?.message || 'Não foi possível atualizar o nome de usuário.'
      toast({
        title: 'Erro ao atualizar usuário',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setSavingUsername((prev) => ({ ...prev, [target.id]: false }))
    }
  }

  const changePassword = async (target: ManagedUser) => {
    const raw = passwordDrafts[target.id] ?? ''
    const password = sanitizePassword(raw)

    if (password.length < 4) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter no mínimo 4 caracteres.',
        variant: 'destructive',
      })
      return
    }

    setSavingPassword((prev) => ({ ...prev, [target.id]: true }))
    try {
      await pb.collection('users').update(target.id, {
        password,
        passwordConfirm: password,
      })
      setPasswordDrafts((prev) => ({ ...prev, [target.id]: '' }))
      setShowPassword((prev) => ({ ...prev, [target.id]: false }))
      toast({
        title: 'Senha alterada',
        description: `Senha de ${target.name} foi atualizada com sucesso.`,
      })
    } catch (err: any) {
      const data = err?.response?.data ?? err?.data
      const msg =
        data?.password?.message ||
        data?.passwordConfirm?.message ||
        err?.message ||
        'Não foi possível alterar a senha.'
      toast({
        title: 'Erro ao alterar senha',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setSavingPassword((prev) => ({ ...prev, [target.id]: false }))
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <KeyRound className="h-5 w-5" /> Gerenciar Senhas
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={loadUsers}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Edite o nome de login (usuário) ou defina uma nova senha para cada usuário. As senhas são
          convertidas para minúsculas antes de salvar, conforme a tela de login.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Usuário (login)</TableHead>
              <TableHead>Nova senha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium align-top">
                  {u.name}
                  <div className="mt-1">
                    <Badge variant="secondary">{u.role}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground align-top break-all">
                  {u.email}
                </TableCell>
                <TableCell className="align-top">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="h-8 w-40"
                      value={usernameDrafts[u.id] ?? ''}
                      onChange={(e) => handleUsernameChange(u.id, e.target.value)}
                      placeholder="usuário"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 h-8"
                      disabled={savingUsername[u.id]}
                      onClick={() => saveUsername(u)}
                    >
                      <Save className="h-3.5 w-3.5" />
                      Salvar
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="align-top">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Input
                        type={showPassword[u.id] ? 'text' : 'password'}
                        autoCapitalize="none"
                        autoCorrect="off"
                        autoComplete="new-password"
                        className="h-8 w-40 pr-9"
                        value={passwordDrafts[u.id] ?? ''}
                        onChange={(e) => handlePasswordChange(u.id, e.target.value)}
                        placeholder="••••"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-8 w-8 p-0"
                        tabIndex={-1}
                        onClick={() => toggleShowPassword(u.id)}
                        aria-label={showPassword[u.id] ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword[u.id] ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      className="gap-1 h-8"
                      disabled={savingPassword[u.id]}
                      onClick={() => changePassword(u)}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Trocar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Carregando usuários...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
