import { useEffect, useState } from 'react'
import { KeyRound, Save, Eye, EyeOff, RefreshCw, Trash2, AlertTriangle } from 'lucide-react'
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  getUserCredentials,
  upsertUserCredential,
  deleteUserCredentialByUserId,
} from '@/services/user_credentials'

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

interface PasswordManagerSectionProps {
  onUserDeleted?: () => void
}

export default function PasswordManagerSection({ onUserDeleted }: PasswordManagerSectionProps) {
  const { toast } = useToast()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)

  // Map de senhas atuais obtidas da coleção user_credentials: userId -> password_plain
  const [currentPasswords, setCurrentPasswords] = useState<Record<string, string>>({})
  // Estado "mostrar/ocultar senha atual" por usuário
  const [showCurrentPassword, setShowCurrentPassword] = useState<Record<string, boolean>>({})

  // Rascunhos por usuário: username editável
  const [usernameDrafts, setUsernameDrafts] = useState<Record<string, string>>({})
  // Rascunhos por usuário: nova senha digitada
  const [passwordDrafts, setPasswordDrafts] = useState<Record<string, string>>({})
  // Estado "mostrar/ocultar nova senha" por usuário
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  // Flags de salvamento por usuário (username e senha independentes)
  const [savingUsername, setSavingUsername] = useState<Record<string, boolean>>({})
  const [savingPassword, setSavingPassword] = useState<Record<string, boolean>>({})

  // Diálogo de exclusão de usuário
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null)
  const [deletingUser, setDeletingUser] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Carregar usuários
      const usersData = await pb.collection('users').getFullList({
        sort: 'name',
        fields: 'id,name,email,username,role',
      })
      const rows = usersData as unknown as ManagedUser[]
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
      setShowCurrentPassword({})

      // 2. Carregar senhas em texto puro de user_credentials (apenas Adriano tem acesso)
      try {
        const creds = await getUserCredentials()
        const credsMap: Record<string, string> = {}
        for (const c of creds) {
          if (c.user) {
            credsMap[c.user] = c.password_plain
          }
        }
        setCurrentPasswords(credsMap)
      } catch (credErr) {
        console.warn('Não foi possível carregar user_credentials:', credErr)
        setCurrentPasswords({})
      }
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
    loadData()
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

  const toggleShowCurrentPassword = (id: string) => {
    setShowCurrentPassword((prev) => ({ ...prev, [id]: !prev[id] }))
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

    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter no mínimo 6 caracteres (exigência do sistema).',
        variant: 'destructive',
      })
      return
    }

    setSavingPassword((prev) => ({ ...prev, [target.id]: true }))
    try {
      // 1. Atualizar a senha no auth collection users
      await pb.collection('users').update(target.id, {
        password,
        passwordConfirm: password,
      })

      // 2. Gravar/atualizar o valor em texto puro na coleção user_credentials
      try {
        await upsertUserCredential(target.id, password)
        setCurrentPasswords((prev) => ({ ...prev, [target.id]: password }))
      } catch (credErr) {
        console.error('Erro ao sincronizar senha na coleção user_credentials:', credErr)
      }

      setPasswordDrafts((prev) => ({ ...prev, [target.id]: '' }))
      setShowPassword((prev) => ({ ...prev, [target.id]: false }))
      toast({
        title: 'Senha alterada',
        description: `Senha de ${target.name} foi atualizada com sucesso.`,
      })
    } catch (err: any) {
      const data = err?.response?.data ?? err?.data
      let msg = data?.password?.message || data?.passwordConfirm?.message

      if (!msg) {
        const rawResponse = err?.response?.data || err?.response || err?.data
        if (rawResponse && Object.keys(rawResponse).length > 0) {
          const rawString =
            typeof rawResponse === 'string' ? rawResponse : JSON.stringify(rawResponse)
          msg = `${err?.message || 'Erro ao alterar senha'}: ${rawString}`
        } else {
          msg = err?.message || 'Não foi possível alterar a senha.'
        }
      }

      toast({
        title: 'Erro ao alterar senha',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setSavingPassword((prev) => ({ ...prev, [target.id]: false }))
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    setDeletingUser(true)
    try {
      // 1. Excluir credencial em user_credentials se existir
      await deleteUserCredentialByUserId(userToDelete.id)

      // 2. Excluir registro do usuário em users
      await pb.collection('users').delete(userToDelete.id)

      toast({
        title: 'Conta excluída',
        description: `A conta de ${userToDelete.name} foi excluída permanentemente.`,
      })

      // Atualiza lista local
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
      setUserToDelete(null)

      if (onUserDeleted) {
        onUserDeleted()
      }
    } catch (err: any) {
      console.error('Erro ao excluir usuário:', err)
      toast({
        title: 'Erro ao excluir conta',
        description: err?.message || 'Não foi possível excluir o usuário.',
        variant: 'destructive',
      })
    } finally {
      setDeletingUser(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> Gerenciar Senhas
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Consulte a senha atual, edite o nome de login (usuário) ou defina uma nova senha para
            cada usuário. As senhas são convertidas para minúsculas antes de salvar, conforme a tela
            de login.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Usuário (login)</TableHead>
                <TableHead>Senha atual</TableHead>
                <TableHead>Nova senha</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const currentPass = currentPasswords[u.id]
                const isShowingCurrent = !!showCurrentPassword[u.id]

                return (
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
                          className="h-8 w-36"
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
                      {currentPass ? (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Input
                              type={isShowingCurrent ? 'text' : 'password'}
                              readOnly
                              tabIndex={-1}
                              className="h-8 w-36 pr-9 bg-muted/40 font-mono text-sm cursor-default select-all"
                              value={currentPass}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-8 w-8 p-0"
                              tabIndex={-1}
                              onClick={() => toggleShowCurrentPassword(u.id)}
                              aria-label={
                                isShowingCurrent ? 'Ocultar senha atual' : 'Mostrar senha atual'
                              }
                            >
                              {isShowingCurrent ? (
                                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic leading-8">
                          Não disponível (nunca trocada por aqui)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Input
                            type={showPassword[u.id] ? 'text' : 'password'}
                            autoCapitalize="none"
                            autoCorrect="off"
                            autoComplete="new-password"
                            className="h-8 w-36 pr-9"
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
                            aria-label={
                              showPassword[u.id] ? 'Ocultar nova senha' : 'Mostrar nova senha'
                            }
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
                    <TableCell className="align-top text-right">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1 h-8"
                        onClick={() => setUserToDelete(u)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {users.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Carregando usuários...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open && !deletingUser) {
            setUserToDelete(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Excluir conta de usuário
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-foreground/90">
              <p>
                Tem certeza de que deseja excluir permanentemente a conta de{' '}
                <strong>{userToDelete?.name}</strong> (<em>{userToDelete?.email}</em>)?
              </p>
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive-foreground space-y-1">
                <p className="font-semibold text-destructive">Atenção:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>A exclusão é permanente e não pode ser desfeita.</li>
                  <li>
                    Registros já vinculados a esse usuário (leads, contatos, pedidos, produção etc.){' '}
                    <strong>não são excluídos junto</strong>, mas podem ficar sem responsável.
                  </li>
                  <li>
                    Se a intenção for apenas bloquear o acesso ao sistema, é mais seguro usar a
                    opção <strong>&quot;Desativar&quot;</strong> na tabela de Usuários acima.
                  </li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingUser}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={deletingUser}>
              {deletingUser ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
