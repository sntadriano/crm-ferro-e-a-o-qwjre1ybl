import { useEffect, useState } from 'react'
import {
  Search,
  CheckCircle,
  XCircle,
  Edit2,
  RefreshCcw,
  AlertCircle,
  MoreHorizontal,
} from 'lucide-react'
import { RecordModel } from 'pocketbase'
import { format } from 'date-fns'
import { getContatosValidacao, aprovarContato, rejeitarContato } from '@/services/contatos'
import { useRealtime } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { ContatoDetailsDialog } from '@/components/contatos/ContatoDetailsDialog'
import { ValidacaoEditDialog } from '@/components/contatos/ValidacaoEditDialog'
import { Navigate } from 'react-router-dom'

export default function ValidacaoPage() {
  const { user } = useAuth()

  // Basic RBAC - only admin or Alex or Manager
  const isAdminOrGestor =
    user?.role === 'admin' || user?.role === 'gerente' || user?.name?.toLowerCase().includes('alex')

  const [contatos, setContatos] = useState<RecordModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [vendedores, setVendedores] = useState<RecordModel[]>([])

  // Filters and Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('pendente')
  const [vendedorFilter, setVendedorFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedContato, setSelectedContato] = useState<RecordModel | null>(null)

  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    if (isAdminOrGestor) {
      pb.collection('users')
        .getFullList({ filter: "role = 'vendedor' || role = 'admin' || role = 'gerente'" })
        .then(setVendedores)
        .catch(console.error)
    }
  }, [isAdminOrGestor])

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      let filterExp = []

      if (statusFilter !== 'all') filterExp.push(`status_validacao = '${statusFilter}'`)
      if (vendedorFilter !== 'all') filterExp.push(`usuario_id = '${vendedorFilter}'`)
      if (search) {
        const safeSearch = search.replace(/'/g, "\\'")
        filterExp.push(
          `(expand.usuario_id.name ~ '${safeSearch}' || expand.cliente_id.descricao ~ '${safeSearch}')`,
        )
      }
      if (dateFrom) filterExp.push(`data_contato >= '${dateFrom} 00:00:00'`)
      if (dateTo) filterExp.push(`data_contato <= '${dateTo} 23:59:59'`)

      const res = await getContatosValidacao(page, 20, filterExp.join(' && '), '-data_contato')
      setContatos(res.items)
      setTotalPages(res.totalPages)
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdminOrGestor) return
    const delayDebounceFn = setTimeout(() => {
      loadData()
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [page, search, statusFilter, vendedorFilter, dateFrom, dateTo, isAdminOrGestor])

  useRealtime('contatos', () => loadData())

  if (!isAdminOrGestor) {
    return <Navigate to="/dashboard" replace />
  }

  const handleAprovar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return
    setActionId(id)
    try {
      await aprovarContato(id, user.id)
      toast.success('Visita aprovada com sucesso')
      loadData()
    } catch (err) {
      toast.error('Erro ao aprovar visita')
    } finally {
      setActionId(null)
    }
  }

  const handleRejeitar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return
    setActionId(id)
    try {
      await rejeitarContato(id, user.id)
      toast.success('Visita rejeitada')
      loadData()
    } catch (err) {
      toast.error('Erro ao rejeitar visita')
    } finally {
      setActionId(null)
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'aprovado') return 'bg-green-100 text-green-800 border-green-200'
    if (status === 'rejeitado') return 'bg-red-100 text-red-800 border-red-200'
    return 'bg-amber-100 text-amber-800 border-amber-200'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1A3A52]">Painel de Validação</h1>
          <p className="text-muted-foreground">Analise, aprove ou rejeite visitas e contatos</p>
        </div>
      </div>

      <div className="bg-card p-4 rounded-lg shadow-subtle border grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por vendedor ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 min-h-[44px]"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="min-h-[44px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Status (Todos)</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="rejeitado">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
          <SelectTrigger className="min-h-[44px]">
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Vendedores (Todos)</SelectItem>
            {vendedores.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name || v.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2 lg:col-span-2">
          <div className="flex-1">
            <Input
              type="date"
              className="min-h-[44px]"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="Data Início"
            />
          </div>
          <div className="flex-1">
            <Input
              type="date"
              className="min-h-[44px]"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="Data Fim"
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="text-center py-16 bg-red-50 rounded-lg border border-red-200 shadow-subtle flex flex-col items-center justify-center space-y-4 animate-fade-in">
          <div className="bg-white p-4 rounded-full shadow-sm">
            <RefreshCcw className="h-8 w-8 text-red-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-red-800">Ocorreu um erro ao carregar os dados</h3>
            <p className="text-sm text-red-600">Verifique a conexão ou os filtros aplicados.</p>
          </div>
          <Button
            onClick={loadData}
            className="min-h-[44px] bg-[#FFC107] text-[#1A3A52] hover:bg-[#e0a800] font-bold"
          >
            Tentar novamente
          </Button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          <div className="hidden md:block rounded-md border shadow-subtle bg-white overflow-hidden">
            <div className="p-4 space-y-4">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
          <div className="md:hidden space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-md border shadow-subtle bg-white overflow-hidden animate-fade-in">
            <Table>
              <TableHeader className="bg-[#1A3A52] hover:bg-[#1A3A52]">
                <TableRow>
                  <TableHead className="text-white font-semibold">Vendedor</TableHead>
                  <TableHead className="text-white font-semibold">Cliente</TableHead>
                  <TableHead className="text-white font-semibold">Data e Hora</TableHead>
                  <TableHead className="text-white font-semibold">Resultado</TableHead>
                  <TableHead className="text-white font-semibold">Observações</TableHead>
                  <TableHead className="text-white font-semibold">Status</TableHead>
                  <TableHead className="text-white text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contatos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <AlertCircle className="h-12 w-12 text-muted-foreground" />
                        <h3 className="text-lg font-bold text-[#1A3A52]">
                          Nenhuma visita aguardando validação
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Todos os registros correspondentes aos filtros já foram processados ou não
                          existem.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  contatos.map((contato, i) => (
                    <TableRow
                      key={contato.id}
                      className={cn(
                        i % 2 === 0 ? 'bg-white' : 'bg-[#F5F5F5]',
                        'hover:bg-muted/50 transition-colors cursor-pointer group',
                      )}
                      onClick={() => {
                        setSelectedContato(contato)
                        setDetailsOpen(true)
                      }}
                    >
                      <TableCell className="font-medium text-[#1A3A52]">
                        {contato.expand?.usuario_id?.name || 'Sistema'}
                      </TableCell>
                      <TableCell>
                        {contato.expand?.cliente_id?.descricao || 'Desconhecido'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{format(new Date(contato.data_contato), 'dd/MM/yyyy')}</span>
                          <span className="text-muted-foreground">
                            {format(new Date(contato.data_contato), 'HH:mm')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {contato.resultado ? (
                          <span className="capitalize">{contato.resultado.replace(/_/g, ' ')}</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p
                          className="truncate text-muted-foreground"
                          title={contato.observacoes_resultado || contato.descricao}
                        >
                          {contato.observacoes_resultado || contato.descricao || '-'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('capitalize', getStatusColor(contato.status_validacao))}
                        >
                          {contato.status_validacao || 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {contato.status_validacao === 'pendente' ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700"
                                onClick={(e) => handleAprovar(contato.id, e)}
                                disabled={actionId === contato.id}
                              >
                                <CheckCircle className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Aprovar</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                                onClick={(e) => handleRejeitar(contato.id, e)}
                                disabled={actionId === contato.id}
                              >
                                <XCircle className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Rejeitar</span>
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedContato(contato)
                                setEditOpen(true)
                              }}
                            >
                              <Edit2 className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Editar</span>
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedContato(contato)
                                  setDetailsOpen(true)
                                }}
                              >
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedContato(contato)
                                  setEditOpen(true)
                                }}
                              >
                                Editar Registro
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden animate-fade-in">
            {contatos.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-subtle border flex flex-col items-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="font-bold text-[#1A3A52]">Nenhuma visita aguardando validação</h3>
              </div>
            ) : (
              contatos.map((contato) => (
                <Card
                  key={contato.id}
                  className="shadow-subtle hover:border-[#4A90E2] border-border/60 transition-colors overflow-hidden"
                  onClick={() => {
                    setSelectedContato(contato)
                    setDetailsOpen(true)
                  }}
                >
                  <CardContent className="p-0">
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-[#1A3A52] line-clamp-1 text-base">
                            {contato.expand?.usuario_id?.name || 'Sistema'}
                          </div>
                          <div className="text-sm text-muted-foreground mt-0.5">
                            Cliente: {contato.expand?.cliente_id?.descricao || 'Desconhecido'}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'capitalize shrink-0 ml-2',
                            getStatusColor(contato.status_validacao),
                          )}
                        >
                          {contato.status_validacao || 'Pendente'}
                        </Badge>
                      </div>

                      <div className="text-sm">
                        <span className="font-medium">Data:</span>{' '}
                        {format(new Date(contato.data_contato), 'dd/MM/yyyy HH:mm')}
                      </div>

                      {contato.resultado && (
                        <div className="text-sm">
                          <span className="font-medium">Resultado:</span>{' '}
                          <span className="capitalize">{contato.resultado.replace(/_/g, ' ')}</span>
                        </div>
                      )}

                      <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                        {contato.status_validacao === 'pendente' ? (
                          <>
                            <Button
                              className="flex-1 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 min-h-[40px]"
                              onClick={(e) => handleAprovar(contato.id, e)}
                              disabled={actionId === contato.id}
                            >
                              Aprovar
                            </Button>
                            <Button
                              className="flex-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 min-h-[40px]"
                              onClick={(e) => handleRejeitar(contato.id, e)}
                              disabled={actionId === contato.id}
                            >
                              Rejeitar
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full min-h-[40px]"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedContato(contato)
                              setEditOpen(true)
                            }}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={
                      page === 1
                        ? 'pointer-events-none opacity-50 min-h-[44px] text-[#1A3A52]'
                        : 'cursor-pointer min-h-[44px] hover:bg-[#1A3A52]/10 hover:text-[#1A3A52] text-[#1A3A52]'
                    }
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="text-sm font-semibold text-[#1A3A52] px-4">
                    Página {page} de {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={
                      page === totalPages
                        ? 'pointer-events-none opacity-50 min-h-[44px] text-[#1A3A52]'
                        : 'cursor-pointer min-h-[44px] hover:bg-[#1A3A52]/10 hover:text-[#1A3A52] text-[#1A3A52]'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {selectedContato && (
        <ContatoDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          contato={selectedContato}
          onEdit={() => {
            setDetailsOpen(false)
            setEditOpen(true)
          }}
        />
      )}

      <ValidacaoEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        contato={selectedContato}
        onSuccess={loadData}
      />
    </div>
  )
}
